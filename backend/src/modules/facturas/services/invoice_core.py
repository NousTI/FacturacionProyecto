"""
Servicio Core de Facturas.
Maneja el CRUD básico y la integridad de los snapshots.
"""

from uuid import UUID
from datetime import datetime, date
from typing import Optional, List
from fastapi import Depends

from ..repository import RepositorioFacturas
from ..schemas import FacturaCreacion, FacturaActualizacion, FacturaListadoFiltros
from ...clientes.services import ServicioClientes
from ...establecimientos.service import ServicioEstablecimientos
from ...puntos_emision.service import ServicioPuntosEmision
from ...puntos_emision.repository import RepositorioPuntosEmision
from ...empresas.services import ServicioEmpresas
from src.constants.enums import AuthKeys
from src.errors.app_error import AppError

class ServicioFacturaCore:
    def __init__(
        self, 
        repo: RepositorioFacturas = Depends(),
        cliente_service: ServicioClientes = Depends(),
        establecimiento_service: ServicioEstablecimientos = Depends(),
        punto_emision_service: ServicioPuntosEmision = Depends(),
        punto_emision_repo: RepositorioPuntosEmision = Depends(),
        empresa_service: ServicioEmpresas = Depends()
    ):
        self.repo = repo
        self.cliente_service = cliente_service
        self.establecimiento_service = establecimiento_service
        self.punto_emision_service = punto_emision_service
        self.punto_emision_repo = punto_emision_repo
        self.empresa_service = empresa_service

    def crear_borrador(self, datos: FacturaCreacion, usuario_actual: dict, snapshots_logic: dict):
        """Lógica para crear la factura en base de datos con sus snapshots."""
        # Se asume que las validaciones de negocio ya se hicieron en el orquestador
        payload = datos.model_dump()
        
        # 1. Extraer detalles y datos de pago que no van en la tabla principal
        detalles_datos = payload.pop('detalles', [])
        pago_data = {
            "forma_pago_sri": payload.pop('forma_pago_sri', '01'),
            "valor": payload.get('total', 0),
            "plazo": payload.pop('plazo', 0),
            "unidad_tiempo": payload.pop('unidad_tiempo', 'DIAS')
        }
        
        # Inyectar la hora actual si no se proporciona una o si llega a las 00:00:00
        fecha_emision = payload.get('fecha_emision')
        ahora = datetime.now()
        
        # BLINDAJE: Si es date (pero no datetime) o es datetime con hora exacto 00:00:00
        # forzamos la hora actual para el guardado en TIMESTAMPTZ
        if isinstance(fecha_emision, datetime):
            if fecha_emision.hour == 0 and fecha_emision.minute == 0 and fecha_emision.second == 0:
                payload['fecha_emision'] = ahora
        elif isinstance(fecha_emision, date):
            # Es un objeto date (sin hora), combinamos con la hora actual
            payload['fecha_emision'] = datetime.combine(fecha_emision, ahora.time())
        elif not fecha_emision:
            payload['fecha_emision'] = ahora

        # Asignar fecha_vencimiento dinámica basada en el plazo si no fue proporcionada explícitamente
        if not payload.get('fecha_vencimiento'):
            from dateutil.relativedelta import relativedelta
            fecha_venc = payload['fecha_emision']
            plazo = int(pago_data.get('plazo', 0))
            unidad = str(pago_data.get('unidad_tiempo', 'DIAS')).upper()
            
            if plazo > 0:
                if unidad == 'DIAS':
                    fecha_venc += relativedelta(days=plazo)
                elif unidad == 'MESES':
                    fecha_venc += relativedelta(months=plazo)
                elif unidad in ['AÑOS', 'ANOS']:
                    fecha_venc += relativedelta(years=plazo)
            
            payload['fecha_vencimiento'] = fecha_venc

        payload.update({
            "estado": 'BORRADOR',
            "estado_pago": datos.estado_pago or 'PENDIENTE',
            **snapshots_logic
        })
        
        # 3. Crear cabecera de la factura
        nueva = self.repo.crear_factura(payload)
        if not nueva:
            raise AppError("Error al crear la factura", 500, "DB_ERROR")
            
        # 4. Guardar los detalles (productos) uno a uno
        factura_id = nueva['id']
        detalles_guardados = []
        for d in detalles_datos:
            det_payload = d if isinstance(d, dict) else d.model_dump()
            det_payload['factura_id'] = str(factura_id)
            
            # Quitar IDs si vienen del frontend para evitar conflictos de insert
            det_payload.pop('id', None)

            # Asegurar cálculos básicos
            cantidad = float(det_payload.get('cantidad', 1))
            precio = float(det_payload.get('precio_unitario', 0))
            descuento = float(det_payload.get('descuento', 0))
            subtotal_linea = round((cantidad * precio) - descuento, 2)
            
            det_payload['subtotal'] = subtotal_linea
            det_payload['base_imponible'] = subtotal_linea
            
            # Mapeo exacto SRI: Código -> Tarifa
            t_iva = str(det_payload.get('tipo_iva', '0'))
            mapping = {'0': 0.0, '2': 12.0, '3': 14.0, '4': 15.0, '5': 5.0, '10': 13.0}
            rate_percent = mapping.get(t_iva, 0.0)
            
            det_payload['tarifa_iva'] = rate_percent
            det_payload['codigo_impuesto'] = '2' # 2=IVA 
            det_payload['valor_iva'] = round(subtotal_linea * (rate_percent / 100.0), 2)
            
            det_guardado = self.repo.crear_detalle(det_payload)
            if det_guardado:
                detalles_guardados.append(det_guardado)

        # 5. RECALCULO CRÍTICO: Sincronizar cabecera con productos reales
        self.recalcular_totales(factura_id)
        
        # Obtener la factura actualizada con los totales reales
        factura_final = self.obtener_factura(factura_id)
        factura_final['_pago_inicial'] = pago_data
        factura_final['detalles'] = detalles_guardados
        return factura_final

    def obtener_factura(self, id: UUID) -> dict:
        factura = self.repo.obtener_por_id(id)
        if not factura:
            raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
        return factura

    def actualizar_factura(self, id: UUID, datos_dict: dict):
        return self.repo.actualizar_factura(id, datos_dict)

    def obtener_detalle_completo(self, id: UUID) -> dict:
        """Obtiene una factura con sus detalles y formas de pago."""
        factura = self.obtener_factura(id)
        detalles = self.repo.listar_detalles(id)
        
        # Obtener formas de pago desde el repositorio inyectado si es posible, 
        # o dejar que el orquestador lo maneje. Por ahora, el core solo maneja cabecera y detalles.
        factura['detalles'] = detalles
        return factura

    def recalcular_totales(self, factura_id: UUID):
        """
        Recalcula los totales de la factura basándose en sus detalles actuales.
        Sincroniza los campos monetarios de la tabla facturas.
        """
        detalles = self.repo.listar_detalles(factura_id)
        factura = self.obtener_factura(factura_id)

        subtotal_sin_iva = 0
        subtotal_con_iva = 0
        subtotal_no_objeto_iva = 0
        subtotal_exento_iva = 0
        total_iva = 0
        descuento_detalles = 0

        for d in detalles:
            subtotal_detalle = float(d.get('subtotal', 0))
            valor_iva_detalle = float(d.get('valor_iva', 0))
            tipo_iva = d.get('tipo_iva', '0')
            
            # Clasificar según el tipo de IVA del SRI (0=0%, 2=12%, 3=14%, 4=15%, 5=5%, 10=13%)
            tipo_iva_str = str(tipo_iva).strip()
            
            # Códigos que representan IVA con valor (positivos)
            if tipo_iva_str in ['2', '3', '4', '5', '10']:
                subtotal_con_iva += subtotal_detalle
                total_iva += valor_iva_detalle
            # Códigos que representan IVA 0%
            elif tipo_iva_str == '0':
                subtotal_sin_iva += subtotal_detalle
            # Códigos que representan No Objeto o Exento
            elif tipo_iva_str in ['6', 'NO_OBJETO']:
                subtotal_no_objeto_iva += subtotal_detalle
            elif tipo_iva_str in ['7', 'EXENTO']:
                subtotal_exento_iva += subtotal_detalle
            else:
                # Fallback: asumimos sin IVA si no se reconoce
                subtotal_sin_iva += subtotal_detalle
            
            descuento_detalles += float(d.get('descuento', 0))
        
        # Otros valores actuales de la factura
        propina = float(factura.get('propina', 0))
        ice = float(factura.get('ice', 0))
        retencion_iva = float(factura.get('retencion_iva', 0))
        retencion_renta = float(factura.get('retencion_renta', 0))
        descuento_global = float(factura.get('descuento', 0))
        
        # Total = suma de subtotales + iva + ice + propina - descuento - retenciones
        total_calculado = (
            subtotal_sin_iva + 
            subtotal_con_iva + 
            subtotal_no_objeto_iva + 
            subtotal_exento_iva + 
            total_iva + 
            ice + 
            propina - 
            descuento_global - 
            retencion_iva - 
            retencion_renta
        )
        
        # Total Sin Impuestos = Suma de todas las bases antes de IVA
        total_sin_impuestos = subtotal_sin_iva + subtotal_con_iva + subtotal_no_objeto_iva + subtotal_exento_iva

        update_data = {
            "subtotal_sin_iva": round(subtotal_sin_iva, 2),
            "subtotal_con_iva": round(subtotal_con_iva, 2),
            "subtotal_no_objeto_iva": round(subtotal_no_objeto_iva, 2),
            "subtotal_exento_iva": round(subtotal_exento_iva, 2),
            "total_sin_impuestos": round(total_sin_impuestos, 2),
            "iva": round(total_iva, 2),
            "ice": round(ice, 2),
            "total": round(total_calculado, 2)
        }
        
        return self.repo.actualizar_factura(factura_id, update_data)

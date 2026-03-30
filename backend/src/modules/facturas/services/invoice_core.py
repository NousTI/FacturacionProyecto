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
        
        # Extraer variables que no pertenecen a la tabla facturas
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

        payload.update({
            "estado": 'BORRADOR',
            "estado_pago": datos.estado_pago or 'PENDIENTE',
            **snapshots_logic
        })
        
        nueva = self.repo.crear_factura(payload)
        if not nueva:
            raise AppError("Error al crear la factura", 500, "DB_ERROR")
            
        # Pasar esta data en memoria para que el orquestador final (ServiceFactura) la guarde
        nueva['_pago_inicial'] = pago_data
        return nueva

    def obtener_factura(self, id: UUID) -> dict:
        factura = self.repo.obtener_por_id(id)
        if not factura:
            raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
        return factura

    def actualizar_factura(self, id: UUID, datos_dict: dict):
        return self.repo.actualizar_factura(id, datos_dict)

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
            
            # Clasificar según el tipo de IVA (Solo 15% y 0% permitidos)
            tipo_iva_str = str(tipo_iva).upper()
            if tipo_iva_str in ['15', '10']:
                subtotal_con_iva += subtotal_detalle
                total_iva += valor_iva_detalle
            elif tipo_iva_str in ['0']:
                subtotal_sin_iva += subtotal_detalle
            elif 'NO_OBJETO' in tipo_iva_str or tipo_iva_str == '6':
                subtotal_no_objeto_iva += subtotal_detalle
            elif 'EXENTO' in tipo_iva_str or tipo_iva_str == '7':
                subtotal_exento_iva += subtotal_detalle
            else:
                # Fallback por si acaso
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
        
        update_data = {
            "subtotal_sin_iva": round(subtotal_sin_iva, 2),
            "subtotal_con_iva": round(subtotal_con_iva, 2),
            "subtotal_no_objeto_iva": round(subtotal_no_objeto_iva, 2),
            "subtotal_exento_iva": round(subtotal_exento_iva, 2),
            "iva": round(total_iva, 2),
            "ice": round(ice, 2),
            "total": round(total_calculado, 2)
        }
        
        return self.repo.actualizar_factura(factura_id, update_data)

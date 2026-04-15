from uuid import UUID
from datetime import datetime
from fastapi import Depends
from typing import List, Optional

from ...errors.app_error import AppError
from .repository import RepositorioNotasCredito
from .schemas import NotaCreditoCreacion, NotaCreditoDetalleCreacion
from ..facturas.repository import RepositorioFacturas
from ..cuentas_cobrar.repository import RepositorioCuentasCobrar
from ..puntos_emision.repository import RepositorioPuntosEmision
from ..sri.nota_credito.service import ServicioSRINotaCredito

class ServicioNotaCredito:
    """
    Orquestador de lógica de negocio para Notas de Crédito.
    Maneja la transformación de facturas, emisión SRI y anulación automática.
    """
    
    def __init__(
        self,
        repo: RepositorioNotasCredito = Depends(),
        factura_repo: RepositorioFacturas = Depends(),
        cuentas_cobrar_repo: RepositorioCuentasCobrar = Depends(),
        punto_repo: RepositorioPuntosEmision = Depends(),
        sri_service: ServicioSRINotaCredito = Depends()
    ):
        self.repo = repo
        self.factura_repo = factura_repo
        self.cuentas_cobrar_repo = cuentas_cobrar_repo
        self.punto_repo = punto_repo
        self.sri_service = sri_service

    def anular_factura_con_nc(self, factura_id: UUID, motivo: str, usuario_actual: dict):
        """
        Proceso completo de anulación de factura mediante Nota de Crédito.
        """
        # 1. Validar factura original
        factura = self.factura_repo.obtener_por_id(factura_id)
        if not factura:
            raise AppError("Factura no encontrada", 404, "NOT_FOUND")
            
        if factura['estado'] != 'AUTORIZADA':
            raise AppError(
                f"No se puede anular la factura. Estado actual: {factura['estado']}. Solo facturas AUTORIZADAS pueden anularse con NC.", 
                400, "VAL_ERROR"
            )

        # 2. Verificar si ya tiene una NC autorizada
        ncs_previas = self.repo.listar_notas_credito(factura_id=factura_id)
        for old_nc in ncs_previas:
            if old_nc['estado_sri'] == 'AUTORIZADO':
                raise AppError("Esta factura ya tiene una Nota de Crédito AUTORIZADA.", 409, "ALREADY_ANNULLED")

        # 3. Obtener Secuencial Real y atomizar asignación
        punto_id = factura['punto_emision_id']
        sec_num = self.punto_repo.incrementar_secuencial(punto_id, 'nota_credito')
        if not sec_num:
            raise AppError("No se pudo obtener el secuencial del punto de emisión", 500, "SRI_SEQUENTIAL_ERROR")
        
        # Formatear a 9 dígitos (000000001)
        sec_str = str(sec_num).zfill(9)

        # 4. Mapear datos para la Nota de Crédito (Anulación Total)
        f_num = factura['numero_factura'] # 001-001-000000001
        parts = f_num.split('-')
        
        nc_data = {
            "factura_id": factura_id,
            "establecimiento": parts[0],
            "punto_emision": parts[1],
            "secuencial": sec_str,
            "cod_doc_modificado": "01",
            "num_doc_modificado": f_num,
            "fecha_emision_docs_modificado": factura['fecha_emision'],
            "motivo_anulacion": motivo,
            "subtotal_15_iva": factura['subtotal_con_iva'],
            "subtotal_0_iva": factura.get('subtotal_sin_iva', 0),
            "iva_total": factura['iva'],
            "valor_total_anulado": factura['total'],
            "ambiente": 1, # Siempre pruebas forzado
            "tipo_emision": 1
        }

        # 4. Crear NC en base de datos local
        nueva_nc = self.repo.crear_nota_credito(nc_data)
        if not nueva_nc:
            raise AppError("Error al registrar la Nota de Crédito localmente", 500, "DB_ERROR")

        # 5. Mapear y crear detalles (Anulación Total)
        detalles_fac = self.factura_repo.listar_detalles(factura_id)
        for det in detalles_fac:
            det_nc = {
                "nota_credito_id": nueva_nc['id'],
                "factura_detalle_id": det['id'],
                "producto_id": det['producto_id'],
                "codigo_producto": det['codigo_producto'],
                "nombre": det['nombre'],
                "cantidad": det['cantidad'],
                "precio_unitario": det['precio_unitario'],
                "descuento": det['descuento'],
                "subtotal": det['subtotal'],
                "valor_iva": det['valor_iva']
            }
            self.repo.crear_detalle(det_nc)

        # 6. Emitir ante el SRI (Orquestación Modular)
        res_sri = self.sri_service.emitir_nota_credito_sri(nueva_nc['id'], usuario_actual)
        
        # 7. ANULACIÓN AUTOMÁTICA (Si el SRI autorizó)
        if res_sri.get('estado') == 'AUTORIZADO' or res_sri.get('estado') == 'AUTORIZADA':
            # Actualizar Factura original a ANULADA
            self.factura_repo.actualizar_factura(factura_id, {
                "estado": "ANULADA",
                "estado_pago": "ANULADO",
                "razon_anulacion": f"Anulada por NC: {motivo}"
            })
            
            # Poner saldo en 0 en Cuentas por Cobrar (Cumpliendo restricción de consistencia)
            self.cuentas_cobrar_repo.actualizar_por_factura(factura_id, {
                "monto_total": 0,
                "monto_pagado": 0,
                "saldo_pendiente": 0,
                "estado": "anulado"
            })
            
        return {
            "nota_credito": self.repo.obtener_por_id(nueva_nc['id']),
            "resultado_sri": res_sri
        }

    def reintentar_emision_nc(self, nc_id: UUID, usuario_actual: dict):
        """
        Reintenta el envío de una Nota de Crédito que previamente falló.
        Mantiene el mismo secuencial para no dejar huecos en la contabilidad.
        """
        nc = self.repo.obtener_por_id(nc_id)
        if not nc:
            raise AppError("Nota de Crédito no encontrada", 404, "NOT_FOUND")
            
        if nc['estado_sri'] == 'AUTORIZADO':
            raise AppError("Esta Nota de Crédito ya fue AUTORIZADA.", 409, "ALREADY_AUTHORIZED")

        # Emitir ante el SRI (Orquestación Modular)
        res_sri = self.sri_service.emitir_nota_credito_sri(nc_id, usuario_actual)
        
        # Sincronización automática si ahora sí tiene éxito
        if res_sri.get('estado') == 'AUTORIZADO' or res_sri.get('estado') == 'AUTORIZADA':
            self.factura_repo.actualizar_factura(nc['factura_id'], {
                "estado": "ANULADA",
                "estado_pago": "ANULADO",
                "razon_anulacion": f"Anulada por NC: {nc['motivo_anulacion']}"
            })
            self.cuentas_cobrar_repo.actualizar_por_factura(nc['factura_id'], {
                "monto_total": 0,
                "monto_pagado": 0,
                "saldo_pendiente": 0,
                "estado": "anulado"
            })
            
        return {
            "nota_credito": self.repo.obtener_por_id(nc_id),
            "resultado_sri": res_sri
        }

    def consultar_nc_sri(self, nc_id: UUID, usuario_actual: dict):
        """
        Consulta el estado de una NC en el SRI y actualiza si ya fue autorizada.
        """
        nc = self.repo.obtener_por_id(nc_id)
        if not nc: raise AppError("Nota de Crédito no encontrada", 404, "NOT_FOUND")

        # Consultar al SRI
        res_sri = self.sri_service.consultar_estado_sri_nc(nc_id, usuario_actual)
        
        # Sincronización automática tras consulta exitosa
        if res_sri.get('estado') == 'AUTORIZADO' or res_sri.get('estado') == 'AUTORIZADA':
             self.factura_repo.actualizar_factura(nc['factura_id'], {
                "estado": "ANULADA",
                "estado_pago": "ANULADO",
                "razon_anulacion": f"Anulada por NC: {nc['motivo_anulacion']} (Consulta)"
            })
             # Poner saldo en 0 en Cuentas por Cobrar
             self.cuentas_cobrar_repo.actualizar_por_factura(nc['factura_id'], {
                "monto_total": 0,
                "monto_pagado": 0,
                "saldo_pendiente": 0,
                "estado": "anulado"
            })
            
        return {
            "nota_credito": self.repo.obtener_por_id(nc_id),
            "resultado_sri": res_sri
        }

    def obtener_nc_completa(self, nc_id: UUID):
        """Obtiene cabecera y detalles de una NC."""
        nc = self.repo.obtener_por_id(nc_id)
        if not nc: raise AppError("Nota de Crédito no encontrada", 404, "NOT_FOUND")
        
        nc['detalles'] = self.repo.listar_detalles(nc_id)
        nc['logs'] = self.repo.listar_logs_emision(nc_id)
        nc['autorizacion'] = self.repo.obtener_autorizacion(nc_id)
        return nc

    def listar_por_empresa(self, empresa_id: UUID, limit: int = 100, offset: int = 0):
        return self.repo.listar_notas_credito(empresa_id=empresa_id, limit=limit, offset=offset)

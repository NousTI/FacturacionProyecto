from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from datetime import timedelta

from .repository import RepositorioFormasPago
from .schemas import FormaPagoCreacion, FormaPagoActualizacion
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

# This will be updated once Facturas is migrated
# For now, we might need a reference to the Repo to avoid circularity in Services
# Or use the legacy or future service.
# Letting the Service receive the Repo dependency.

class ServicioFormasPago:
    def __init__(
        self,
        repo: RepositorioFormasPago = Depends()
    ):
        self.repo = repo

    def crear_pago(self, datos: FormaPagoCreacion, usuario_actual: dict, factura_repo):
        # 1. Verify Factura
        factura = factura_repo.get_by_id(datos.factura_id)
        if not factura:
             raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
        
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            empresa_id = usuario_actual.get('empresa_id')
            if str(factura['empresa_id']) != str(empresa_id):
                 raise AppError("No tiene permiso para agregar pagos a esta factura", 403, "AUTH_FORBIDDEN")
        
        if factura['estado'] in ['EMITIDA', 'ANULADA']:
              raise AppError("No se pueden modificar formas de pago de una factura emitida o anulada", 400, "VAL_ERROR")

        return self.repo.crear_pago(datos.model_dump())

    def listar_por_factura(self, factura_id: UUID, usuario_actual: dict, factura_repo):
        factura = factura_repo.get_by_id(factura_id)
        if not factura:
             raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
             
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            empresa_id = usuario_actual.get('empresa_id')
            if str(factura['empresa_id']) != str(empresa_id):
                 raise AppError("No tiene permiso para ver pagos de esta factura", 403, "AUTH_FORBIDDEN")
                 
        return self.repo.listar_por_factura(factura_id)

    def actualizar_pago(self, id: UUID, datos: FormaPagoActualizacion, usuario_actual: dict, factura_repo):
        pago = self.repo.obtener_por_id(id)
        if not pago:
             raise AppError("Forma de pago no encontrada", 404, "FORMA_PAGO_NOT_FOUND")
             
        factura = factura_repo.get_by_id(pago['factura_id'])
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            empresa_id = usuario_actual.get('empresa_id')
            if str(factura['empresa_id']) != str(empresa_id):
                 raise AppError("No tiene permiso para editar este pago", 403, "AUTH_FORBIDDEN")
                 
        if factura['estado'] not in ['BORRADOR', 'PENDIENTE']:
              raise AppError("No se puede editar pagos de facturas procesadas", 400, "VAL_ERROR")

        return self.repo.actualizar_pago(id, datos.model_dump(exclude_unset=True))

    def eliminar_pago(self, id: UUID, usuario_actual: dict, factura_repo):
        pago = self.repo.obtener_por_id(id)
        if not pago:
             raise AppError("Forma de pago no encontrada", 404, "FORMA_PAGO_NOT_FOUND")
             
        factura = factura_repo.get_by_id(pago['factura_id'])
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            empresa_id = usuario_actual.get('empresa_id')
            if str(factura['empresa_id']) != str(empresa_id):
                 raise AppError("No tiene permiso para eliminar este pago", 403, "AUTH_FORBIDDEN")
        
        if factura['estado'] not in ['BORRADOR', 'PENDIENTE']:
              raise AppError("No se puede eliminar pagos de facturas procesadas", 400, "VAL_ERROR")

        return self.repo.eliminar_pago(id)

    def validar_pagos_factura(self, factura_id: UUID, factura_repo):
        factura = factura_repo.get_by_id(factura_id)
        if not factura:
            raise AppError("Factura no encontrada", 404, "FACTURA_NOT_FOUND")
            
        pagos = self.repo.listar_por_factura(factura_id)
        total_pagos = sum([p['valor'] for p in pagos])
        total_factura = factura['total']
        
        if total_pagos != total_factura:
             raise AppError(f"La suma de formas de pago ({total_pagos}) no coincide con el total de la factura ({total_factura})", 400, "VAL_ERROR")
        return True

    def procesar_pagos_emision(self, factura_id: UUID, usuario_actual: dict, factura_repo, cuenta_cobrar_service):
        self.validar_pagos_factura(factura_id, factura_repo)
        
        pagos = self.repo.listar_por_factura(factura_id)
        factura = factura_repo.get_by_id(factura_id)
        
        for p in pagos:
            if p.get('plazo') and p['plazo'] > 0:
                fecha_emision = factura['fecha_emision']
                plazo_days = p['plazo']
                
                unidad = p.get('unidad_tiempo', 'dias').lower()
                if 'mes' in unidad:
                    plazo_days = plazo_days * 30 
                
                fecha_vencimiento = fecha_emision + timedelta(days=plazo_days)
                
                cc_data = {
                    "factura_id": factura_id,
                    "cliente_id": factura['cliente_id'],
                    "numero_documento": factura['numero_factura'],
                    "fecha_emision": fecha_emision,
                    "fecha_vencimiento": fecha_vencimiento,
                    "monto_total": p['valor'],
                    "observaciones": f"Generado automáticamente por Forma de Pago: {p['forma_pago']}"
                }
                
                cuenta_cobrar_service.create(cc_data, usuario_actual)

from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from decimal import Decimal

from .repository import RepositorioPagosGasto
from .schemas import PagoGastoCreacion, PagoGastoActualizacion
from ..gastos.repository import RepositorioGastos
from ...constants.enums import AuthKeys
from ...errors.app_error import AppError

class ServicioPagosGasto:
    def __init__(
        self, 
        repo: RepositorioPagosGasto = Depends(),
        gasto_repo: RepositorioGastos = Depends()
    ):
        self.repo = repo
        self.gasto_repo = gasto_repo

    def crear_pago(self, datos: PagoGastoCreacion, usuario_actual: dict):
        gasto = self.gasto_repo.obtener_por_id(datos.gasto_id)
        if not gasto:
             raise AppError("Gasto no encontrado", 404, "GASTO_NOT_FOUND")
             
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            if str(gasto['empresa_id']) != str(usuario_actual.get('empresa_id')):
                 raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
                 
        usuario_id = datos.usuario_id or usuario_actual.get('id')
        
        payload = datos.model_dump()
        payload['usuario_id'] = usuario_id

        nuevo = self.repo.crear_pago(payload)
        if not nuevo:
            raise AppError("Error al registrar pago", 500, "DB_ERROR")

        # Update Gasto state
        total_pagado = self.repo.obtener_total_pagado(datos.gasto_id)
        gasto_total = Decimal(str(gasto['total']))
        
        if total_pagado >= gasto_total:
            self.gasto_repo.actualizar_gasto(datos.gasto_id, {"estado_pago": "pagado"})
            
        return nuevo

    def listar_pagos(self, gasto_id: Optional[UUID], usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if gasto_id:
             gasto = self.gasto_repo.obtener_por_id(gasto_id)
             if not is_superadmin and str(gasto['empresa_id']) != str(usuario_actual.get('empresa_id')):
                  raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
             return self.repo.listar_por_gasto(gasto_id)
             
        if not is_superadmin:
             raise AppError("Acceso denegado", 403, "AUTH_FORBIDDEN")
        return self.repo.listar_todos()

    def actualizar_pago(self, id: UUID, datos: PagoGastoActualizacion, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo Superadmin puede actualizar pagos", 403, "AUTH_FORBIDDEN")
            
        pago = self.repo.obtener_por_id(id)
        if not pago:
             raise AppError("Pago no encontrado", 404, "PAGO_NOT_FOUND")
             
        actualizado = self.repo.actualizar_pago(id, datos.model_dump(exclude_unset=True))
        
        # Sync Gasto state
        total_pagado = self.repo.obtener_total_pagado(pago['gasto_id'])
        gasto = self.gasto_repo.obtener_por_id(pago['gasto_id'])
        gasto_total = Decimal(str(gasto['total']))
        new_status = "pagado" if total_pagado >= gasto_total else "pendiente"
        self.gasto_repo.actualizar_gasto(pago['gasto_id'], {"estado_pago": new_status})
        
        return actualizado

    def eliminar_pago(self, id: UUID, usuario_actual: dict):
        if not usuario_actual.get(AuthKeys.IS_SUPERADMIN):
            raise AppError("Solo Superadmin puede eliminar pagos", 403, "AUTH_FORBIDDEN")

        pago = self.repo.obtener_por_id(id)
        if not pago:
             raise AppError("Pago no encontrado", 404, "PAGO_NOT_FOUND")
             
        gasto_id = pago['gasto_id']
        self.repo.eliminar_pago(id)
        
        # Sync Gasto state
        total_pagado = self.repo.obtener_total_pagado(gasto_id)
        gasto = self.gasto_repo.obtener_por_id(gasto_id)
        gasto_total = Decimal(str(gasto['total']))
        new_status = "pagado" if total_pagado >= gasto_total else "pendiente"
        self.gasto_repo.actualizar_gasto(gasto_id, {"estado_pago": new_status})
        
        return True

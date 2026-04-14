from fastapi import Depends
from uuid import UUID
from typing import List, Optional
from decimal import Decimal

from .pago_repository import RepositorioPagosGasto
from .pago_schemas import PagoGastoCreacion, PagoGastoActualizacion
from .gasto_repository import RepositorioGastos
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
                 
        user_id = datos.user_id or usuario_actual.get('id')
        
        payload = datos.model_dump()
        payload['user_id'] = user_id

        nuevo = self.repo.crear_pago(payload)
        if not nuevo:
            raise AppError("Error al registrar pago", 500, "DB_ERROR")

        # Update Gasto state
        total_pagado = self.repo.obtener_total_pagado(datos.gasto_id)
        gasto_total = Decimal(str(gasto['total']))
        
        if total_pagado >= gasto_total:
            self.gasto_repo.actualizar_gasto(datos.gasto_id, {"estado_pago": "pagado"})
        elif total_pagado > 0:
            self.gasto_repo.actualizar_gasto(datos.gasto_id, {"estado_pago": "parcial"})
        else:
            self.gasto_repo.actualizar_gasto(datos.gasto_id, {"estado_pago": "pendiente"})
            
        return nuevo

    def listar_pagos(self, gasto_id: Optional[UUID], usuario_actual: dict):
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        
        if gasto_id:
             gasto = self.gasto_repo.obtener_por_id(gasto_id)
             if not gasto:
                  raise AppError("Gasto no encontrado", 404, "GASTO_NOT_FOUND")
             if not is_superadmin and str(gasto['empresa_id']) != str(usuario_actual.get('empresa_id')):
                  raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
             return self.repo.listar_por_gasto(gasto_id)
             
        if is_superadmin:
             return self.repo.listar_todos()
        
        empresa_id = usuario_actual.get('empresa_id')
        if not empresa_id:
             raise AppError("Empresa no identificada", 400, "EMPRESA_MISSING")
             
        return self.repo.listar_por_empresa(empresa_id)

    def actualizar_pago(self, id: UUID, datos: PagoGastoActualizacion, usuario_actual: dict):
        pago = self.repo.obtener_por_id(id)
        if not pago:
             raise AppError("Pago no encontrado", 404, "PAGO_NOT_FOUND")

        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            gasto = self.gasto_repo.obtener_por_id(pago['gasto_id'])
            if not gasto or str(gasto['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
        else:
            gasto = self.gasto_repo.obtener_por_id(pago['gasto_id'])

        # Bloqueo estricto del monto para cualquier pago existente
        update_data = datos.model_dump(exclude_unset=True)
        if 'monto' in update_data and Decimal(str(update_data['monto'])) != Decimal(str(pago['monto'])):
             raise AppError("No se puede modificar el monto de un pago ya registrado", 400, "PAGO_AMOUNT_LOCKED")

        CAMPOS_OPCIONALES = {'numero_referencia', 'observaciones', 'numero_comprobante'}
        CAMPOS_BLOQUEADOS = {'fecha_pago', 'metodo_pago', 'gasto_id'}

        if gasto and gasto.get('estado_pago') == 'pagado':
            # Filtrar solo campos que realmente cambian
            update_data_cambios = {}
            for k, v in update_data.items():
                if pago.get(k) != v:
                    update_data_cambios[k] = v

            # Rechazar si intenta modificar campos bloqueados en un gasto ya pagado
            bloqueados_intentados = CAMPOS_BLOQUEADOS & set(update_data_cambios.keys())
            if bloqueados_intentados:
                raise AppError(
                    f"No se puede modificar {', '.join(sorted(bloqueados_intentados))} en un pago que completa un gasto",
                    400, "PAGO_LOCKED"
                )

            # Para gastos pagados, solo permitimos campos opcionales que actualmente estén vacíos
            update_data_filtrado = {}
            for k, v in update_data_cambios.items():
                if k in CAMPOS_OPCIONALES and not (pago.get(k) and str(pago.get(k)).strip()):
                    update_data_filtrado[k] = v

            if not update_data_filtrado and update_data_cambios:
                 # Si intentó cambiar algo pero nada era opcional
                 raise AppError("Los campos principales están bloqueados. El pago está completo.", 400, "PAGO_COMPLETE")

            update_data = update_data_filtrado
        else:
            # Si el gasto NO está pagado, permitir actualizar cualquier campo
            update_data = update_data

        actualizado = self.repo.actualizar_pago(id, update_data)

        # Sync Gasto state
        total_pagado = self.repo.obtener_total_pagado(pago['gasto_id'])
        gasto_final = self.gasto_repo.obtener_por_id(pago['gasto_id'])
        gasto_total = Decimal(str(gasto_final['total']))
        new_status = "pagado" if total_pagado >= gasto_total else "parcial" if total_pagado > 0 else "pendiente"
        self.gasto_repo.actualizar_gasto(pago['gasto_id'], {"estado_pago": new_status})

        return actualizado

    def eliminar_pago(self, id: UUID, usuario_actual: dict):
        pago = self.repo.obtener_por_id(id)
        if not pago:
             raise AppError("Pago no encontrado", 404, "PAGO_NOT_FOUND")
             
        is_superadmin = usuario_actual.get(AuthKeys.IS_SUPERADMIN, False)
        if not is_superadmin:
            gasto = self.gasto_repo.obtener_por_id(pago['gasto_id'])
            if not gasto or str(gasto['empresa_id']) != str(usuario_actual.get('empresa_id')):
                raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")
             
        gasto_id = pago['gasto_id']
        self.repo.eliminar_pago(id)
        
        # Sync Gasto state
        total_pagado = self.repo.obtener_total_pagado(gasto_id)
        gasto = self.gasto_repo.obtener_por_id(gasto_id)
        gasto_total = Decimal(str(gasto['total']))
        new_status = "pagado" if total_pagado >= gasto_total else "parcial" if total_pagado > 0 else "pendiente"
        self.gasto_repo.actualizar_gasto(gasto_id, {"estado_pago": new_status})
        
        return True

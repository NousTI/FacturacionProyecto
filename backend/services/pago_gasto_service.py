from fastapi import Depends, HTTPException, status
from typing import List
from uuid import UUID
from decimal import Decimal

from repositories.pago_gasto_repository import PagoGastoRepository
from repositories.gasto_repository import GastoRepository
from models.PagoGasto import PagoGastoCreate, PagoGastoUpdate
from utils.enums import AuthKeys

class PagoGastoService:
    def __init__(self, repository: PagoGastoRepository = Depends(), gasto_repository: GastoRepository = Depends()):
        self.repository = repository
        self.gasto_repository = gasto_repository

    def create(self, data: PagoGastoCreate, current_user: dict) -> dict:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        
        # 1. Check Gasto existence and permissions
        empresa_id_gasto = self.repository.get_gasto_empresa(data.gasto_id)
        if not empresa_id_gasto:
            raise HTTPException(status_code=404, detail="El gasto asociado no existe")
            
        if not is_superadmin:
            user_empresa_id = current_user.get('empresa_id')
            if str(empresa_id_gasto) != str(user_empresa_id):
                 raise HTTPException(status_code=403, detail="No tiene permisos para registrar pagos a este gasto")
        
        # 2. Resolve Usuario ID logic
        if is_superadmin:
             if not data.usuario_id:
                  raise HTTPException(status_code=400, detail="Superadmin debe especificar usuario_id")
             usuario_id = data.usuario_id
             # Strict check: user must belong to company of the expense?
             # Yes, logical consistency.
             if not self.gasto_repository.validate_user_empresa(usuario_id, empresa_id_gasto):
                  raise HTTPException(status_code=400, detail="El usuario especificado no pertenece a la empresa del gasto")
        else:
             usuario_id = current_user.get('sub') or current_user.get('id')
             if not usuario_id:
                 raise HTTPException(status_code=400, detail="No se pudo identificar al usuario")

        data_dict = data.model_dump(exclude_unset=True)
        data_dict['usuario_id'] = str(usuario_id)
        
        try:
            result = self.repository.create(data_dict)
            if not result:
                raise HTTPException(status_code=500, detail="Error al registrar pago")

            # 3. Calculate and Update Gasto Status
            # Logic: If sum(pagos) >= gasto.total -> 'pagado'
            total_pagado = self.repository.get_total_pagado(data.gasto_id)
            gasto_total = self.repository.get_gasto_total(data.gasto_id)
            
            if total_pagado >= gasto_total:
                self.repository.update_gasto_estado(data.gasto_id, "pagado")
            
            return result
        except Exception as e:
            if "foreign key" in str(e).lower():
                 raise HTTPException(status_code=400, detail="Referencia inválida (gasto o usuario no existen)")
            raise e
            raise e

    def list_all_pagos(self, current_user: dict) -> List[dict]:
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            raise HTTPException(status_code=403, detail="Acceso denegado: Solo Superadmin")
        return self.repository.list_all()

    def get_pagos_by_gasto(self, gasto_id: UUID, current_user: dict) -> List[dict]:
        # Check permissions
        empresa_id_gasto = self.repository.get_gasto_empresa(gasto_id)
        if not empresa_id_gasto:
             raise HTTPException(status_code=404, detail="Gasto no encontrado")

        if not current_user.get(AuthKeys.IS_SUPERADMIN):
             if str(empresa_id_gasto) != str(current_user.get('empresa_id')):
                  raise HTTPException(status_code=403, detail="No tiene acceso a los pagos de este gasto")
        
        return self.repository.list_by_gasto(gasto_id)

    def update(self, id: UUID, data: PagoGastoUpdate, current_user: dict) -> dict:
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            raise HTTPException(status_code=403, detail="Solo Superadmin puede actualizar pagos")
            
        existing = self.repository.get_by_id(id)
        if not existing:
             raise HTTPException(status_code=404, detail="Pago no encontrado")
             
        data_dict = data.model_dump(exclude_unset=True)
        if not data_dict:
             return existing
             
        updated = self.repository.update(id, data_dict)
        
        # After update, recalculate status? - Yes, ideally.
        if updated:
             gasto_id = existing['gasto_id'] # Use ID from existing before update (it's FK, unlikely to change but logic holds)
             total_pagado = self.repository.get_total_pagado(gasto_id)
             gasto_total = self.repository.get_gasto_total(gasto_id)
             
             new_status = "pagado" if total_pagado >= gasto_total else "pendiente"
             # Optimistic check: actually check if it was 'pagado' before and now is 'pendiente'?
             # Simple logic: just set correct status
             self.repository.update_gasto_estado(gasto_id, new_status)
             
        return updated

    def delete(self, id: UUID, current_user: dict):
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            raise HTTPException(status_code=403, detail="Solo Superadmin puede eliminar pagos")

        existing = self.repository.get_by_id(id)
        if not existing:
             raise HTTPException(status_code=404, detail="Pago no encontrado")
             
        gasto_id = existing['gasto_id']
        
        if not self.repository.delete(id):
             raise HTTPException(status_code=500, detail="No se pudo eliminar el pago")
             
        # Recalculate status
        total_pagado = self.repository.get_total_pagado(gasto_id)
        gasto_total = self.repository.get_gasto_total(gasto_id)
        new_status = "pagado" if total_pagado >= gasto_total else "pendiente"
        self.repository.update_gasto_estado(gasto_id, new_status)

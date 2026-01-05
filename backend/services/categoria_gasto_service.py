from fastapi import Depends, HTTPException, status
from typing import List
from uuid import UUID

from repositories.categoria_gasto_repository import CategoriaGastoRepository
from models.CategoriaGasto import CategoriaGastoCreate, CategoriaGastoUpdate
from utils.enums import AuthKeys

class CategoriaGastoService:
    def __init__(self, repository: CategoriaGastoRepository = Depends()):
        self.repository = repository

    def create(self, data: CategoriaGastoCreate, current_user: dict) -> dict:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        
        if is_superadmin:
            if not data.empresa_id:
                raise HTTPException(status_code=400, detail="Superadmin debe especificar empresa_id")
            empresa_id = data.empresa_id
        else:
            # Regular user: forced to use their own company
            empresa_id = current_user.get('empresa_id')
            if not empresa_id:
                # Should not happen if auth is correct, but safety check
                raise HTTPException(status_code=403, detail="Usuario no asociado a una empresa")
        
        data_dict = data.model_dump(exclude_unset=True)
        data_dict['empresa_id'] = str(empresa_id)
        
        # Here we could check for existing code if DB doesn't handle it well, 
        # but the Unique Constraint (empresa_id, codigo) will raise IntegrityError.
        # Ideally we catch that in repo or here. For now, basic flow.
        try:
            result = self.repository.create(data_dict)
            if not result:
                raise HTTPException(status_code=500, detail="Error al crear categoría de gasto")
            return result
        except Exception as e:
            error_msg = str(e).lower()
            if "unique constraint" in error_msg and "codigo" in error_msg:
                raise HTTPException(status_code=409, detail="Ya existe una categoría con este código para su empresa")
            if "foreign key constraint" in error_msg or "violates foreign key" in error_msg or "viola la llave foránea" in error_msg:
                 # Should catch "categoria_gasto_empresa_id_fkey" typically
                if "empresa" in error_msg:
                    raise HTTPException(status_code=400, detail="La empresa especificada no existe")
            raise e

    def get_by_id(self, id: UUID, current_user: dict) -> dict:
        result = self.repository.get_by_id(id)
        if not result:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
            
        # Permission check: belongs to company
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            if str(result['empresa_id']) != str(current_user['empresa_id']):
                 raise HTTPException(status_code=403, detail="No tiene acceso a esta categoría")
                 
        return result

    def list_categorias(self, current_user: dict, empresa_id_filter: UUID = None) -> List[dict]:
        user_empresa_id = current_user.get('empresa_id')
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)

        if is_superadmin:
            if empresa_id_filter:
                return self.repository.list_by_empresa(empresa_id_filter)
            return self.repository.list_all()
            
        if not user_empresa_id:
             # Should be covered by auth/permission logic usually
             return []

        return self.repository.list_by_empresa(user_empresa_id)

    def update(self, id: UUID, data: CategoriaGastoUpdate, current_user: dict) -> dict:
        # Verify existence and ownership
        existing = self.get_by_id(id, current_user)
        
        data_dict = data.model_dump(exclude_unset=True)
        if not data_dict:
             return existing
             
        try:
            updated = self.repository.update(id, data_dict)
            return updated
        except Exception as e:
            if "unique constraint" in str(e).lower() and "codigo" in str(e).lower():
                raise HTTPException(status_code=409, detail="El código ya está en uso")
            raise e

    def delete(self, id: UUID, current_user: dict):
        # Verify existence and ownership
        self.get_by_id(id, current_user)
        
        if not self.repository.delete(id):
            raise HTTPException(status_code=500, detail="No se pudo eliminar la categoría")

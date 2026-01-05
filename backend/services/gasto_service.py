from fastapi import Depends, HTTPException, status
from typing import List
from uuid import UUID

from repositories.gasto_repository import GastoRepository
from models.Gasto import GastoCreate, GastoUpdate
from utils.enums import AuthKeys

class GastoService:
    def __init__(self, repository: GastoRepository = Depends()):
        self.repository = repository

    def create(self, data: GastoCreate, current_user: dict) -> dict:
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
        
        # 1. Resolve Empresa ID
        if is_superadmin:
            if not data.empresa_id:
                raise HTTPException(status_code=400, detail="Superadmin debe especificar empresa_id")
            empresa_id = data.empresa_id
        else:
            empresa_id = current_user.get('empresa_id')
            if not empresa_id:
                raise HTTPException(status_code=403, detail="Usuario no asociado a una empresa")
        
        # 2. Get User ID (Creator)
        usuario_id = data.usuario_id or current_user.get('sub') or current_user.get('id')
        
        if not usuario_id:
             raise HTTPException(status_code=400, detail="No se pudo determinar el ID del usuario creador")
            
        # 3. Validate consistency: User must belong to Empresa
        # If Superadmin, we must trust they picked a user FROM that company.
        # If Regular user, they can only pick themselves (and they ARE in that company by token).
        # So crucial check is for Superadmin (or if regular user supplies odd data, though we override it for them usually).
        
        # Check database
        if not self.repository.validate_user_empresa(usuario_id, empresa_id):
             raise HTTPException(status_code=400, detail="El usuario especificado no pertenece a la empresa indicada")

        data_dict = data.model_dump(exclude_unset=True)
        data_dict['empresa_id'] = str(empresa_id)
        data_dict['usuario_id'] = str(usuario_id)
        
        try:
            result = self.repository.create(data_dict)
            if not result:
                raise HTTPException(status_code=500, detail="Error al registrar gasto")
            return result
        except Exception as e:
            error_msg = str(e).lower()
            if "foreign key constraint" in error_msg:
                if "categoria_gasto" in error_msg:
                    raise HTTPException(status_code=400, detail="La categoría de gasto especificada no existe")
                if "proveedor" in error_msg:
                    raise HTTPException(status_code=400, detail="El proveedor especificado no existe")
                if "usuario" in error_msg:
                    raise HTTPException(status_code=400, detail="El usuario especificado no existe o no es válido")
                if "empresa" in error_msg:
                    raise HTTPException(status_code=400, detail="La empresa especificada no existe")
            raise e

    def get_by_id(self, id: UUID, current_user: dict) -> dict:
        result = self.repository.get_by_id(id)
        if not result:
            raise HTTPException(status_code=404, detail="Gasto no encontrado")
            
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
            if str(result['empresa_id']) != str(current_user['empresa_id']):
                 raise HTTPException(status_code=403, detail="No tiene acceso a este gasto")
                 
        return result

    def list_gastos(self, current_user: dict, empresa_id_filter: UUID = None) -> List[dict]:
        user_empresa_id = current_user.get('empresa_id')
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)

        if is_superadmin:
            if empresa_id_filter:
                return self.repository.list_by_empresa(empresa_id_filter)
            return self.repository.list_all()
            
        if not user_empresa_id:
             return []

        return self.repository.list_by_empresa(user_empresa_id)

    def update(self, id: UUID, data: GastoUpdate, current_user: dict) -> dict:
        # Verify existence and ownership
        existing = self.get_by_id(id, current_user)
        
        data_dict = data.model_dump(exclude_unset=True)
        if not data_dict:
             return existing
             
        try:
            updated = self.repository.update(id, data_dict)
            return updated
        except Exception as e:
            error_msg = str(e).lower()
            if "foreign key constraint" in error_msg:
                if "categoria_gasto" in error_msg:
                    raise HTTPException(status_code=400, detail="La categoría de gasto especificada no existe")
                if "proveedor" in error_msg:
                     raise HTTPException(status_code=400, detail="El proveedor especificado no existe")
            raise e

    def delete(self, id: UUID, current_user: dict):
        self.get_by_id(id, current_user)
        
        if not self.repository.delete(id):
            raise HTTPException(status_code=500, detail="No se pudo eliminar el gasto")

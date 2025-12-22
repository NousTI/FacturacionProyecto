from fastapi import Depends, HTTPException, status
from repositories.empresa_repository import EmpresaRepository
from models.Empresa import EmpresaCreate, EmpresaUpdate
from uuid import UUID
from typing import List, Optional
from utils.enums import AuthKeys

class EmpresaService:
    def __init__(self, repository: EmpresaRepository = Depends()):
        self.repository = repository

    def _get_user_context(self, current_user: dict):
        return {
            "is_superadmin": current_user.get(AuthKeys.IS_SUPERADMIN, False),
            "is_vendedor": current_user.get(AuthKeys.IS_VENDEDOR, False),
            "is_usuario": current_user.get(AuthKeys.IS_USUARIO, False),
            "user_id": current_user.get("id"),
            "empresa_id": current_user.get("empresa_id")
        }

    def create_empresa(self, empresa: EmpresaCreate, current_user: dict):
        ctx = self._get_user_context(current_user)

        # Permission Check: Only Superadmin or Vendedor can create/manage companies
        if not ctx["is_superadmin"] and not ctx["is_vendedor"]:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción"
            )

        # Validate RUC uniqueness
        if self.repository.get_empresa_by_ruc(empresa.ruc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El RUC ya está registrado para otra empresa"
            )
        
        data = empresa.model_dump(exclude_unset=True)
        
        # If caller is not superadmin, force assignment to themselves
        if not ctx["is_superadmin"]:
            if not ctx["user_id"]:
                  raise HTTPException(status_code=400, detail="Vendedor ID requerido")
            data['vendedor_id'] = ctx["user_id"]
        # Else (Superadmin): allow whatever is in data['vendedor_id'] or implicitly None
            
        try:
             new_empresa = self.repository.create_empresa(data)
        except Exception as e:
             error_str = str(e)
             if "vendedor_id" in error_str and "viol" in error_str:
                  raise HTTPException(status_code=400, detail="El Vendedor ID especificado no existe")
             raise HTTPException(status_code=500, detail=f"Error al crear la empresa: {error_str}")
             
        if not new_empresa:
             raise HTTPException(status_code=500, detail="Error al crear la empresa")
        return new_empresa

    def get_empresa(self, empresa_id: UUID, current_user: dict) -> dict:
        empresa = self.repository.get_empresa_by_id(empresa_id)
        if not empresa:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada"
            )
        
        ctx = self._get_user_context(current_user)

        # Permission Check
        if ctx["is_superadmin"]:
            return empresa
        
        if ctx["is_vendedor"]:
            if str(empresa.get('vendedor_id')) != str(ctx["user_id"]):
                 raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para ver esta empresa")
            return empresa

        if ctx["is_usuario"]:
             # User can only see their own empresa
             if str(empresa_id) != str(ctx["empresa_id"]):
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para ver esta empresa")
             return empresa

        # Fallback
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Rol no autorizado")

    def list_empresas(self, current_user: dict, vendedor_id: Optional[UUID] = None) -> List[dict]:
        ctx = self._get_user_context(current_user)
        
        # 1. Superadmin: Can see all or filter by passed vendedor_id
        if ctx["is_superadmin"]:
            return self.repository.list_empresas(vendedor_id=vendedor_id)

        # 2. Vendedor: Only see their assigned companies
        if ctx["is_vendedor"]:
             # If they tried to filter by another vendor, deny or ignore. Let's ignore/override.
             if vendedor_id and str(vendedor_id) != str(ctx["user_id"]):
                  raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes ver empresas de otros vendedores")
             return self.repository.list_empresas(vendedor_id=ctx["user_id"])

        # 3. Usuario: Only see their own specific company (as a list of one)
        if ctx["is_usuario"]:
            if not ctx["empresa_id"]:
                 return []
            return self.repository.list_empresas(empresa_id=ctx["empresa_id"])
            
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para listar empresas")

    def update_empresa(self, empresa_id: UUID, empresa_update: EmpresaUpdate, current_user: dict):
        ctx = self._get_user_context(current_user)

        # Check permissions first by fetching (this reuses the get_empresa logic)
        current = self.get_empresa(empresa_id, current_user)
        
        # RUC check if changing
        if empresa_update.ruc and empresa_update.ruc != current['ruc']:
             if self.repository.get_empresa_by_ruc(empresa_update.ruc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El RUC ya está en uso"
                )
        
        # STRICT Check: Vendedores cannot change 'activo' status
        if not ctx["is_superadmin"]:
            # Check if active status is being modified
            # Note: Pydantic model dump with exclude_unset=True might not have 'activo' key.
            # We access the update object directly or the dumped dict.
            if empresa_update.activo is not None and empresa_update.activo != current['activo']:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Solo el Superadmin puede cambiar el estado activo de una empresa"
                )

        try:
            updated = self.repository.update_empresa(empresa_id, empresa_update.model_dump(exclude_unset=True))
        except Exception as e:
            error_str = str(e)
            if "vendedor_id" in error_str and "viol" in error_str:
                  raise HTTPException(status_code=400, detail="El Vendedor ID especificado no existe")
            raise HTTPException(status_code=500, detail=f"Error al actualizar empresa: {error_str}")

        if not updated:
             raise HTTPException(status_code=500, detail="Error al actualizar empresa")
        return updated

    def delete_empresa(self, empresa_id: UUID, current_user: dict):
        # Use get_empresa to verify existence and permissions implicitly
        self.get_empresa(empresa_id, current_user)
        
        ctx = self._get_user_context(current_user)
        # Additional check: Maybe Users cannot delete, even if they can 'get'.
        # Assuming only Admin/Vendedor can delete. User (if they had access) shouldn't.
        if ctx["is_usuario"]:
             raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para eliminar empresas")

        # Proceed to delete
        success = self.repository.delete_empresa(empresa_id)
        if not success:
            raise HTTPException(status_code=500, detail="Error al eliminar la empresa")
        return success

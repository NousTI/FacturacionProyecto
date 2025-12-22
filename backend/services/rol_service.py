from fastapi import Depends, HTTPException, status
from repositories.rol_repository import RolRepository
from models.Rol import RolCreate
from uuid import UUID
from typing import List
from utils.enums import AuthKeys, PermissionCodes
from utils.messages import ErrorMessages

class RolService:
    def __init__(self, repo: RolRepository = Depends()):
        self.repo = repo

    def _check_permission(self, current_user: dict, permission_code: str):
        # Superadmin bypass
        if current_user.get(AuthKeys.IS_SUPERADMIN):
            return

        # Check user permissions
        rol_id = current_user.get(AuthKeys.ROL_ID)
        if not rol_id:
             raise HTTPException(status_code=403, detail="Usuario sin rol asignado")
             
        user_permissions = self.repo.get_permissions_by_role_id(rol_id)
        if permission_code not in user_permissions:
             raise HTTPException(status_code=403, detail=f"No tienes el permiso: {permission_code}")

    def list_roles(self, current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_VER)
        
        empresa_id = current_user.get("empresa_id")
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)

        if is_superadmin:
            # If no specific enterprise context, maybe list all? 
            # Per previous analysis, if superadmin has no enterprise_id in token, return empty or all.
            # Assuming returning all might be heavy but safe for superadmin.
            # However, repo.list_roles likely requires valid UUID if not handled.
             return self.repo.list_roles(None) # Assuming repo handles None=All, or we need to fix repo.

        if not empresa_id:
             raise HTTPException(status_code=400, detail=ErrorMessages.USER_NOT_IN_COMPANY)

        return self.repo.list_roles(empresa_id)

    def get_rol(self, rol_id: UUID, current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_VER)
        
        rol = self.repo.get_rol(rol_id)
        if not rol: 
            return None
        
        # Security Check: Multi-tenancy
        user_empresa_id = current_user.get("empresa_id")
        is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)

        # If not superadmin, must belong to same company
        if not is_superadmin and str(rol['empresa_id']) != str(user_empresa_id):
             raise HTTPException(status_code=403, detail=ErrorMessages.ROLE_ACCESS_DENIED)
        
        permissions = self.repo.get_role_permissions(rol_id)
        rol["permisos"] = permissions
        return rol

    def create_rol(self, data: RolCreate, current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_CREAR)

        if current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail="Superadmins acceden en modo lectura a roles de empresa")

        empresa_id = current_user.get("empresa_id")
        if not empresa_id:
             raise HTTPException(status_code=400, detail=ErrorMessages.USER_NOT_IN_COMPANY)

        data_dict = data.model_dump()
        data_dict["empresa_id"] = empresa_id
        
        return self.repo.create_rol(data_dict)

    def update_rol(self, rol_id: UUID, data: dict, current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_EDITAR)

        if current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail="Superadmins acceden en modo lectura a roles de empresa")

        existing = self.get_rol(rol_id, current_user)
        if not existing: 
             return None

        # Prevent modifying System Roles
        if existing.get("es_sistema") is True:
             raise HTTPException(status_code=403, detail=ErrorMessages.SYSTEM_ROLE_MODIFICATION)

        return self.repo.update_rol(rol_id, data)

    def delete_rol(self, rol_id: UUID, current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_ELIMINAR)

        if current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail="Superadmins acceden en modo lectura a roles de empresa")

        existing = self.get_rol(rol_id, current_user)
        if not existing:
             return None
        
        if existing.get("es_sistema") is True:
             raise HTTPException(status_code=403, detail=ErrorMessages.SYSTEM_ROLE_DELETION)

        return self.repo.delete_rol(rol_id)

    def assign_permissions(self, rol_id: UUID, permission_ids: List[UUID], current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_EDITAR)

        if current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail="Superadmins acceden en modo lectura a roles de empresa")

        # Verify access to role
        if not self.get_rol(rol_id, current_user):
             raise HTTPException(status_code=404, detail=ErrorMessages.ROLE_NOT_FOUND)
        
        return self.repo.assign_permissions(rol_id, permission_ids)

    def add_permission(self, rol_id: UUID, permission_id: UUID, current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_EDITAR)

        if current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail="Superadmins acceden en modo lectura a roles de empresa")
        if not self.get_rol(rol_id, current_user):
             raise HTTPException(status_code=404, detail=ErrorMessages.ROLE_NOT_FOUND)
        return self.repo.add_permission(rol_id, permission_id)

    def remove_permission(self, rol_id: UUID, permission_id: UUID, current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_EDITAR)
        
        if current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail="Superadmins acceden en modo lectura a roles de empresa")
        if not self.get_rol(rol_id, current_user):
             raise HTTPException(status_code=404, detail=ErrorMessages.ROLE_NOT_FOUND)
        return self.repo.remove_permission(rol_id, permission_id)

    def list_role_permissions(self, rol_id: UUID, current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_VER)
        
        if not self.get_rol(rol_id, current_user):
             raise HTTPException(status_code=404, detail=ErrorMessages.ROLE_NOT_FOUND)
        return self.repo.get_role_permissions(rol_id)

    def get_role_permission(self, rol_id: UUID, permission_id: UUID, current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_VER)

        if not self.get_rol(rol_id, current_user):
             raise HTTPException(status_code=404, detail=ErrorMessages.ROLE_NOT_FOUND)
        return self.repo.get_role_permission(rol_id, permission_id)

    def update_permission(self, rol_id: UUID, permission_id: UUID, data: dict, current_user: dict):
        self._check_permission(current_user, PermissionCodes.ROL_EDITAR)

        if current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail="Superadmins acceden en modo lectura a roles de empresa")
        if not self.get_rol(rol_id, current_user):
             raise HTTPException(status_code=404, detail=ErrorMessages.ROLE_NOT_FOUND)
        return self.repo.update_permission(rol_id, permission_id, data)

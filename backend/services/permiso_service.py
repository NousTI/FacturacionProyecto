from fastapi import Depends, HTTPException, status
from repositories.permiso_repository import PermisoRepository
from utils.enums import AuthKeys, PermissionCodes
from uuid import UUID
from utils.messages import ErrorMessages

class PermisoService:
    def __init__(self, repo: PermisoRepository = Depends()):
        self.repo = repo

    def _check_permission(self, current_user: dict, permission_code: str):
        # Superadmin bypass
        if current_user.get(AuthKeys.IS_SUPERADMIN):
            return

        # Check user permissions
        # We need to fetch permissions for the user's role. 
        # Assuming repo has this method (used by auth_dependencies).
        rol_id = current_user.get(AuthKeys.ROL_ID)
        if not rol_id:
             raise HTTPException(status_code=403, detail="Usuario sin rol asignado")
             
        user_permissions = self.repo.get_permissions_by_role_id(rol_id)
        if permission_code not in user_permissions:
             raise HTTPException(status_code=403, detail=f"No tienes el permiso: {permission_code}")

    def list_permissions(self, current_user: dict):
        self._check_permission(current_user, PermissionCodes.PERMISO_VER)
        return self.repo.list_permissions()

    def get_permission(self, permiso_id: UUID, current_user: dict):
        self._check_permission(current_user, PermissionCodes.PERMISO_VER)
        result = self.repo.get_permission(permiso_id)
        if not result:
             raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=ErrorMessages.PERMISSION_NOT_FOUND
            )
        return result

    def create_permission(self, data: dict, current_user: dict):
        # Only Superadmin
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail=ErrorMessages.SUPERADMIN_ONLY_CREATE)
        return self.repo.create_permission(data)

    def update_permission(self, permiso_id: UUID, data: dict, current_user: dict):
        # Only Superadmin
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail=ErrorMessages.SUPERADMIN_ONLY_UPDATE)
        return self.repo.update_permission(permiso_id, data)

    def delete_permission(self, permiso_id: UUID, current_user: dict):
        # Only Superadmin
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail=ErrorMessages.SUPERADMIN_ONLY_DELETE)
        return self.repo.delete_permission(permiso_id)

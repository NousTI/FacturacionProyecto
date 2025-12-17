from fastapi import Depends, HTTPException
from repositories.permiso_repository import PermisoRepository
from utils.enums import AuthKeys
from uuid import UUID

from utils.messages import ErrorMessages

class PermisoService:
    def __init__(self, repo: PermisoRepository = Depends()):
        self.repo = repo

    def list_permissions(self, current_user: dict = None):
        # We added current_user to sig in previous step logic but here is the final signature replacement
        return self.repo.list_permissions()

    def get_permission(self, permiso_id: UUID):
        return self.repo.get_permission(permiso_id)

    def create_permission(self, data: dict, current_user: dict):
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail=ErrorMessages.SUPERADMIN_ONLY_CREATE)
        return self.repo.create_permission(data)

    def update_permission(self, permiso_id: UUID, data: dict, current_user: dict):
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail=ErrorMessages.SUPERADMIN_ONLY_UPDATE)
        return self.repo.update_permission(permiso_id, data)

    def delete_permission(self, permiso_id: UUID, current_user: dict):
        if not current_user.get(AuthKeys.IS_SUPERADMIN):
             raise HTTPException(status_code=403, detail=ErrorMessages.SUPERADMIN_ONLY_DELETE)
        return self.repo.delete_permission(permiso_id)

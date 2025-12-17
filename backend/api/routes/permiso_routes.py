from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from uuid import UUID
from services.permiso_service import PermisoService
from models.Permiso import PermisoRead, PermisoCreate
from dependencies.auth_dependencies import require_permission, get_current_user
from utils.responses import success_response
from utils.messages import ErrorMessages
from utils.enums import PermissionCodes

router = APIRouter()

@router.get("/", response_model=List[PermisoRead])
def list_permissions(
    current_user: dict = Depends(require_permission(PermissionCodes.PERMISO_VER)),
    service: PermisoService = Depends()
):
    return service.list_permissions()

@router.get("/{permiso_id}", response_model=PermisoRead)
def get_permission(
    permiso_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.PERMISO_VER)),
    service: PermisoService = Depends()
):
    result = service.get_permission(permiso_id)
    if not result:
         raise HTTPException(status_code=404, detail=ErrorMessages.PERMISSION_NOT_FOUND)
    return result

@router.post("/", response_model=PermisoRead)
def create_permission(
    permiso: PermisoCreate,
    current_user: dict = Depends(get_current_user), # Superadmin check in Service
    service: PermisoService = Depends()
):
    result = service.create_permission(permiso.model_dump(), current_user)
    if not result or "error" in result:
         raise HTTPException(status_code=400, detail=result.get("error", ErrorMessages.CREATE_PERMISSION_ERROR))
    return result

@router.put("/{permiso_id}")
def update_permission(
    permiso_id: UUID,
    permiso_update: dict = Body(...), 
    current_user: dict = Depends(get_current_user), # Superadmin check in Service
    service: PermisoService = Depends()
):
    result = service.update_permission(permiso_id, permiso_update, current_user)
    if not result or "error" in result:
         raise HTTPException(status_code=400, detail=result.get("error", ErrorMessages.UPDATE_PERMISSION_ERROR))
    return result

@router.delete("/{permiso_id}")
def delete_permission(
    permiso_id: UUID,
    current_user: dict = Depends(get_current_user), # Superadmin check in Service
    service: PermisoService = Depends()
):
    result = service.delete_permission(permiso_id, current_user)
    if not result or "error" in result:
         raise HTTPException(status_code=400, detail=result.get("error", ErrorMessages.DELETE_PERMISSION_ERROR))
    return success_response("Permiso eliminado correctamente")

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from uuid import UUID
from services.rol_service import RolService
from models.Rol import RolCreate, RolRead 
from dependencies.auth_dependencies import require_permission
from utils.responses import success_response

router = APIRouter()

from utils.messages import ErrorMessages
from utils.enums import PermissionCodes

@router.get("/", response_model=List[RolRead])
def list_roles(
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_VER)),
    service: RolService = Depends()
):
    return service.list_roles(current_user)

@router.get("/{rol_id}", response_model=RolRead) # Pydantic model might need to include 'permisos' field if we want to return them
def get_rol(
    rol_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_VER)),
    service: RolService = Depends()
):
    rol = service.get_rol(rol_id, current_user)
    if not rol:
        raise HTTPException(status_code=404, detail=ErrorMessages.ROLE_NOT_FOUND)
    return rol

@router.post("/", response_model=RolRead)
def create_rol(
    rol: RolCreate,
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_CREAR)),
    service: RolService = Depends()
):
    result = service.create_rol(rol, current_user)
    if not result:
         raise HTTPException(status_code=400, detail=ErrorMessages.CREATE_ROLE_ERROR)
    if "error" in result:
         raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.put("/{rol_id}")
def update_rol(
    rol_id: UUID,
    rol_update: dict = Body(...), # Or a dedicated Pydantic model
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_EDITAR)),
    service: RolService = Depends()
):
    result = service.update_rol(rol_id, rol_update, current_user)
    if not result:
         raise HTTPException(status_code=404, detail=ErrorMessages.UPDATE_ROLE_ERROR)
    if "error" in result:
         raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.delete("/{rol_id}")
def delete_rol(
    rol_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_ELIMINAR)),
    service: RolService = Depends()
):
    result = service.delete_rol(rol_id, current_user)
    if not result:
         raise HTTPException(status_code=404, detail=ErrorMessages.DELETE_ROLE_ERROR)
    if "error" in result:
         raise HTTPException(status_code=400, detail=result["error"])
    return success_response("Rol eliminado correctamente")




@router.post("/{rol_id}/permisos")
def assign_permissions(
    rol_id: UUID,
    permission_ids: List[UUID] = Body(..., embed=True),
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_EDITAR)),
    service: RolService = Depends()
):
    success = service.assign_permissions(rol_id, permission_ids, current_user)
    if not success:
         raise HTTPException(status_code=400, detail=ErrorMessages.ASSIGN_PERMISSIONS_ERROR)
    return success_response("Permisos asignados correctamente")

@router.get("/{rol_id}/permisos")
def list_role_permissions(
    rol_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_VER)),
    service: RolService = Depends()
):
    return service.list_role_permissions(rol_id, current_user)

@router.get("/{rol_id}/permisos/{permiso_id}") # Implicitly uses PermisoRead or similar
def get_role_permission(
    rol_id: UUID,
    permiso_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_VER)),
    service: RolService = Depends()
):
    result = service.get_role_permission(rol_id, permiso_id, current_user)
    if not result:
         raise HTTPException(status_code=404, detail=ErrorMessages.PERMISSION_NOT_ASSIGNED)
    return result

@router.put("/{rol_id}/permisos/{permiso_id}")
def update_permission(
    rol_id: UUID,
    permiso_id: UUID,
    data: dict = Body(...), # Could use a Pydantic model like RolPermisoUpdate
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_EDITAR)),
    service: RolService = Depends()
):
    result = service.update_permission(rol_id, permiso_id, data, current_user)
    if not result:
         raise HTTPException(status_code=404, detail=ErrorMessages.PERMISSION_NOT_ASSIGNED)
    if "error" in result:
         raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/{rol_id}/permisos/add")
def add_permission(
    rol_id: UUID,
    permission_id: UUID = Body(..., embed=True),
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_EDITAR)),
    service: RolService = Depends()
):
    success = service.add_permission(rol_id, permission_id, current_user)
    if not success:
         raise HTTPException(status_code=400, detail=ErrorMessages.PERMISSION_ADD_ERROR)
    return success_response("Permiso agregado correctamente")

@router.delete("/{rol_id}/permisos/{permiso_id}")
def remove_permission(
    rol_id: UUID,
    permiso_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.ROL_EDITAR)),
    service: RolService = Depends()
):
    success = service.remove_permission(rol_id, permiso_id, current_user)
    if not success:
         raise HTTPException(status_code=400, detail=ErrorMessages.PERMISSION_REMOVE_ERROR)
    return success_response("Permiso eliminado correctamente")

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID

from services.gasto_service import GastoService
from models.Gasto import GastoCreate, GastoRead, GastoUpdate
from dependencies.auth_dependencies import get_current_user
from utils.enums import PermissionCodes, AuthKeys

router = APIRouter(tags=["Gasto"])

def require_gasto_permission(current_user: dict = Depends(get_current_user)):
    permissions = current_user.get('permissions', [])
    if current_user.get(AuthKeys.IS_SUPERADMIN):
        return current_user
        
    # User requested: REPORTE_VER for listing (and usually implied for creating in this module context if not specified otherwise, 
    # but strictly speaking we might want GASTO_CREAR. 
    # The user said: "Aqui el permiso debe ser de reporte ver para un usuario de la empresa"
    # Assuming this applies to access the module generally.
    if PermissionCodes.REPORTE_VER in permissions:
        return current_user
        
    raise HTTPException(status_code=403, detail="No tiene permisos para gestionar gastos")

@router.get("/gastos", response_model=List[GastoRead])
def list_gastos(
    empresa_id: Optional[UUID] = None,
    current_user: dict = Depends(require_gasto_permission),
    service: GastoService = Depends()
):
    return service.list_gastos(current_user, empresa_id)

@router.post("/gastos", response_model=GastoRead, status_code=status.HTTP_201_CREATED)
def create_gasto(
    data: GastoCreate,
    current_user: dict = Depends(require_gasto_permission),
    service: GastoService = Depends()
):
    return service.create(data, current_user)

@router.get("/gastos/{id}", response_model=GastoRead)
def get_gasto(
    id: UUID,
    current_user: dict = Depends(require_gasto_permission),
    service: GastoService = Depends()
):
    return service.get_by_id(id, current_user)

@router.put("/gastos/{id}", response_model=GastoRead)
def update_gasto(
    id: UUID,
    data: GastoUpdate,
    current_user: dict = Depends(require_gasto_permission),
    service: GastoService = Depends()
):
    return service.update(id, data, current_user)

@router.delete("/gastos/{id}", status_code=status.HTTP_200_OK)
def delete_gasto(
    id: UUID,
    current_user: dict = Depends(require_gasto_permission),
    service: GastoService = Depends()
):
    service.delete(id, current_user)
    return {"message": "Eliminado correctamente"}

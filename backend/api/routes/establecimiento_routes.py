from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from models.Establecimiento import EstablecimientoCreateInput, EstablecimientoRead, EstablecimientoUpdate
from services.establecimiento_service import EstablecimientoService
from dependencies.auth_dependencies import require_permission
from utils.enums import PermissionCodes
from utils.responses import success_response

router = APIRouter()

@router.post("/", response_model=EstablecimientoRead, status_code=status.HTTP_201_CREATED)
def create_establecimiento(
    data: EstablecimientoCreateInput,
    current_user: dict = Depends(require_permission(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    service: EstablecimientoService = Depends()
):
    # Service logic handles superadmin (manual empresa_id) vs regular user (auto empresa_id) logic
    return service.create(data, current_user)

@router.get("/", response_model=List[EstablecimientoRead])
def list_establecimientos(
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    empresa_id: Optional[UUID] = Query(None),
    current_user: dict = Depends(require_permission(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    service: EstablecimientoService = Depends()
):
    return service.list(current_user, empresa_id, limit, offset)

@router.get("/{id}", response_model=EstablecimientoRead)
def get_establecimiento(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    service: EstablecimientoService = Depends()
):
    return service.get_by_id(id, current_user)

@router.put("/{id}", response_model=EstablecimientoRead)
def update_establecimiento(
    id: UUID,
    data: EstablecimientoUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    service: EstablecimientoService = Depends()
):
    return service.update(id, data, current_user)

@router.delete("/{id}")
def delete_establecimiento(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    service: EstablecimientoService = Depends()
):
    service.delete(id, current_user)
    return success_response("Establecimiento eliminado correctamente")

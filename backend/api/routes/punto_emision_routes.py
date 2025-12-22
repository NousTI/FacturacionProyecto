from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from models.PuntoEmision import PuntoEmisionCreateInput, PuntoEmisionRead, PuntoEmisionUpdate
from services.punto_emision_service import PuntoEmisionService
from dependencies.auth_dependencies import require_permission
from utils.enums import PermissionCodes
from utils.responses import success_response

router = APIRouter()

# TODO: Consider creating a specific permission like PUNTO_EMISION_GESTIONAR
# Currently using ESTABLECIMIENTO_GESTIONAR as per user request.

@router.post("/", response_model=PuntoEmisionRead, status_code=status.HTTP_201_CREATED)
def create_punto_emision(
    data: PuntoEmisionCreateInput,
    current_user: dict = Depends(require_permission(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    service: PuntoEmisionService = Depends()
):
    return service.create(data, current_user)

@router.get("/", response_model=List[PuntoEmisionRead])
def list_puntos_emision(
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    establecimiento_id: Optional[UUID] = Query(None),
    current_user: dict = Depends(require_permission(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    service: PuntoEmisionService = Depends()
):
    return service.list(current_user, establecimiento_id, limit, offset)

@router.get("/{id}", response_model=PuntoEmisionRead)
def get_punto_emision(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    service: PuntoEmisionService = Depends()
):
    return service.get_by_id(id, current_user)

@router.put("/{id}", response_model=PuntoEmisionRead)
def update_punto_emision(
    id: UUID,
    data: PuntoEmisionUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    service: PuntoEmisionService = Depends()
):
    return service.update(id, data, current_user)

@router.delete("/{id}")
def delete_punto_emision(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    service: PuntoEmisionService = Depends()
):
    service.delete(id, current_user)
    return success_response("Punto de emisión eliminado correctamente")

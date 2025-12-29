from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from models.CuentaCobrar import CuentaCobrarCreate, CuentaCobrarRead, CuentaCobrarUpdate
from services.cuenta_cobrar_service import CuentaCobrarService
from dependencies.auth_dependencies import require_permission
from utils.enums import PermissionCodes
from utils.responses import success_response

router = APIRouter()

@router.post("/", response_model=CuentaCobrarRead, status_code=status.HTTP_201_CREATED)
def create_cuenta_cobrar(
    data: CuentaCobrarCreate,
    current_user: dict = Depends(require_permission(PermissionCodes.CUENTA_COBRAR_CREAR)),
    service: CuentaCobrarService = Depends()
):
    return service.create(data, current_user)

@router.get("/", response_model=List[CuentaCobrarRead])
def list_cuentas_cobrar(
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    empresa_id: Optional[UUID] = Query(None),
    cliente_id: Optional[UUID] = Query(None),
    current_user: dict = Depends(require_permission(PermissionCodes.CUENTA_COBRAR_VER)),
    service: CuentaCobrarService = Depends()
):
    return service.list(current_user, empresa_id, cliente_id, limit, offset)

@router.get("/{id}", response_model=CuentaCobrarRead)
def get_cuenta_cobrar(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.CUENTA_COBRAR_VER)),
    service: CuentaCobrarService = Depends()
):
    return service.get_by_id(id, current_user)

@router.put("/{id}", response_model=CuentaCobrarRead)
def update_cuenta_cobrar(
    id: UUID,
    data: CuentaCobrarUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.CUENTA_COBRAR_EDITAR)),
    service: CuentaCobrarService = Depends()
):
    return service.update(id, data, current_user)

@router.delete("/{id}")
def delete_cuenta_cobrar(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.CUENTA_COBRAR_ELIMINAR)),
    service: CuentaCobrarService = Depends()
):
    service.delete(id, current_user)
    return success_response("Cuenta por Cobrar eliminada correctamente")

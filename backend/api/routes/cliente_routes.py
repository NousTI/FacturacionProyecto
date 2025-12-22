from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID

from models.Cliente import ClienteCreate, ClienteRead, ClienteUpdate
from services.cliente_service import ClienteService
from dependencies.auth_dependencies import get_current_user, require_permission
from utils.enums import PermissionCodes
from utils.responses import success_response

router = APIRouter()

@router.post("/", response_model=ClienteRead, status_code=status.HTTP_201_CREATED)
def create_cliente(
    cliente: ClienteCreate,
    current_user: dict = Depends(require_permission(PermissionCodes.CLIENTE_CREAR)),
    service: ClienteService = Depends()
):
    return service.create_cliente(cliente, current_user)

@router.get("/", response_model=List[ClienteRead])
def list_clientes(
    empresa_id: Optional[UUID] = None,
    current_user: dict = Depends(require_permission(PermissionCodes.CLIENTE_VER)),
    service: ClienteService = Depends()
):
    return service.list_clientes(current_user, empresa_id)

@router.get("/{cliente_id}", response_model=ClienteRead)
def get_cliente(
    cliente_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.CLIENTE_VER)),
    service: ClienteService = Depends()
):
    return service.get_cliente(cliente_id, current_user)

@router.put("/{cliente_id}", response_model=ClienteRead)
def update_cliente(
    cliente_id: UUID,
    cliente_update: ClienteUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.CLIENTE_EDITAR)),
    service: ClienteService = Depends()
):
    return service.update_cliente(cliente_id, cliente_update, current_user)

@router.delete("/{cliente_id}")
def delete_cliente(
    cliente_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.CLIENTE_ELIMINAR)),
    service: ClienteService = Depends()
):
    service.delete_cliente(cliente_id, current_user)
    return success_response("Cliente eliminado correctamente")

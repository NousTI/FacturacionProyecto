from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from services.movimiento_inventario_service import MovimientoInventarioService
from models.MovimientoInventario import MovimientoInventarioCreate, MovimientoInventarioRead
from dependencies.auth_dependencies import get_current_user
from utils.enums import PermissionCodes, AuthKeys

router = APIRouter(tags=["Movimiento Inventario"])

def require_inventario_permission(current_user: dict = Depends(get_current_user)):
    permissions = current_user.get('permissions', [])
    if current_user.get(AuthKeys.IS_SUPERADMIN):
        return current_user
        
    if PermissionCodes.PRODUCTO_EDITAR in permissions:
        return current_user
        
    raise HTTPException(status_code=403, detail="No tiene permisos para gestionar inventario")

@router.get("/movimientos-inventario", response_model=List[MovimientoInventarioRead])
def list_all_movimientos(
    current_user: dict = Depends(require_inventario_permission),
    service: MovimientoInventarioService = Depends()
):
    return service.list_all(current_user)

@router.get("/productos/{producto_id}/movimientos", response_model=List[MovimientoInventarioRead])
def list_movimientos_producto(
    producto_id: UUID,
    current_user: dict = Depends(require_inventario_permission),
    service: MovimientoInventarioService = Depends()
):
    return service.list_by_producto(producto_id, current_user)

@router.post("/movimientos-inventario", response_model=MovimientoInventarioRead, status_code=status.HTTP_201_CREATED)
def create_movimiento(
    data: MovimientoInventarioCreate,
    current_user: dict = Depends(require_inventario_permission),
    service: MovimientoInventarioService = Depends()
):
    return service.create(data, current_user)

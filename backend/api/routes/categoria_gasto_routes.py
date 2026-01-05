from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from services.categoria_gasto_service import CategoriaGastoService
from models.CategoriaGasto import CategoriaGastoCreate, CategoriaGastoRead, CategoriaGastoUpdate
from dependencies.auth_dependencies import get_current_user
from utils.enums import PermissionCodes, AuthKeys

router = APIRouter(tags=["Categoria Gasto"])

def require_categoria_gasto_permission(current_user: dict = Depends(get_current_user)):
    permissions = current_user.get('permissions', [])
    if current_user.get(AuthKeys.IS_SUPERADMIN):
        return current_user
        
    if PermissionCodes.REPORTE_VER in permissions:
        return current_user
        
    raise HTTPException(status_code=403, detail="No tiene permisos para gestionar categorías de gasto")

from typing import List, Optional

@router.get("/categoria-gasto", response_model=List[CategoriaGastoRead])
def list_categorias(
    empresa_id: Optional[UUID] = None,
    current_user: dict = Depends(require_categoria_gasto_permission),
    service: CategoriaGastoService = Depends()
):
    return service.list_categorias(current_user, empresa_id)

@router.post("/categoria-gasto", response_model=CategoriaGastoRead, status_code=status.HTTP_201_CREATED)
def create_categoria(
    data: CategoriaGastoCreate,
    current_user: dict = Depends(require_categoria_gasto_permission),
    service: CategoriaGastoService = Depends()
):
    return service.create(data, current_user)

@router.get("/categoria-gasto/{id}", response_model=CategoriaGastoRead)
def get_categoria(
    id: UUID,
    current_user: dict = Depends(require_categoria_gasto_permission),
    service: CategoriaGastoService = Depends()
):
    return service.get_by_id(id, current_user)

@router.put("/categoria-gasto/{id}", response_model=CategoriaGastoRead)
def update_categoria(
    id: UUID,
    data: CategoriaGastoUpdate,
    current_user: dict = Depends(require_categoria_gasto_permission),
    service: CategoriaGastoService = Depends()
):
    return service.update(id, data, current_user)

@router.delete("/categoria-gasto/{id}", status_code=status.HTTP_200_OK)
def delete_categoria(
    id: UUID,
    current_user: dict = Depends(require_categoria_gasto_permission),
    service: CategoriaGastoService = Depends()
):
    service.delete(id, current_user)
    return {"message": "Eliminado correctamente"}

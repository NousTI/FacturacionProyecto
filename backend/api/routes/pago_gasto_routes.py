from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from services.pago_gasto_service import PagoGastoService
from models.PagoGasto import PagoGastoCreate, PagoGastoRead, PagoGastoUpdate
from dependencies.auth_dependencies import get_current_user
from utils.enums import PermissionCodes, AuthKeys

router = APIRouter(tags=["Pago Gasto"])

def require_pago_permission(current_user: dict = Depends(get_current_user)):
    permissions = current_user.get('permissions', [])
    if current_user.get(AuthKeys.IS_SUPERADMIN):
        return current_user
        
    if PermissionCodes.REPORTE_VER in permissions:
        return current_user
        
    raise HTTPException(status_code=403, detail="No tiene permisos para gestionar pagos")

    raise HTTPException(status_code=403, detail="No tiene permisos para gestionar pagos")

@router.get("/pagos-gasto", response_model=List[PagoGastoRead])
def list_all_pagos(
    current_user: dict = Depends(require_pago_permission),
    service: PagoGastoService = Depends()
):
    return service.list_all_pagos(current_user)

@router.get("/pagos-gasto/{gasto_id}", response_model=List[PagoGastoRead])
def list_pagos_by_gasto(
    gasto_id: UUID,
    current_user: dict = Depends(require_pago_permission),
    service: PagoGastoService = Depends()
):
    return service.get_pagos_by_gasto(gasto_id, current_user)

@router.post("/pagos-gasto", response_model=PagoGastoRead, status_code=status.HTTP_201_CREATED)
def create_pago(
    data: PagoGastoCreate,
    current_user: dict = Depends(require_pago_permission),
    service: PagoGastoService = Depends()
):
    return service.create(data, current_user)

@router.put("/pagos-gasto/{id}", response_model=PagoGastoRead)
def update_pago(
    id: UUID,
    data: PagoGastoUpdate,
    current_user: dict = Depends(require_pago_permission),
    service: PagoGastoService = Depends()
):
    return service.update(id, data, current_user)

@router.delete("/pagos-gasto/{id}", status_code=status.HTTP_200_OK)
def delete_pago(
    id: UUID,
    current_user: dict = Depends(require_pago_permission),
    service: PagoGastoService = Depends()
):
    service.delete(id, current_user)
    return {"message": "Eliminado correctamente"}

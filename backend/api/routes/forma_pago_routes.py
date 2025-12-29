from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from services.forma_pago_service import FormaPagoService
from models.FormaPago import FormaPagoCreate, FormaPagoRead, FormaPagoUpdate
from dependencies.auth_dependencies import get_current_user
from utils.enums import PermissionCodes, AuthKeys

router = APIRouter(tags=["Forma Pago"])

# Dependencies
def require_facturador_permissions(current_user: dict = Depends(get_current_user)):
    # Assuming standard permission for editing invoice details applies here
    # Similar to FACTURA_EDITAR or FACTURA_CREAR
    # Or specific roles. Let's start with permissions.
    permissions = current_user.get('permissions', [])
    if current_user.get(AuthKeys.IS_SUPERADMIN):
        return current_user
        
    required = [
        PermissionCodes.FACTURA_CREAR, 
        PermissionCodes.FACTURA_EDITAR, 
        "ADMIN_EMPRESA" # Role code check if needed, but permissions better
    ]
    
    # Check if user has ANY of the required permissions to modify payment info
    # For now, let's use FACTURA_CREAR as proxy for "Can work on invoices"
    if PermissionCodes.FACTURA_CREAR in permissions or PermissionCodes.FACTURA_EDITAR in permissions:
        return current_user
        
    raise HTTPException(status_code=403, detail="No tiene permisos para gestionar formas de pago")

@router.post("/facturas/{factura_id}/pagos", response_model=FormaPagoRead, status_code=status.HTTP_201_CREATED)
def add_pago(
    factura_id: UUID,
    pago: FormaPagoCreate, # contains data
    current_user: dict = Depends(require_facturador_permissions),
    service: FormaPagoService = Depends()
):
    # Ensure URL param matches body if body has it, or just override
    pago.factura_id = factura_id
    return service.create(pago, current_user)

@router.get("/facturas/{factura_id}/pagos", response_model=List[FormaPagoRead])
def list_pagos(
    factura_id: UUID,
    current_user: dict = Depends(get_current_user), # View access maybe looser?
    service: FormaPagoService = Depends()
):
    # For viewing, FACTURA_VER should be enough
    permissions = current_user.get('permissions', [])
    if not current_user.get(AuthKeys.IS_SUPERADMIN) and PermissionCodes.FACTURA_VER not in permissions:
         raise HTTPException(status_code=403, detail="No tiene permisos para ver la factura")

    return service.list_by_factura(factura_id, current_user)

@router.put("/pagos/{id}", response_model=FormaPagoRead)
def update_pago(
    id: UUID,
    data: FormaPagoUpdate,
    current_user: dict = Depends(require_facturador_permissions),
    service: FormaPagoService = Depends()
):
    return service.update(id, data, current_user)

@router.delete("/pagos/{id}", status_code=status.HTTP_200_OK)
def delete_pago(
    id: UUID,
    current_user: dict = Depends(require_facturador_permissions),
    service: FormaPagoService = Depends()
):
    service.delete(id, current_user)
    return {"message": "Forma de pago eliminada correctamente"}

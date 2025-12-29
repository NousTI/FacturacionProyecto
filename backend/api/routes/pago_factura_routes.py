from fastapi import APIRouter, Depends, Query, status
from typing import List
from uuid import UUID

from models.PagoFactura import PagoFacturaCreate, PagoFacturaRead
from services.pago_factura_service import PagoFacturaService
from dependencies.auth_dependencies import require_permission
from utils.enums import PermissionCodes

router = APIRouter()

@router.post("/", response_model=PagoFacturaRead, status_code=status.HTTP_201_CREATED)
def create_pago(
    data: PagoFacturaCreate,
    current_user: dict = Depends(require_permission(PermissionCodes.PAGO_CREAR)),
    service: PagoFacturaService = Depends()
):
    return service.create(data, current_user)

@router.get("/", response_model=List[PagoFacturaRead])
def list_pagos(
    cuenta_cobrar_id: UUID = Query(None),
    current_user: dict = Depends(require_permission(PermissionCodes.PAGO_VER)),
    service: PagoFacturaService = Depends()
):
    return service.list(cuenta_cobrar_id, current_user)

@router.get("/{id}", response_model=PagoFacturaRead)
def get_pago(
    id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.PAGO_VER)),
    service: PagoFacturaService = Depends()
):
    return service.get_by_id(id, current_user)

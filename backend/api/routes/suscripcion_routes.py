from fastapi import APIRouter, Depends, status, HTTPException
from models.Suscripcion import PagoSuscripcionCreate, PagoSuscripcionRead
from services.suscripcion_service import SuscripcionService
from dependencies.auth_dependencies import get_current_user
from typing import List
from uuid import UUID

router = APIRouter()

@router.post("/", response_model=PagoSuscripcionRead, status_code=status.HTTP_201_CREATED)
def registrar_pago(
    pago: PagoSuscripcionCreate,
    current_user: dict = Depends(get_current_user),
    service: SuscripcionService = Depends()
):
    return service.registrar_pago(pago, current_user)

@router.get("/", response_model=List[PagoSuscripcionRead])
def list_pagos(
    current_user: dict = Depends(get_current_user),
    service: SuscripcionService = Depends()
):
    return service.list_pagos(current_user)

@router.get("/{pago_id}", response_model=PagoSuscripcionRead)
def get_pago(
    pago_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: SuscripcionService = Depends()
):
    return service.get_pago(pago_id, current_user)

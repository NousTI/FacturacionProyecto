from fastapi import APIRouter, Depends, status, HTTPException, Body
from models.Suscripcion import PagoSuscripcionCreate, PagoSuscripcionRead
from services.suscripcion_service import SuscripcionService
from dependencies.auth_dependencies import get_current_user
from typing import List, Optional
from datetime import date
from uuid import UUID

router = APIRouter()

@router.post("/", response_model=PagoSuscripcionRead, status_code=status.HTTP_201_CREATED)
def registrar_pago(
    pago: PagoSuscripcionCreate,
    current_user: dict = Depends(get_current_user),
    service: SuscripcionService = Depends()
):
    return service.registrar_pago(pago, current_user)

from typing import List, Optional

@router.get("/", response_model=List[PagoSuscripcionRead])
def list_pagos(
    estado: Optional[str] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    current_user: dict = Depends(get_current_user),
    service: SuscripcionService = Depends()
):
    return service.list_pagos(current_user, estado, fecha_inicio, fecha_fin)

@router.get("/{pago_id}", response_model=PagoSuscripcionRead)
def get_pago(
    pago_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: SuscripcionService = Depends()
):
    return service.get_pago(pago_id, current_user)

@router.post("/approve/{pago_id}", status_code=status.HTTP_200_OK)
def approve_pago(
    pago_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: SuscripcionService = Depends()
):
    return service.approve_pago(pago_id, current_user)

@router.post("/reject/{pago_id}", status_code=status.HTTP_200_OK)
def reject_pago(
    pago_id: UUID,
    observaciones: str = Body(None, embed=True),
    current_user: dict = Depends(get_current_user),
    service: SuscripcionService = Depends()
):
    """
    Rechaza un pago pendiente.
    """
    return service.reject_pago(pago_id, observaciones, current_user)

from models.Suscripcion import PagoSuscripcionQuick

@router.post("/superadmin/quick-pay", response_model=PagoSuscripcionRead, status_code=status.HTTP_201_CREATED)
def registrar_pago_rapido(
    data: PagoSuscripcionQuick,
    current_user: dict = Depends(get_current_user),
    service: SuscripcionService = Depends()
):
    """
    [Superadmin] Registro rápido de pago con cálculos automáticos en backend.
    """
    return service.registrar_pago_rapido(data, current_user)

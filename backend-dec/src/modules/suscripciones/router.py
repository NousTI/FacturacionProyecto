from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioSuscripciones
from .schemas import PlanLectura, PlanCreacion, PagoSuscripcionQuick
from ..autenticacion.dependencies import obtener_usuario_actual, requerir_superadmin

router = APIRouter()

@router.get("/planes", response_model=List[PlanLectura])
def listar_planes(
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.listar_planes()

@router.post("/pagos/rapido", status_code=status.HTTP_201_CREATED)
def registrar_pago_rapido(
    datos: PagoSuscripcionQuick,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.registrar_pago_rapido(datos, usuario)

@router.get("/pagos")
def listar_pagos(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.listar_pagos(usuario)

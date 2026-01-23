from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioSuscripciones
from .schemas import PlanLectura, PlanCreacion, PlanUpdate, PlanStats, PagoSuscripcionQuick, HistoricoSuscripcion
from ..autenticacion.dependencies import obtener_usuario_actual, requerir_superadmin

router = APIRouter()

@router.get("/planes", response_model=List[PlanLectura])
def listar_planes(
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.listar_planes()

@router.get("/planes/stats", response_model=PlanStats)
def obtener_stats(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.obtener_stats_dashboard(usuario)

@router.post("/planes", response_model=PlanLectura, status_code=status.HTTP_201_CREATED)
def crear_plan(
    datos: PlanCreacion,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.crear_plan(datos, usuario)

@router.get("/planes/{id}", response_model=PlanLectura)
def obtener_plan(
    id: UUID,
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.obtener_plan(id)

@router.get("/planes/{id}/empresas")
def listar_empresas_por_plan(
    id: UUID,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.listar_empresas_por_plan(id, usuario)


@router.patch("/planes/{id}", response_model=PlanLectura)
def actualizar_plan(
    id: UUID,
    datos: PlanUpdate,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.actualizar_plan(id, datos, usuario)

@router.delete("/planes/{id}")
def eliminar_plan(
    id: UUID,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioSuscripciones = Depends()
):
    servicio.eliminar_plan(id, usuario)
    return {"mensaje": "Plan eliminado correctamente"}

@router.post("/pagos/rapido", status_code=status.HTTP_201_CREATED)
def registrar_pago_rapido(
    datos: PagoSuscripcionQuick,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.registrar_pago_rapido(datos, usuario)

@router.get("/pagos", response_model=List[HistoricoSuscripcion])
@router.get("/pagos", response_model=List[HistoricoSuscripcion])
def listar_pagos(
    empresa_id: UUID = None,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioSuscripciones = Depends()
):
    return servicio.listar_pagos(usuario, empresa_id)

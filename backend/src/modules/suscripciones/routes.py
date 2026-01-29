from fastapi import APIRouter, Depends
from typing import List, Optional
from uuid import UUID
from .schemas import (
    PlanCreacion, PlanUpdate, PlanLectura, PlanStats,
    PagoSuscripcionQuick, HistoricoSuscripcion,
    SuscripcionCreacion, SuscripcionLectura, SuscripcionLogLectura
)
from .controller import SuscripcionController
from ..autenticacion.routes import obtener_usuario_actual
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

# --- Planes ---
@router.get("/planes", response_model=RespuestaBase[List[PlanLectura]])
def listar_planes(
    controller: SuscripcionController = Depends()
):
    return controller.listar_planes()

@router.get("/planes/stats", response_model=RespuestaBase[PlanStats])
def obtener_stats_planes(
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.obtener_stats_dashboard(usuario)

@router.get("/planes/{id}", response_model=RespuestaBase[PlanLectura])
def obtener_plan(
    id: UUID,
    controller: SuscripcionController = Depends()
):
    return controller.obtener_plan(id)

@router.post("/planes", response_model=RespuestaBase[PlanLectura], status_code=201)
def crear_plan(
    datos: PlanCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.crear_plan(datos, usuario)

@router.put("/planes/{id}", response_model=RespuestaBase[PlanLectura])
def actualizar_plan(
    id: UUID,
    datos: PlanUpdate,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.actualizar_plan(id, datos, usuario)

@router.delete("/planes/{id}")
def eliminar_plan(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.eliminar_plan(id, usuario)

@router.get("/planes/{plan_id}/empresas")
def listar_empresas_por_plan(
    plan_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.listar_empresas_por_plan(plan_id, usuario)

# --- Pagos ---
@router.post("/pagos/rapido")
def registrar_pago_rapido(
    datos: PagoSuscripcionQuick,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.registrar_pago_rapido(datos, usuario)

@router.get("/pagos", response_model=RespuestaBase[List[HistoricoSuscripcion]])
def listar_pagos(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.listar_pagos(usuario, empresa_id)


# --- Suscripciones Lifecycle ---
@router.post("/suscripciones/activar", response_model=RespuestaBase[SuscripcionLectura], status_code=201)
def activar_suscripcion(
    datos: SuscripcionCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.activar_suscripcion(datos, usuario)

@router.post("/suscripciones/{empresa_id}/cancelar", response_model=RespuestaBase[SuscripcionLectura])
def cancelar_suscripcion(
    empresa_id: UUID,
    observaciones: str,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.cancelar_suscripcion(empresa_id, observaciones, usuario)

@router.post("/suscripciones/{empresa_id}/suspender", response_model=RespuestaBase[SuscripcionLectura])
def suspender_suscripcion(
    empresa_id: UUID,
    observaciones: str,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.suspender_suscripcion(empresa_id, observaciones, usuario)

@router.post("/suscripciones/verificar-vencimientos")
def verificar_vencimientos(
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.verificar_vencimientos(usuario)

# --- Audit Log ---
@router.get('/suscripciones/{empresa_id}/historial', response_model=RespuestaBase[List[SuscripcionLogLectura]])
def obtener_historial_suscripcion(
    empresa_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: SuscripcionController = Depends()
):
    return controller.obtener_historial_suscripcion(empresa_id, usuario)

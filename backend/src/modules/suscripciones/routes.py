from fastapi import APIRouter, Depends
from typing import List, Optional
from uuid import UUID
from .schemas import (
    PlanCreacion, PlanUpdate, PlanLectura, PlanStats,
    PagoSuscripcionQuick, HistoricoSuscripcion,
    SuscripcionCreacion, SuscripcionLectura, SuscripcionLogLectura
)
from .controller import SuscripcionController
from ..autenticacion.dependencies import get_current_user
from ...constants.enums import AuthKeys
from ...utils.response_schemas import RespuestaBase
from ...errors.app_error import AppError

router = APIRouter()

def _check_suscripciones_ver(usuario: dict = Depends(get_current_user)):
    """Allow superadmin, vendors or any company user"""
    if (usuario.get(AuthKeys.IS_SUPERADMIN) or 
        usuario.get(AuthKeys.IS_VENDEDOR) or 
        usuario.get('empresa_id')):
        return usuario
    raise AppError("No tienes permisos suficientes", 403, code="PERM_001")

def _check_suscripciones_gestionar(usuario: dict = Depends(get_current_user)):
    """Allow only superadmin or vendors"""
    if usuario.get(AuthKeys.IS_SUPERADMIN) or usuario.get(AuthKeys.IS_VENDEDOR):
        return usuario
    raise AppError("Acción restringida a administradores y vendedores", 403, code="PERM_001")

# --- Planes ---
@router.get("/planes", response_model=RespuestaBase[List[PlanLectura]])
def listar_planes(
    usuario: dict = Depends(get_current_user),
    controller: SuscripcionController = Depends()
):
    """Acceso público o autenticado para ver planes disponibles. Vendors ven solo sus empresas"""
    return controller.listar_planes(usuario)

@router.get("/planes/stats", response_model=RespuestaBase[PlanStats])
def obtener_stats_planes(
    usuario: dict = Depends(_check_suscripciones_ver),
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
    usuario: dict = Depends(_check_suscripciones_gestionar),
    controller: SuscripcionController = Depends()
):
    return controller.crear_plan(datos, usuario)

@router.patch("/planes/{id}", response_model=RespuestaBase[PlanLectura])
def actualizar_plan(
    id: UUID,
    datos: PlanUpdate,
    usuario: dict = Depends(_check_suscripciones_gestionar),
    controller: SuscripcionController = Depends()
):
    return controller.actualizar_plan(id, datos, usuario)

@router.delete("/planes/{id}")
def eliminar_plan(
    id: UUID,
    usuario: dict = Depends(_check_suscripciones_gestionar),
    controller: SuscripcionController = Depends()
):
    return controller.eliminar_plan(id, usuario)

@router.get("/planes/{plan_id}/empresas")
def listar_empresas_por_plan(
    plan_id: UUID,
    usuario: dict = Depends(_check_suscripciones_ver),
    controller: SuscripcionController = Depends()
):
    return controller.listar_empresas_por_plan(plan_id, usuario)

# --- Pagos ---
@router.post("/pagos/rapido")
def registrar_pago_rapido(
    datos: PagoSuscripcionQuick,
    usuario: dict = Depends(_check_suscripciones_gestionar),
    controller: SuscripcionController = Depends()
):
    return controller.registrar_pago_rapido(datos, usuario)

@router.get("/pagos", response_model=RespuestaBase[List[HistoricoSuscripcion]])
def listar_pagos(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(_check_suscripciones_ver),
    controller: SuscripcionController = Depends()
):
    return controller.listar_pagos(usuario, empresa_id)


# --- Suscripciones Lifecycle ---
@router.post("/activar", response_model=RespuestaBase[SuscripcionLectura], status_code=201)
def activar_suscripcion(
    datos: SuscripcionCreacion,
    usuario: dict = Depends(_check_suscripciones_gestionar),
    controller: SuscripcionController = Depends()
):
    return controller.activar_suscripcion(datos, usuario)

@router.post("/{empresa_id}/cancelar", response_model=RespuestaBase[SuscripcionLectura])
def cancelar_suscripcion(
    empresa_id: UUID,
    observaciones: str,
    usuario: dict = Depends(_check_suscripciones_gestionar),
    controller: SuscripcionController = Depends()
):
    return controller.cancelar_suscripcion(empresa_id, observaciones, usuario)

@router.post("/{empresa_id}/suspender", response_model=RespuestaBase[SuscripcionLectura])
def suspender_suscripcion(
    empresa_id: UUID,
    observaciones: str,
    usuario: dict = Depends(_check_suscripciones_gestionar),
    controller: SuscripcionController = Depends()
):
    return controller.suspender_suscripcion(empresa_id, observaciones, usuario)

@router.post("/verificar-vencimientos")
def verificar_vencimientos(
    usuario: dict = Depends(_check_suscripciones_gestionar),
    controller: SuscripcionController = Depends()
):
    return controller.verificar_vencimientos(usuario)

# --- Audit Log ---
@router.get('/{empresa_id}/historial', response_model=RespuestaBase[List[SuscripcionLogLectura]])
def obtener_historial_suscripcion(
    empresa_id: UUID,
    usuario: dict = Depends(_check_suscripciones_ver),
    controller: SuscripcionController = Depends()
):
    return controller.obtener_historial_suscripcion(empresa_id, usuario)

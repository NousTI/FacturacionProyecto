from fastapi import APIRouter, Depends
from .service import ServicioDashboards
from .schemas import (
    ResumenDashboard, 
    DashboardGraficos, 
    DashboardKPIs, 
    DashboardAlertas, 
    DashboardOverview
)
from ..autenticacion.routes import obtener_usuario_actual

router = APIRouter()

@router.get("/summary", response_model=ResumenDashboard)
def obtener_resumen(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioDashboards = Depends()
):
    return servicio.obtener_resumen(usuario)

@router.get("/charts", response_model=DashboardGraficos)
def obtener_graficos(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioDashboards = Depends()
):
    return servicio.obtener_graficos(usuario)

@router.get("/kpis", response_model=DashboardKPIs)
def obtener_kpis(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioDashboards = Depends()
):
    """Retorna KPIs principales del dashboard adaptados al rol."""
    return servicio.obtener_kpis(usuario)

@router.get("/alertas", response_model=DashboardAlertas)
def obtener_alertas(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioDashboards = Depends()
):
    """Retorna alertas del sistema categorizadas por rol."""
    return servicio.obtener_alertas(usuario)

@router.get("/overview", response_model=DashboardOverview)
def obtener_overview(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioDashboards = Depends()
):
    """Objeto agregado para carga inicial adaptado al rol."""
    return servicio.obtener_overview(usuario)

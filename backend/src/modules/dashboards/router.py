from fastapi import APIRouter, Depends
from .service import ServicioDashboards
from .schemas import (
    ResumenDashboard, 
    DashboardGraficos, 
    DashboardKPIs, 
    DashboardAlertas, 
    DashboardOverview
)
from ..autenticacion.dependencies import requerir_superadmin

router = APIRouter()

@router.get("/summary", response_model=ResumenDashboard)
def obtener_resumen(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioDashboards = Depends()
):
    return servicio.obtener_resumen()

@router.get("/charts", response_model=DashboardGraficos)
def obtener_graficos(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioDashboards = Depends()
):
    return servicio.obtener_graficos()

@router.get("/kpis", response_model=DashboardKPIs)
def obtener_kpis(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioDashboards = Depends()
):
    """Retorna KPIs principales del dashboard (endpoint nuevo)."""
    return servicio.obtener_kpis()

@router.get("/alertas", response_model=DashboardAlertas)
def obtener_alertas(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioDashboards = Depends()
):
    """Retorna alertas del sistema categorizadas (endpoint nuevo)."""
    return servicio.obtener_alertas()

@router.get("/overview", response_model=DashboardOverview)
def obtener_overview(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioDashboards = Depends()
):
    """Objeto agregado para carga inicial (compatibilidad y optimización)."""
    return servicio.obtener_overview()

from fastapi import APIRouter, Depends
from .service import ServicioDashboards
from .schemas import ResumenDashboard, DashboardGraficos
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

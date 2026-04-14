from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .superadmin_reportes_service import SuperAdminReportesService
from .schemas import (
    ReporteGlobalSuperadmin, 
    ReporteComisionesSuperadmin, 
    ReporteUsoSistemaSuperadmin
)
from ..schemas import ReporteLectura, ReporteCreacion
from ..service import ServicioReportes # Importamos el servicio principal para métodos compartidos como listar/eliminar
from ...autenticacion.routes import requerir_superadmin

router = APIRouter()

@router.get("/", response_model=List[ReporteLectura])
def listar_reportes_superadmin(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioReportes = Depends()
):
    return servicio.listar_reportes(usuario)

@router.post("/", response_model=ReporteLectura, status_code=status.HTTP_201_CREATED)
def generar_reporte_superadmin(
    datos: ReporteCreacion,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioReportes = Depends()
):
    return servicio.crear_reporte(datos, usuario)

@router.delete("/{id}")
def eliminar_reporte_superadmin(
    id: UUID,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioReportes = Depends()
):
    servicio.eliminar_reporte(id, usuario)
    return {"message": "Reporte eliminado correctamente"}

# =========================================================
# R-031: REPORTE GLOBAL SUPERADMIN
# =========================================================
@router.get("/global", response_model=ReporteGlobalSuperadmin)
def obtener_r_031_reporte_global(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(requerir_superadmin),
    servicio: SuperAdminReportesService = Depends()
):
    return servicio.obtener_r_031_reporte_global(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)


# =========================================================
# R-032: COMISIONES POR VENDEDOR (SUPERADMIN)
# =========================================================
@router.get("/comisiones", response_model=ReporteComisionesSuperadmin)
def obtener_reporte_comisiones_superadmin(
    vendedor_id: Optional[UUID] = None,
    estado: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(requerir_superadmin),
    servicio: SuperAdminReportesService = Depends()
):
    return servicio.obtener_reporte_comisiones_superadmin(
        vendedor_id=str(vendedor_id) if vendedor_id else None,
        estado=estado,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )


# =========================================================
# R-033: USO DEL SISTEMA POR EMPRESA (SUPERADMIN)
# =========================================================
@router.get("/uso-empresas", response_model=ReporteUsoSistemaSuperadmin)
def obtener_reporte_uso_sistema(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(requerir_superadmin),
    servicio: SuperAdminReportesService = Depends()
):
    return servicio.obtener_reporte_uso_sistema_superadmin(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)

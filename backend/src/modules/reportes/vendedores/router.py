from fastapi import APIRouter, Depends, status, HTTPException
from typing import List, Optional
from uuid import UUID
import os

from ..service import ServicioReportes
from ..schemas import ReporteLectura, ReporteCreacion
from .schemas import (
    MetricasVendedorLectura,
    ReporteEmpresasVendedor,
    ReporteComisionesVendedor
)
from ...autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ....constants.permissions import PermissionCodes
from ....constants.enums import AuthKeys
from ....errors.app_error import AppError

router = APIRouter()

@router.get("/metricas", response_model=MetricasVendedorLectura)
def obtener_metricas_vendedor(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioReportes = Depends()
):
    """Devuelve las métricas esenciales para el dashboard del vendedor"""
    return servicio.obtener_metricas_vendedor(usuario)

@router.get("", response_model=List[ReporteLectura])
def listar_reportes_vendedor(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioReportes = Depends()
):
    """Lista los reportes generados por el vendedor"""
    return servicio.listar_reportes(usuario)

@router.post("", response_model=ReporteLectura, status_code=status.HTTP_201_CREATED)
def generar_reporte_vendedor(
    datos: ReporteCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioReportes = Depends()
):
    """Genera un nuevo reporte para el vendedor (PDF)"""
    return servicio.crear_reporte(datos, usuario)

@router.delete("/{id}")
def eliminar_reporte_vendedor(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioReportes = Depends()
):
    """Elimina un reporte generado por el vendedor"""
    servicio.eliminar_reporte(id, usuario)
    return {"message": "Reporte eliminado correctamente"}

@router.get("/mis-empresas", response_model=ReporteEmpresasVendedor)
def obtener_reporte_vendedor_mis_empresas(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioReportes = Depends()
):
    """R-031 (reducido): Mis empresas con filtros de fecha."""
    vendedor_id = usuario.get(AuthKeys.INTERNAL_VENDEDOR_ID)
    if not vendedor_id: raise AppError("No autorizado como vendedor", 403)
    return servicio.obtener_reporte_vendedor_mis_empresas(vendedor_id, fecha_inicio, fecha_fin)

@router.get("/mis-comisiones", response_model=ReporteComisionesVendedor)
def obtener_reporte_vendedor_mis_comisiones(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioReportes = Depends()
):
    """R-032 (reducido): Mis comisiones con filtros de fecha."""
    vendedor_id = usuario.get(AuthKeys.INTERNAL_VENDEDOR_ID)
    if not vendedor_id: raise AppError("No autorizado como vendedor", 403)
    return servicio.obtener_reporte_vendedor_mis_comisiones(vendedor_id, fecha_inicio, fecha_fin)

@router.get("/descargar/{filename}")
def descargar_reporte(
    filename: str,
    usuario: dict = Depends(obtener_usuario_actual)
):
    """Descarga un reporte PDF con header de descarga (Servidor Estático)"""
    from fastapi.responses import FileResponse

    filepath = os.path.join("static", "reportes", filename)

    if not os.path.exists(filepath):
        raise AppError("Archivo no encontrado", 404)

    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .service import ServicioReportes
from .schemas import ReporteLectura, ReporteCreacion, MetricasVendedorLectura
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ..autenticacion.dependencies import requerir_superadmin
from ..permisos.constants import PermisosVendedor

router = APIRouter()

# --- RUTAS GENERALES (USUARIO EMPRESA) ---

@router.get("/", response_model=List[ReporteLectura])
def listar_reportes_usuario(
    usuario: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    """Lista todos los reportes generados por la empresa"""
    return servicio.listar_reportes(usuario)

@router.post("/", response_model=ReporteLectura, status_code=status.HTTP_201_CREATED)
def generar_reporte_usuario(
    datos: ReporteCreacion,
    usuario: dict = Depends(requerir_permiso("REPORTES_EXPORTAR")),
    servicio: ServicioReportes = Depends()
):
    """Genera un nuevo reporte (Exportación)"""
    return servicio.crear_reporte(datos, usuario)

@router.get("/{id}", response_model=ReporteLectura)
def obtener_reporte_usuario(
    id: UUID,
    usuario: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    """Obtiene el detalle de un reporte específico"""
    return servicio.obtener_reporte(id, usuario)

@router.delete("/{id}")
def eliminar_reporte_usuario(
    id: UUID,
    usuario: dict = Depends(requerir_permiso("REPORTES_EXPORTAR")),
    servicio: ServicioReportes = Depends()
):
    """Elimina un reporte generado"""
    servicio.eliminar_reporte(id, usuario)
    return {"message": "Reporte eliminado correctamente"}

# --- RUTAS DE VENDEDOR --- (Mantenidas para compatibilidad)
@router.get("/vendedor/metricas", response_model=MetricasVendedorLectura)
def obtener_metricas_vendedor(
    usuario: dict = Depends(requerir_permiso([PermisosVendedor.VER_REPORTES, "REPORTES_VER"])),
    servicio: ServicioReportes = Depends()
):
    """Devuelve las métricas esenciales para el dashboard del vendedor"""
    return servicio.obtener_metricas_vendedor(usuario)

@router.get("/vendedor", response_model=List[ReporteLectura])
def listar_reportes_vendedor(
    usuario: dict = Depends(requerir_permiso([PermisosVendedor.VER_REPORTES, "REPORTES_VER"])),
    servicio: ServicioReportes = Depends()
):
    return servicio.listar_reportes(usuario)

@router.post("/vendedor", response_model=ReporteLectura, status_code=status.HTTP_201_CREATED)
def generar_reporte_vendedor(
    datos: ReporteCreacion,
    usuario: dict = Depends(requerir_permiso([PermisosVendedor.VER_REPORTES, "REPORTES_EXPORTAR"])),
    servicio: ServicioReportes = Depends()
):
    return servicio.crear_reporte(datos, usuario)

@router.delete("/vendedor/{id}")
def eliminar_reporte_vendedor(
    id: UUID,
    usuario: dict = Depends(requerir_permiso([PermisosVendedor.VER_REPORTES, "REPORTES_EXPORTAR"])),
    servicio: ServicioReportes = Depends()
):
    servicio.eliminar_reporte(id, usuario)
    return {"message": "Reporte eliminado correctamente"}

# --- RUTAS DE SUPERADMIN ---
@router.get("/superadmin", response_model=List[ReporteLectura])
def listar_reportes_superadmin(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioReportes = Depends()
):
    return servicio.listar_reportes(usuario)

@router.post("/superadmin", response_model=ReporteLectura, status_code=status.HTTP_201_CREATED)
def generar_reporte_superadmin(
    datos: ReporteCreacion,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioReportes = Depends()
):
    return servicio.crear_reporte(datos, usuario)

@router.delete("/superadmin/{id}")
def eliminar_reporte_superadmin(
    id: UUID,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioReportes = Depends()
):
    servicio.eliminar_reporte(id, usuario)
    return {"message": "Reporte eliminado correctamente"}

@router.post("/preview")
def preview_reporte(
    datos: ReporteCreacion,
    usuario: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    return servicio.obtener_datos_preview(datos, usuario)


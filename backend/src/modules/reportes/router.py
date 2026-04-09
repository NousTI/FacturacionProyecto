from fastapi import APIRouter, Depends, status
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from .service import ServicioReportes
from .schemas import (
    ReporteLectura, ReporteCreacion, MetricasVendedorLectura,
    ReporteGlobalSuperadmin, ReporteComisionesSuperadmin, ReporteUsoSistemaSuperadmin
)
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

# Mover /exportar antes de /{id} para evitar conflicto con UUID
@router.get("/exportar")
def exportar_reporte_ventas(
    tipo: str,
    formato: str, # 'pdf' o 'excel'
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    anio: Optional[int] = None,
    establecimiento_id: Optional[UUID] = None,
    punto_emision_id: Optional[UUID] = None,
    usuario_id: Optional[UUID] = None,
    estado: Optional[str] = None,
    usuario_actual: dict = Depends(requerir_permiso([PermisosVendedor.VER_REPORTES, "REPORTES_EXPORTAR"])),
    servicio: ServicioReportes = Depends()
):
    """Genera y descarga un reporte en formato PDF o Excel."""
    from fastapi.responses import StreamingResponse
    
    empresa_id = usuario_actual.get("empresa_id")
    params = {
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "anio": anio,
        "establecimiento_id": establecimiento_id,
        "punto_emision_id": punto_emision_id,
        "usuario_id": usuario_id,
        "estado": estado
    }
    
    file_stream = servicio.exportar_reporte(empresa_id, tipo, formato, params)
    
    filename = f"reporte_{tipo.lower()}_{datetime.now().strftime('%Y%m%d')}"
    if formato == 'pdf':
        media_type = "application/pdf"
        filename += ".pdf"
    else:
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename += ".xlsx"

    return StreamingResponse(
        file_stream,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

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
    usuario: dict = Depends(requerir_permiso([PermisosVendedor.VER_REPORTES, "REPORTES_VER"])),
    servicio: ServicioReportes = Depends()
):
    return servicio.obtener_datos_preview(datos, usuario)

# --- RUTAS DE VENTAS Y FACTURACIÓN (R-001 a R-005) ---

@router.get("/ventas/general")
def obtener_reporte_ventas_general(
    fecha_inicio: str,
    fecha_fin: str,
    establecimiento_id: Optional[UUID] = None,
    punto_emision_id: Optional[UUID] = None,
    usuario_id: Optional[UUID] = None,
    estado: Optional[str] = None,
    usuario_actual: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    """R-001: Reporte de Ventas General."""
    empresa_id = usuario_actual.get("empresa_id")
    params = {
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "establecimiento_id": establecimiento_id,
        "punto_emision_id": punto_emision_id,
        "usuario_id": usuario_id,
        "estado": estado
    }
    return servicio.obtener_ventas_general(empresa_id, params)

@router.get("/ventas/mensuales")
def obtener_reporte_ventas_mensuales(
    anio: int,
    usuario_actual: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    """R-002: Ventas por Mes/Año."""
    empresa_id = usuario_actual.get("empresa_id")
    return servicio.obtener_ventas_mensuales(empresa_id, anio)

@router.get("/ventas/usuarios")
def obtener_reporte_ventas_usuarios(
    fecha_inicio: str,
    fecha_fin: str,
    usuario_id: Optional[UUID] = None,
    usuario_actual: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    """R-003: Ventas por Usuario."""
    empresa_id = usuario_actual.get("empresa_id")
    params = {
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "usuario_id": usuario_id
    }
    return servicio.obtener_ventas_por_usuario(empresa_id, params)

@router.get("/ventas/anuladas")
def obtener_reporte_facturas_anuladas(
    fecha_inicio: str,
    fecha_fin: str,
    usuario_id: Optional[UUID] = None,
    usuario_actual: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    """R-004: Facturas Anuladas."""
    empresa_id = usuario_actual.get("empresa_id")
    params = {
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "usuario_id": usuario_id
    }
    return servicio.obtener_facturas_anuladas(empresa_id, params)

@router.get("/ventas/rechazadas-sri")
def obtener_reporte_facturas_rechazadas_sri(
    fecha_inicio: str,
    fecha_fin: str,
    estado: Optional[str] = None,
    usuario_actual: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    """R-005: Facturas Rechazadas por SRI."""
    empresa_id = usuario_actual.get("empresa_id")
    params = {
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "estado": estado
    }
    return servicio.obtener_facturas_rechazadas_sri(empresa_id, params)

# --- RUTAS DE REPORTES FINANCIEROS (R-026 a R-028) ---

@router.get("/financiero/pyg")
def obtener_reporte_pyg(
    fecha_inicio: str,
    fecha_fin: str,
    usuario_actual: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    """R-026: Estado de Resultados (PyG)."""
    empresa_id = usuario_actual.get("empresa_id")
    return servicio.obtener_pyg_usuario(empresa_id, fecha_inicio, fecha_fin)

@router.get("/financiero/iva")
def obtener_reporte_iva_ventas(
    fecha_inicio: str,
    fecha_fin: str,
    usuario_actual: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    """R-027: Reporte de IVA (Ventas)."""
    empresa_id = usuario_actual.get("empresa_id")
    return servicio.obtener_iva_ventas_usuario(empresa_id, fecha_inicio, fecha_fin)

@router.get("/financiero/resumen")
def obtener_resumen_ejecutivo(
    fecha_inicio: str,
    fecha_fin: str,
    usuario_actual: dict = Depends(requerir_permiso("REPORTES_VER")),
    servicio: ServicioReportes = Depends()
):
    """R-028: Resumen Ejecutivo (KPIs)."""
    empresa_id = usuario_actual.get("empresa_id")
    return servicio.obtener_resumen_ejecutivo_usuario(empresa_id, fecha_inicio, fecha_fin)

# =========================================================
# R-031: REPORTE GLOBAL SUPERADMIN
# =========================================================
@router.get("/superadmin/global", response_model=ReporteGlobalSuperadmin)
def obtener_reporte_global(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioReportes = Depends()
):
    """R-031: Vista consolidada de todas las empresas, ingresos, zonas upgrade/rescate y gráficas globales."""
    return servicio.obtener_reporte_global_superadmin(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)


# =========================================================
# R-032: COMISIONES POR VENDEDOR (SUPERADMIN)
# =========================================================
@router.get("/superadmin/comisiones", response_model=ReporteComisionesSuperadmin)
def obtener_reporte_comisiones_superadmin(
    vendedor_id: Optional[UUID] = None,
    estado: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioReportes = Depends()
):
    """R-032: KPIs y detalle de comisiones por vendedor con top vendedores y planes más vendidos."""
    return servicio.obtener_reporte_comisiones_superadmin(
        vendedor_id=str(vendedor_id) if vendedor_id else None,
        estado=estado,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin
    )


# =========================================================
# R-033: USO DEL SISTEMA POR EMPRESA (SUPERADMIN)
# =========================================================
@router.get("/superadmin/uso-empresas", response_model=ReporteUsoSistemaSuperadmin)
def obtener_reporte_uso_sistema(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioReportes = Depends()
):
    """R-033: Métricas de uso por empresa: usuarios, facturas, % plan, módulos y último acceso."""
    return servicio.obtener_reporte_uso_sistema_superadmin(fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)




from fastapi import APIRouter, Depends, Query, Request
from typing import List, Optional
from uuid import UUID

from .schemas import ClienteCreacion, ClienteLectura, ClienteStats, ClienteActualizacion
from .analitica_schemas import (
    ReporteNuevosClientesResponse,
    ReporteTopClientesResponse,
    ReporteClientesInactivosResponse,
    ReporteAnalisisClientesResponse,
)
from .controller import ClienteController
from ..autenticacion.permissions import requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response_schemas import RespuestaBase

router = APIRouter(tags=["Clientes"], redirect_slashes=False)

@router.get("/stats", response_model=RespuestaBase[ClienteStats])
def obtener_stats(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTES_VER)),
    controller: ClienteController = Depends()
):
    return controller.obtener_stats(usuario)

@router.get("/exportar")
def exportar_clientes(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTES_EXPORTAR)),
    controller: ClienteController = Depends()
):
    return controller.exportar_clientes(usuario, start_date, end_date)

# ----------------------------------------------------------------
# ANALÍTICA (deben ir ANTES de /{id} para evitar conflictos)
# ----------------------------------------------------------------

@router.get("/analitica/nuevos-por-mes", response_model=RespuestaBase[ReporteNuevosClientesResponse])
def analitica_nuevos_por_mes(
    meses: int = Query(default=6, ge=1, le=24, description="Número de meses a analizar"),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTES_VER)),
    controller: ClienteController = Depends()
):
    """R-017: Clientes nuevos registrados por mes con primera compra vs sin compras."""
    return controller.obtener_nuevos_por_mes(usuario, meses)

@router.get("/analitica/top", response_model=RespuestaBase[ReporteTopClientesResponse])
def analitica_top_clientes(
    fecha_inicio: Optional[str] = Query(None, description="Fecha inicio YYYY-MM-DD"),
    fecha_fin: Optional[str] = Query(None, description="Fecha fin YYYY-MM-DD"),
    criterio: str = Query(default="monto", description="'monto' o 'facturas'"),
    limit: int = Query(default=10, description="5, 10 o 20"),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTES_VER)),
    controller: ClienteController = Depends()
):
    """R-018: Ranking de mejores compradores por monto o cantidad de facturas."""
    return controller.obtener_top_clientes(usuario, fecha_inicio, fecha_fin, criterio, limit)

@router.get("/analitica/inactivos", response_model=RespuestaBase[ReporteClientesInactivosResponse])
def analitica_clientes_inactivos(
    dias: int = Query(default=90, ge=1, description="Días sin factura para considerar inactivo"),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTES_VER)),
    controller: ClienteController = Depends()
):
    """R-019: Clientes sin compras en los últimos X días."""
    return controller.obtener_clientes_inactivos(usuario, dias)

@router.get("/analitica/analisis", response_model=RespuestaBase[ReporteAnalisisClientesResponse])
def analitica_analisis_clientes(
    periodo_meses: int = Query(default=3, ge=1, le=12, description="Meses para calcular frecuencia de compra"),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTES_VER)),
    controller: ClienteController = Depends()
):
    """R-020: Segmentación de cartera y análisis Pareto 80/20."""
    return controller.obtener_analisis_clientes(usuario, periodo_meses)

# ----------------------------------------------------------------
# CRUD BASE
# ----------------------------------------------------------------

@router.get("", response_model=RespuestaBase[List[ClienteLectura]])
def listar_clientes(
    empresa_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(requerir_permiso([PermissionCodes.CLIENTES_VER, PermissionCodes.FACTURAS_CREAR, PermissionCodes.FACTURAS_EDITAR, PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS, PermissionCodes.FACTURA_PROGRAMADA_CREAR, PermissionCodes.FACTURA_PROGRAMADA_EDITAR])),
    controller: ClienteController = Depends()
):
    return controller.listar_clientes(usuario, empresa_id)

@router.post("", response_model=RespuestaBase[ClienteLectura], status_code=201)
def crear_cliente(
    datos: ClienteCreacion,
    request: Request,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTES_CREAR)),
    controller: ClienteController = Depends()
):
    return controller.crear_cliente(datos, usuario, request)

@router.get("/{id}", response_model=RespuestaBase[ClienteLectura])
def obtener_cliente(
    id: UUID,
    usuario: dict = Depends(requerir_permiso([PermissionCodes.CLIENTES_VER, PermissionCodes.FACTURAS_CREAR, PermissionCodes.FACTURAS_EDITAR, PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS, PermissionCodes.FACTURA_PROGRAMADA_CREAR, PermissionCodes.FACTURA_PROGRAMADA_EDITAR])),
    controller: ClienteController = Depends()
):
    return controller.obtener_cliente(id, usuario)

@router.put("/{id}", response_model=RespuestaBase[ClienteLectura])
def actualizar_cliente(
    id: UUID,
    datos: ClienteActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTES_EDITAR)),
    controller: ClienteController = Depends()
):
    return controller.actualizar_cliente(id, datos, usuario)

@router.delete("/{id}")
def eliminar_cliente(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.CLIENTES_ELIMINAR)),
    controller: ClienteController = Depends()
):
    return controller.eliminar_cliente(id, usuario)

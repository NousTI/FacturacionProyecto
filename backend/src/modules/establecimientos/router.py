from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from .schemas import EstablecimientoCreacion, EstablecimientoLectura, EstablecimientoActualizacion
from .service import ServicioEstablecimientos
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.post("/", response_model=RespuestaBase[EstablecimientoLectura], status_code=status.HTTP_201_CREATED)
def crear_establecimiento(
    datos: EstablecimientoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    servicio: ServicioEstablecimientos = Depends()
):
    establecimiento = servicio.crear_establecimiento(datos, usuario)
    return success_response(establecimiento, "Establecimiento creado correctamente")

@router.get("/", response_model=RespuestaBase[List[EstablecimientoLectura]])
def listar_establecimientos(
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    empresa_id: Optional[UUID] = Query(None),
    solo_activos: bool = Query(False),
    usuario: dict = Depends(requerir_permiso([PermissionCodes.ESTABLECIMIENTO_GESTIONAR, PermissionCodes.FACTURAS_CREAR, PermissionCodes.FACTURAS_EDITAR, PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS, PermissionCodes.FACTURA_PROGRAMADA_CREAR, PermissionCodes.FACTURA_PROGRAMADA_EDITAR])),
    servicio: ServicioEstablecimientos = Depends()
):
    establecimientos = servicio.listar_establecimientos(usuario, empresa_id, limit, offset, solo_activos)
    return success_response(establecimientos, "Establecimientos listados correctamente")

@router.get("/stats", response_model=RespuestaBase[dict])
def obtener_estadisticas_establecimientos(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    servicio: ServicioEstablecimientos = Depends()
):
    """Obtiene estadísticas generales de establecimientos"""
    stats = servicio.obtener_estadisticas(usuario)
    return success_response(stats, "Estadísticas obtenidas correctamente")

@router.get("/{establecimiento_id}", response_model=RespuestaBase[EstablecimientoLectura])
def obtener_establecimiento(
    establecimiento_id: UUID,
    usuario: dict = Depends(requerir_permiso([PermissionCodes.ESTABLECIMIENTO_GESTIONAR, PermissionCodes.FACTURAS_CREAR, PermissionCodes.FACTURAS_EDITAR, PermissionCodes.FACTURAS_VER_TODAS, PermissionCodes.FACTURAS_VER_PROPIAS, PermissionCodes.FACTURA_PROGRAMADA_CREAR, PermissionCodes.FACTURA_PROGRAMADA_EDITAR])),
    servicio: ServicioEstablecimientos = Depends()
):
    establecimiento = servicio.obtener_establecimiento(establecimiento_id, usuario)
    return success_response(establecimiento, "Establecimiento obtenido correctamente")

@router.put("/{establecimiento_id}", response_model=RespuestaBase[EstablecimientoLectura])
def actualizar_establecimiento(
    establecimiento_id: UUID,
    datos: EstablecimientoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    servicio: ServicioEstablecimientos = Depends()
):
    establecimiento = servicio.actualizar_establecimiento(establecimiento_id, datos, usuario)
    return success_response(establecimiento, "Establecimiento actualizado correctamente")

@router.delete("/{establecimiento_id}", response_model=RespuestaBase[dict])
def eliminar_establecimiento(
    establecimiento_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ESTABLECIMIENTO_GESTIONAR)),
    servicio: ServicioEstablecimientos = Depends()
):
    servicio.eliminar_establecimiento(establecimiento_id, usuario)
    return success_response(None, "Establecimiento eliminado correctamente")

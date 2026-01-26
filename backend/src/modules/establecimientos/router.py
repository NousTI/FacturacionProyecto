from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from .schemas import EstablecimientoCreacion, EstablecimientoLectura, EstablecimientoActualizacion
from .service import ServicioEstablecimientos
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()

@router.post("/", response_model=EstablecimientoLectura, status_code=status.HTTP_201_CREATED)
def crear_establecimiento(
    datos: EstablecimientoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ESTABLECIMIENTO_CREAR)),
    servicio: ServicioEstablecimientos = Depends()
):
    return servicio.crear_establecimiento(datos, usuario)

@router.get("/", response_model=List[EstablecimientoLectura])
def listar_establecimientos(
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    empresa_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ESTABLECIMIENTO_VER)),
    servicio: ServicioEstablecimientos = Depends()
):
    return servicio.listar_establecimientos(usuario, empresa_id, limit, offset)

@router.get("/{establecimiento_id}", response_model=EstablecimientoLectura)
def obtener_establecimiento(
    establecimiento_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ESTABLECIMIENTO_VER)),
    servicio: ServicioEstablecimientos = Depends()
):
    return servicio.obtener_establecimiento(establecimiento_id, usuario)

@router.put("/{establecimiento_id}", response_model=EstablecimientoLectura)
def actualizar_establecimiento(
    establecimiento_id: UUID,
    datos: EstablecimientoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ESTABLECIMIENTO_EDITAR)),
    servicio: ServicioEstablecimientos = Depends()
):
    return servicio.actualizar_establecimiento(establecimiento_id, datos, usuario)

@router.delete("/{establecimiento_id}")
def eliminar_establecimiento(
    establecimiento_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ESTABLECIMIENTO_ELIMINAR)),
    servicio: ServicioEstablecimientos = Depends()
):
    servicio.eliminar_establecimiento(establecimiento_id, usuario)
    return success_response(None, "Establecimiento eliminado correctamente")

from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from uuid import UUID

from .schemas import PuntoEmisionCreacion, PuntoEmisionLectura, PuntoEmisionActualizacion
from .service import ServicioPuntosEmision
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()

@router.post("/", response_model=PuntoEmisionLectura, status_code=status.HTTP_201_CREATED)
def crear_punto(
    datos: PuntoEmisionCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PUNTO_EMISION_CREAR)),
    servicio: ServicioPuntosEmision = Depends()
):
    return servicio.crear_punto(datos, usuario)

@router.get("/", response_model=List[PuntoEmisionLectura])
def listar_puntos(
    establecimiento_id: Optional[UUID] = Query(None),
    limit: int = Query(100, ge=1),
    offset: int = Query(0, ge=0),
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PUNTO_EMISION_VER)),
    servicio: ServicioPuntosEmision = Depends()
):
    return servicio.listar_puntos(usuario, establecimiento_id, limit, offset)

@router.get("/{punto_id}", response_model=PuntoEmisionLectura)
def obtener_punto(
    punto_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PUNTO_EMISION_VER)),
    servicio: ServicioPuntosEmision = Depends()
):
    return servicio.obtener_punto(punto_id, usuario)

@router.put("/{punto_id}", response_model=PuntoEmisionLectura)
def actualizar_punto(
    punto_id: UUID,
    datos: PuntoEmisionActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PUNTO_EMISION_EDITAR)),
    servicio: ServicioPuntosEmision = Depends()
):
    return servicio.actualizar_punto(punto_id, datos, usuario)

@router.delete("/{punto_id}")
def eliminar_punto(
    punto_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.PUNTO_EMISION_ELIMINAR)),
    servicio: ServicioPuntosEmision = Depends()
):
    servicio.eliminar_punto(punto_id, usuario)
    return success_response(None, "Punto de emisión eliminado correctamente")

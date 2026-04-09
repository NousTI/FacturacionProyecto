from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .schemas import TipoMovimientoCreacion, TipoMovimientoLectura, TipoMovimientoActualizacion
from .service import ServicioTipoMovimiento
from ..autenticacion.routes import requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()


@router.get("/", response_model=List[TipoMovimientoLectura])
def listar_tipos_movimiento(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.TIPO_MOVIMIENTO_VER)),
    servicio: ServicioTipoMovimiento = Depends()
):
    return servicio.listar_tipos_movimiento(usuario)


@router.post("/", response_model=TipoMovimientoLectura, status_code=status.HTTP_201_CREATED)
def crear_tipo_movimiento(
    datos: TipoMovimientoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.TIPO_MOVIMIENTO_CREAR)),
    servicio: ServicioTipoMovimiento = Depends()
):
    return servicio.crear_tipo_movimiento(datos, usuario)


@router.get("/{id}", response_model=TipoMovimientoLectura)
def obtener_tipo_movimiento(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.TIPO_MOVIMIENTO_VER)),
    servicio: ServicioTipoMovimiento = Depends()
):
    return servicio.obtener_tipo_movimiento(id, usuario)


@router.put("/{id}", response_model=TipoMovimientoLectura)
def actualizar_tipo_movimiento(
    id: UUID,
    datos: TipoMovimientoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.TIPO_MOVIMIENTO_EDITAR)),
    servicio: ServicioTipoMovimiento = Depends()
):
    return servicio.actualizar_tipo_movimiento(id, datos, usuario)


@router.delete("/{id}")
def eliminar_tipo_movimiento(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.TIPO_MOVIMIENTO_ELIMINAR)),
    servicio: ServicioTipoMovimiento = Depends()
):
    servicio.eliminar_tipo_movimiento(id, usuario)
    return success_response(None, "Tipo de movimiento eliminado correctamente")

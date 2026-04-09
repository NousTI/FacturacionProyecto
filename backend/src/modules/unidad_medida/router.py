from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID

from .schemas import UnidadMedidaCreacion, UnidadMedidaLectura, UnidadMedidaActualizacion
from .service import ServicioUnidadMedida
from ..autenticacion.routes import requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()


@router.get("/", response_model=List[UnidadMedidaLectura])
def listar_unidades_medida(
    usuario: dict = Depends(requerir_permiso(PermissionCodes.UNIDAD_MEDIDA_VER)),
    servicio: ServicioUnidadMedida = Depends()
):
    return servicio.listar_unidades_medida(usuario)


@router.post("/", response_model=UnidadMedidaLectura, status_code=status.HTTP_201_CREATED)
def crear_unidad_medida(
    datos: UnidadMedidaCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.UNIDAD_MEDIDA_CREAR)),
    servicio: ServicioUnidadMedida = Depends()
):
    return servicio.crear_unidad_medida(datos, usuario)


@router.get("/{id}", response_model=UnidadMedidaLectura)
def obtener_unidad_medida(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.UNIDAD_MEDIDA_VER)),
    servicio: ServicioUnidadMedida = Depends()
):
    return servicio.obtener_unidad_medida(id, usuario)


@router.put("/{id}", response_model=UnidadMedidaLectura)
def actualizar_unidad_medida(
    id: UUID,
    datos: UnidadMedidaActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.UNIDAD_MEDIDA_EDITAR)),
    servicio: ServicioUnidadMedida = Depends()
):
    return servicio.actualizar_unidad_medida(id, datos, usuario)


@router.delete("/{id}")
def eliminar_unidad_medida(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.UNIDAD_MEDIDA_ELIMINAR)),
    servicio: ServicioUnidadMedida = Depends()
):
    servicio.eliminar_unidad_medida(id, usuario)
    return success_response(None, "Unidad de medida eliminada correctamente")

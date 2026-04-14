from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .categoria_service import ServicioCategoriasGasto
from .categoria_schemas import CategoriaGastoLectura, CategoriaGastoCreacion, CategoriaGastoActualizacion
from ..autenticacion.routes import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.get("", response_model=RespuestaBase[List[CategoriaGastoLectura]])
def listar_categorias(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.GESTIONAR_CATEGORIA_GASTO)),
    servicio: ServicioCategoriasGasto = Depends()
):
    return success_response(servicio.listar_categorias(usuario, empresa_id))

@router.post("", response_model=RespuestaBase[CategoriaGastoLectura], status_code=status.HTTP_201_CREATED)
def crear_categoria(
    datos: CategoriaGastoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.GESTIONAR_CATEGORIA_GASTO)),
    servicio: ServicioCategoriasGasto = Depends()
):
    return success_response(servicio.crear_categoria(datos, usuario), "Categoría creada correctamente")

@router.get("/{id}", response_model=RespuestaBase[CategoriaGastoLectura])
def obtener_categoria(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.GESTIONAR_CATEGORIA_GASTO)),
    servicio: ServicioCategoriasGasto = Depends()
):
    return success_response(servicio.obtener_categoria(id, usuario))


@router.put("/{id}", response_model=RespuestaBase[CategoriaGastoLectura])
def actualizar_categoria(
    id: UUID,
    datos: CategoriaGastoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.GESTIONAR_CATEGORIA_GASTO)),
    servicio: ServicioCategoriasGasto = Depends()
):
    return success_response(servicio.actualizar_categoria(id, datos, usuario), "Categoría actualizada correctamente")

@router.delete("/{id}")
def eliminar_categoria(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.GESTIONAR_CATEGORIA_GASTO)),
    servicio: ServicioCategoriasGasto = Depends()
):
    servicio.eliminar_categoria(id, usuario)
    return success_response(None, "Categoría eliminada correctamente")

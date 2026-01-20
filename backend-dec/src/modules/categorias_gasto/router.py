from fastapi import APIRouter, Depends, status
from typing import List, Optional
from uuid import UUID

from .schemas import CategoriaGastoCreacion, CategoriaGastoLectura, CategoriaGastoActualizacion
from .service import ServicioCategoriasGasto
from ..autenticacion.dependencies import obtener_usuario_actual, requerir_permiso
from ...constants.permissions import PermissionCodes
from ...utils.response import success_response

router = APIRouter()

@router.get("/", response_model=List[CategoriaGastoLectura])
def listar_categorias(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioCategoriasGasto = Depends()
):
    return servicio.listar_categorias(usuario, empresa_id)

@router.post("/", response_model=CategoriaGastoLectura, status_code=status.HTTP_201_CREATED)
def crear_categoria(
    datos: CategoriaGastoCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioCategoriasGasto = Depends()
):
    return servicio.crear_categoria(datos, usuario)

@router.get("/{id}", response_model=CategoriaGastoLectura)
def obtener_categoria(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioCategoriasGasto = Depends()
):
    return servicio.obtener_categoria(id, usuario)

@router.put("/{id}", response_model=CategoriaGastoLectura)
def actualizar_categoria(
    id: UUID,
    datos: CategoriaGastoActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioCategoriasGasto = Depends()
):
    return servicio.actualizar_categoria(id, datos, usuario)

@router.delete("/{id}")
def eliminar_categoria(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.REPORTE_VER)),
    servicio: ServicioCategoriasGasto = Depends()
):
    servicio.eliminar_categoria(id, usuario)
    return success_response(None, "Categoría eliminada correctamente")

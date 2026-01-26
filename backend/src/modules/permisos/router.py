from fastapi import APIRouter, Depends, Body, Path
from typing import List
from uuid import UUID
from .schemas import PermisoLectura, PermisoCreacion, PermisoActualizacion
from .service import ServicioPermisos
from ..autenticacion.routes import obtener_usuario_actual
from ...utils.response import success_response

router = APIRouter()

@router.get("/", response_model=List[PermisoLectura])
def listar_permisos(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioPermisos = Depends()
):
    """
    Lista todos los permisos del sistema.
    """
    return servicio.listar_permisos(usuario)

@router.get("/{permiso_id}", response_model=PermisoLectura)
def obtener_permiso(
    permiso_id: UUID = Path(..., title="ID del permiso"),
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioPermisos = Depends()
):
    return servicio.obtener_permiso(permiso_id, usuario)

@router.post("/", response_model=PermisoLectura)
def crear_permiso(
    permiso: PermisoCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioPermisos = Depends()
):
    return servicio.crear_permiso(permiso.model_dump(), usuario)

@router.put("/{permiso_id}", response_model=PermisoLectura)
def actualizar_permiso(
    permiso_id: UUID,
    permiso_update: PermisoActualizacion, 
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioPermisos = Depends()
):
    return servicio.actualizar_permiso(permiso_id, permiso_update.model_dump(exclude_unset=True), usuario)

@router.delete("/{permiso_id}")
def eliminar_permiso(
    permiso_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioPermisos = Depends()
):
    servicio.eliminar_permiso(permiso_id, usuario)
    return success_response(None, "Permiso eliminado correctamente")

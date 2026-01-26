from fastapi import APIRouter, Depends, Path, Body
from typing import List
from uuid import UUID
from .schemas import UsuarioCreacion, UsuarioLectura, UsuarioActualizacion, CambioClave
from .service import ServicioUsuarios
from ..autenticacion.routes import obtener_usuario_actual
from ...utils.response import success_response

router = APIRouter()

@router.get("/", response_model=List[UsuarioLectura])
def listar_usuarios(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioUsuarios = Depends()
):
    return servicio.listar_usuarios(usuario)

@router.post("/", response_model=UsuarioLectura)
def crear_usuario(
    datos: UsuarioCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioUsuarios = Depends()
):
    return servicio.crear_usuario(datos, usuario)

@router.get("/{usuario_id}", response_model=UsuarioLectura)
def obtener_usuario(
    usuario_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioUsuarios = Depends()
):
    return servicio.obtener_usuario(usuario_id, usuario)

@router.put("/{usuario_id}", response_model=UsuarioLectura)
def actualizar_usuario(
    usuario_id: UUID,
    datos: UsuarioActualizacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioUsuarios = Depends()
):
    return servicio.actualizar_usuario(usuario_id, datos.model_dump(exclude_unset=True), usuario)

@router.delete("/{usuario_id}")
def eliminar_usuario(
    usuario_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioUsuarios = Depends()
):
    servicio.eliminar_usuario(usuario_id, usuario)
    return success_response(None, "Usuario eliminado correctamente")

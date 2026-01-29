from fastapi import APIRouter, Depends
from typing import List
from uuid import UUID
from .schemas import UsuarioCreacion, UsuarioActualizacion, UsuarioLectura
from .controller import UsuarioController
from ..autenticacion.routes import obtener_usuario_actual
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.get("/", response_model=RespuestaBase[List[UsuarioLectura]])
def listar_usuarios(
    usuario: dict = Depends(obtener_usuario_actual),
    controller: UsuarioController = Depends()
):
    """List users in current empresa"""
    return controller.listar_usuarios(usuario)

@router.get("/{id}", response_model=RespuestaBase[UsuarioLectura])
def obtener_usuario(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: UsuarioController = Depends()
):
    return controller.obtener_usuario(id, usuario)

@router.post("/", response_model=RespuestaBase[UsuarioLectura], status_code=201)
def crear_usuario(
    datos: UsuarioCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: UsuarioController = Depends()
):
    """Create new user in empresa"""
    return controller.crear_usuario(datos, usuario)

@router.put("/{id}", response_model=RespuestaBase[UsuarioLectura])
def actualizar_usuario(
    id: UUID,
    datos: UsuarioActualizacion,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: UsuarioController = Depends()
):
    """Update user"""
    return controller.actualizar_usuario(id, datos, usuario)

@router.delete("/{id}")
def eliminar_usuario(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: UsuarioController = Depends()
):
    """Delete user"""
    return controller.eliminar_usuario(id, usuario)

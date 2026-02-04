from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from uuid import UUID
from .schemas import UsuarioCreacion, UsuarioActualizacion, UsuarioLectura, PerfilUsuarioLectura, UsuarioAdminLectura
from .controller import UsuarioController
from ..autenticacion.routes import obtener_usuario_actual
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.get("/admin/lista", response_model=RespuestaBase[List[UsuarioAdminLectura]])
def listar_usuarios_admin(
    vendedor_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(obtener_usuario_actual),
    controller: UsuarioController = Depends()
):
    """List all users across all empresas (Superadmin/Vendedor context)"""
    return controller.listar_usuarios_admin(usuario, vendedor_id)

@router.get("/admin/stats", response_model=RespuestaBase[dict])
def obtener_stats_admin(
    vendedor_id: Optional[UUID] = Query(None),
    usuario: dict = Depends(obtener_usuario_actual),
    controller: UsuarioController = Depends()
):
    """Get user stats for administrative context"""
    return controller.obtener_stats_admin(usuario, vendedor_id)

@router.patch("/admin/{id}/toggle-status", response_model=RespuestaBase[UsuarioAdminLectura])
def toggle_status_admin(
    id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    controller: UsuarioController = Depends()
):
    """Toggle user active status"""
    return controller.toggle_status_admin(id, usuario)

@router.patch("/admin/{id}/reasignar-empresa", response_model=RespuestaBase[UsuarioAdminLectura])
def reasignar_empresa_admin(
    id: UUID,
    nueva_empresa_id: UUID = Query(...),
    usuario: dict = Depends(obtener_usuario_actual),
    controller: UsuarioController = Depends()
):
    """Change user's empresa (Superadmin only)"""
    return controller.reasignar_empresa_admin(id, nueva_empresa_id, usuario)

@router.get("/perfil", response_model=RespuestaBase[PerfilUsuarioLectura])
def obtener_perfil(
    usuario: dict = Depends(obtener_usuario_actual),
    controller: UsuarioController = Depends()
):
    """Obtener el perfil completo del usuario autenticado"""
    return controller.obtener_perfil(usuario)

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

@router.patch("/{id}", response_model=RespuestaBase[UsuarioLectura])
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

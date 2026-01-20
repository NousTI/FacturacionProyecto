from fastapi import APIRouter, Depends, Body, Path
from typing import List
from uuid import UUID
from .schemas import RolCreacion, RolActualizacion, RolLectura, RolPermisoLectura, RolPermisoAsignacion, RolPermisoAgregar
from .service import ServicioRoles
from ..autenticacion.dependencies import obtener_usuario_actual
from ...utils.response import success_response

router = APIRouter()

@router.get("/", response_model=List[RolLectura])
def listar_roles(
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioRoles = Depends()
):
    return servicio.listar_roles(usuario)

@router.get("/{rol_id}", response_model=RolLectura)
def obtener_rol(
    rol_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioRoles = Depends()
):
    return servicio.obtener_rol(rol_id, usuario)

@router.post("/", response_model=RolLectura)
def crear_rol(
    datos: RolCreacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioRoles = Depends()
):
    return servicio.crear_rol(datos, usuario)

@router.put("/{rol_id}", response_model=RolLectura)
def actualizar_rol(
    rol_id: UUID,
    datos: RolActualizacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioRoles = Depends()
):
    return servicio.actualizar_rol(rol_id, datos.model_dump(exclude_unset=True), usuario)

@router.delete("/{rol_id}")
def eliminar_rol(
    rol_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioRoles = Depends()
):
    servicio.eliminar_rol(rol_id, usuario)
    return success_response(None, "Rol eliminado correctamente")

# Endpoints de permisos de rol
@router.post("/{rol_id}/permisos")
def asignar_permisos(
    rol_id: UUID,
    payload: RolPermisoAsignacion,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioRoles = Depends()
):
    servicio.asignar_permisos(rol_id, payload.permiso_ids, usuario)
    return success_response(None, "Permisos asignados correctamente")

@router.get("/{rol_id}/permisos", response_model=List[RolPermisoLectura])
def listar_permisos_rol(
    rol_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioRoles = Depends()
):
    return servicio.listar_permisos_rol(rol_id, usuario)

@router.post("/{rol_id}/permisos/add")
def agregar_permiso(
    rol_id: UUID,
    payload: RolPermisoAgregar,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioRoles = Depends()
):
    servicio.agregar_permiso(rol_id, payload.permiso_id, usuario)
    return success_response(None, "Permiso agregado correctamente")

@router.delete("/{rol_id}/permisos/{permiso_id}")
def quitar_permiso(
    rol_id: UUID,
    permiso_id: UUID,
    usuario: dict = Depends(obtener_usuario_actual),
    servicio: ServicioRoles = Depends()
):
    servicio.quitar_permiso(rol_id, permission_id=permiso_id, current_user=usuario)
    return success_response(None, "Permiso eliminado correctamente")

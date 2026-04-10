from fastapi import APIRouter, Depends
from typing import List, Optional
from uuid import UUID
from .schemas import PermisoCreacion, PermisoLectura, RolCreacion, RolActualizacion, RolLectura
from .controller import RolController
from ..autenticacion.permissions import requerir_permiso, requerir_gestion_roles
from ..autenticacion.routes import obtener_usuario_actual
from ..autenticacion.dependencies import requerir_superadmin
from ...constants.permissions import PermissionCodes
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

# --- Permisos ---
@router.get("/permisos", response_model=RespuestaBase[List[PermisoLectura]])
def listar_permisos(controller: RolController = Depends()):
    """Get system permissions catalog (Public for authenticated users to see available options)"""
    return controller.listar_permisos()

@router.post("/permisos", response_model=RespuestaBase[PermisoLectura], status_code=201)
def crear_permiso(
    datos: PermisoCreacion,
    usuario: dict = Depends(requerir_superadmin),
    controller: RolController = Depends()
):
    """Create system permission (superadmin only)"""
    return controller.crear_permiso(datos, usuario)

# --- Roles ---
@router.get("/", response_model=RespuestaBase[List[RolLectura]])
def listar_roles(
    empresa_id: Optional[UUID] = None,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ROLES_VER)),
    controller: RolController = Depends()
):
    """List roles for an empresa"""
    return controller.listar_roles(usuario, empresa_id)

@router.get("/{id}", response_model=RespuestaBase[RolLectura])
def obtener_rol(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ROLES_VER)),
    controller: RolController = Depends()
):
    return controller.obtener_rol(id, usuario)

@router.post("/", response_model=RespuestaBase[RolLectura], status_code=201)
def crear_rol(
    datos: RolCreacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ROLES_CREAR)),
    controller: RolController = Depends()
):
    """Create custom role for user's empresa"""
    return controller.crear_rol(datos, usuario)

@router.put("/{id}", response_model=RespuestaBase[RolLectura])
def actualizar_rol(
    id: UUID,
    datos: RolActualizacion,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ROLES_EDITAR)),
    controller: RolController = Depends()
):
    """Update role (cannot modify es_sistema roles)"""
    return controller.actualizar_rol(id, datos, usuario)

@router.delete("/{id}")
def eliminar_rol(
    id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ROLES_ELIMINAR)),
    controller: RolController = Depends()
):
    """Delete role (only if not es_sistema)"""
    return controller.eliminar_rol(id, usuario)

# --- Individual Permission Management ---
@router.post("/{rol_id}/permisos/{permiso_id}")
def asignar_permiso(
    rol_id: UUID,
    permiso_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ROLES_EDITAR)),
    controller: RolController = Depends()
):
    """Assign a single permission to a role"""
    return controller.asignar_permiso(rol_id, permiso_id, usuario)

@router.delete("/{rol_id}/permisos/{permiso_id}")
def remover_permiso(
    rol_id: UUID,
    permiso_id: UUID,
    usuario: dict = Depends(requerir_permiso(PermissionCodes.ROLES_EDITAR)),
    controller: RolController = Depends()
):
    """Remove a single permission from a role"""
    return controller.remover_permiso(rol_id, permiso_id, usuario)


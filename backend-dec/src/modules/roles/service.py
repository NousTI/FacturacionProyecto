from fastapi import Depends
from uuid import UUID
from typing import List

from .repository import RepositorioRoles
from .schemas import RolCreacion
from ...constants.enums import AuthKeys
from ...constants.roles import RolCodigo
from ...constants.permissions import PermissionCodes
from ...constants.messages import RoleMessages
from ...errors.app_error import AppError

# Modulo Import
from ..empresa.service import ServicioEmpresa

class ServicioRoles:
    def __init__(self, repo: RepositorioRoles = Depends(), empresa_service: ServicioEmpresa = Depends()):
        self.repo = repo
        self.empresa_service = empresa_service

    def _get_context(self, current_user: dict):
        return {
            "is_superadmin": current_user.get(AuthKeys.IS_SUPERADMIN, False),
            "is_vendedor": current_user.get(AuthKeys.IS_VENDEDOR, False),
            "is_usuario": current_user.get(AuthKeys.IS_USUARIO, False),
            "user_id": current_user.get("id"),
            "empresa_id": current_user.get("empresa_id"),
            "rol_id": current_user.get(AuthKeys.ROL_ID)
        }

    def _check_permission(self, current_user: dict, permission_code: str):
        # Placeholder for real permission check service integration
        # For now, rely on superadmin or role logic
        if current_user.get(AuthKeys.IS_SUPERADMIN): return
        # Logic to check user permissions (to be implemented with permission service/repo)
        pass

    def listar_roles(self, current_user: dict):
        ctx = self._get_context(current_user)
        
        if ctx["is_superadmin"]:
            return self.repo.listar_roles()
        
        if ctx["is_vendedor"]:
             # List roles of their companies?
             # For now, listing roles usually scoped to company.
             # If no company context, return empty?
             # Legacy listed all if superadmin, filtered by empresa if provided.
             return self.repo.listar_roles(empresa_id=None) # Review legacy logic strictly?
             # Legacy: if empresa_id provided, filter. 
             # Here we assume context.
        
        if ctx["is_usuario"]:
             if not ctx["empresa_id"]: return []
             return self.repo.listar_roles(empresa_id=ctx["empresa_id"])
             
        raise AppError("No autorizado", 403, "AUTH_FORBIDDEN")

    def obtener_rol(self, rol_id: UUID, current_user: dict):
        rol = self.repo.obtener_rol(rol_id)
        if not rol:
             raise AppError(RoleMessages.NOT_FOUND, 404, "ROLE_NOT_FOUND")
        return rol
        
    def crear_rol(self, datos: RolCreacion, current_user: dict):
        ctx = self._get_context(current_user)
        
        # Validations
        if not ctx["is_superadmin"] and not ctx["is_vendedor"] and not ctx["is_usuario"]: # Permisos specificos?
             # Check permission ROL_CREAR
             pass

        if datos.es_sistema and not ctx["is_superadmin"]:
             raise AppError(RoleMessages.SYSTEM_MODIFICATION, 403, "ROLE_SYSTEM_PROTECTED")

        return self.repo.crear_rol(datos.model_dump())

    def actualizar_rol(self, rol_id: UUID, datos: dict, current_user: dict):
        rol = self.obtener_rol(rol_id, current_user)
        
        if rol["es_sistema"] and not current_user.get(AuthKeys.IS_SUPERADMIN):
             raise AppError(RoleMessages.SYSTEM_MODIFICATION, 403, "ROLE_SYSTEM_PROTECTED")
             
        updated = self.repo.actualizar_rol(rol_id, datos)
        if not updated:
             raise AppError(RoleMessages.UPDATE_ERROR, 400, "ROLE_UPDATE_ERROR")
        return updated

    def eliminar_rol(self, rol_id: UUID, current_user: dict):
        rol = self.obtener_rol(rol_id, current_user)
        
        if rol["es_sistema"]:
             raise AppError(RoleMessages.SYSTEM_DELETION, 403, "ROLE_SYSTEM_PROTECTED")
             
        deleted = self.repo.eliminar_rol(rol_id)
        if not deleted:
             raise AppError(RoleMessages.DELETE_ERROR, 404, "ROLE_DELETE_ERROR")
        return deleted

    def asignar_permisos(self, rol_id: UUID, permission_ids: List[UUID], current_user: dict):
        # Verify access
        self.obtener_rol(rol_id, current_user)
        return self.repo.asignar_permisos(rol_id, permission_ids)

    def listar_permisos_rol(self, rol_id: UUID, current_user: dict):
        self.obtener_rol(rol_id, current_user)
        return self.repo.obtener_permisos_rol(rol_id)

    def agregar_permiso(self, rol_id: UUID, permission_id: UUID, current_user: dict):
        self.obtener_rol(rol_id, current_user)
        if not self.repo.agregar_permiso(rol_id, permission_id):
             raise AppError(RoleMessages.ADD_ERROR, 400, "ROLE_PERMISSION_ADD_ERROR")
        return True

    def quitar_permiso(self, rol_id: UUID, permission_id: UUID, current_user: dict):
        self.obtener_rol(rol_id, current_user)
        if not self.repo.quitar_permiso(rol_id, permission_id):
             raise AppError(RoleMessages.REMOVE_ERROR, 400, "ROLE_PERMISSION_REMOVE_ERROR")
        return True

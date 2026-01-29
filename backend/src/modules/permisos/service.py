from fastapi import Depends, HTTPException
from uuid import UUID
from .repository import RepositorioPermisos
from ...constants.enums import AuthKeys, PermissionCodes
from ...errors.app_error import AppError

class ServicioPermisos:
    def __init__(self, repo: RepositorioPermisos = Depends()):
        self.repo = repo

    def _verificar_acceso(self, usuario: dict, permiso_requerido: str):
        # 1. Superadmin siempre tiene acceso
        if usuario.get(AuthKeys.IS_SUPERADMIN):
            return

        # 2. Otros roles (Definir lógica hardcoded o simplificada)
        role = usuario.get("role")
        # Por ahora, para simplificar, borramos la dependencia de 'rol_permiso'
        # Si 'VENDEDOR' necesita acceder a gestión de permisos, agregarlo aquí.
        # Generalmente solo Superadmin gestiona permisos.
        
        # permissions_mock = {
        #     "VENDEDOR": [],
        #     "USUARIO": []
        # }
        # user_perms = permissions_mock.get(role, [])
        
        # if permiso_requerido not in user_perms:
        raise AppError(f"Acceso denegado: Rol {role} no tiene permiso {permiso_requerido}", 403, "AUTH_FORBIDDEN")

    def listar_permisos(self, usuario: dict):
        self._verificar_acceso(usuario, PermissionCodes.PERMISO_VER)
        return self.repo.list_permissions()

    def obtener_permiso(self, permiso_id: UUID, usuario: dict):
        self._verificar_acceso(usuario, PermissionCodes.PERMISO_VER)
        result = self.repo.get_permission(permiso_id)
        if not result:
             raise AppError("Permiso no encontrado", 404, "PERMISO_NOT_FOUND")
        return result

    def crear_permiso(self, data: dict, usuario: dict):
        if not usuario.get(AuthKeys.IS_SUPERADMIN):
             raise AppError("Solo los Superadmins pueden crear permisos", 403, "AUTH_SUPERADMIN_REQUIRED")
        return self.repo.create_permission(data)

    def actualizar_permiso(self, permiso_id: UUID, data: dict, usuario: dict):
        if not usuario.get(AuthKeys.IS_SUPERADMIN):
             raise AppError("Solo los Superadmins pueden actualizar permisos", 403, "AUTH_SUPERADMIN_REQUIRED")
        
        result = self.repo.update_permission(permiso_id, data)
        if not result:
            raise AppError("Permiso no encontrado para actualizar", 404, "PERMISO_NOT_FOUND")
        return result

    def eliminar_permiso(self, permiso_id: UUID, usuario: dict):
        if not usuario.get(AuthKeys.IS_SUPERADMIN):
             raise AppError("Solo los Superadmins pueden eliminar permisos", 403, "AUTH_SUPERADMIN_REQUIRED")
        
        result = self.repo.delete_permission(permiso_id)
        if not result:
            raise AppError("Permiso no encontrado para eliminar", 404, "PERMISO_NOT_FOUND")
        return result

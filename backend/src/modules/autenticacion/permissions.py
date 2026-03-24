from fastapi import Depends
from typing import Optional
from .dependencies import get_current_user
from ..permisos.constants import PermisosVendedor
from ..vendedores.repositories import RepositorioVendedores
from ...constants.enums import AuthKeys
from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages
from ...errors.app_error import AppError

from typing import Union

class PermissionChecker:
    def __init__(self, required_permission: Union[str, PermisosVendedor, list]):
        if isinstance(required_permission, list):
            self.required_permissions = required_permission
        else:
            self.required_permissions = [required_permission]

    def __call__(self, usuario: dict = Depends(get_current_user), repo_vendedores: RepositorioVendedores = Depends()):
        # 1. Superadmin bypass
        if usuario.get(AuthKeys.IS_SUPERADMIN):
            return usuario
            
        # 2. Company Admin bypass (rol_codigo: ADMIN, ADMIN_TOTAL, etc)
        rol_codigo = (usuario.get("rol_codigo") or "").upper()
        if rol_codigo == "ADMIN" or rol_codigo.startswith("ADMIN_"):
            return usuario

        # Get permission string values
        req_perm_values = [p.value if hasattr(p, 'value') else p for p in self.required_permissions]

        # 2. Check granular permissions (attached to usuario in services.py)
        granular_perms = usuario.get("permisos", [])
        if any(p in granular_perms for p in req_perm_values):
            return usuario

        # 3. Check Vendedor flags (for backward compatibility or specific vendor routes)
        if usuario.get(AuthKeys.IS_VENDEDOR):
            vendedor = repo_vendedores.obtener_por_user_id(usuario["id"])
            if vendedor and any(vendedor.get(p) for p in req_perm_values):
                return usuario
        
        # 4. No permission found
        raise AppError(
            message=AppMessages.PERM_FORBIDDEN,
            status_code=403,
            code=ErrorCodes.PERM_FORBIDDEN
        )

# Alias for easy import
requerir_permiso = PermissionChecker

def requerir_gestion_roles(usuario: dict = Depends(get_current_user)):
    """
    Requirement: Only an empresa admin OR a user with CONFIG_ROLES permission can manage roles.
    Superadmins always have access.
    """
    if usuario.get(AuthKeys.IS_SUPERADMIN):
        return usuario
    
    # 1. Check granular permission
    granular_perms = usuario.get("permisos", [])
    if "CONFIG_ROLES" in granular_perms:
        return usuario
        
    # 2. Check if user has an ADMIN role code for their empresa
    rol_codigo = usuario.get("rol_codigo")
    if rol_codigo and (rol_codigo.startswith("ADMIN_") or rol_codigo == "ADMIN"):
        return usuario
        
    # 3. No permission found
    raise AppError(
        message="No tienes permisos para gestionar roles de empresa. Solo administradores pueden realizar esta acción.",
        status_code=403,
        code=ErrorCodes.PERM_FORBIDDEN
    )

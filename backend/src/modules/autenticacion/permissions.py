from fastapi import Depends
from typing import Optional
from .dependencies import get_current_user
from ..permisos.constants import PermisosVendedor
from ..vendedores.repositories import RepositorioVendedores
from ...constants.enums import AuthKeys
from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages
from ...errors.app_error import AppError

class PermissionChecker:
    def __init__(self, required_permission: PermisosVendedor):
        self.required_permission = required_permission

    def __call__(self, usuario: dict = Depends(get_current_user), repo_vendedores: RepositorioVendedores = Depends()):
        # 1. Superadmin bypass
        if usuario.get(AuthKeys.IS_SUPERADMIN):
            return usuario
            
        # 2. Check if user is Vendedor
        vendedor = repo_vendedores.obtener_por_user_id(usuario["id"])
        
        # If user is not found in vendors table, they might be a regular user or client
        # In this context, if they are not superadmin and not a vendor, they don't have access to vendor features
        if not vendedor:
             raise AppError(
                message=AppMessages.PERM_FORBIDDEN,
                status_code=403,
                code=ErrorCodes.PERM_FORBIDDEN
            )

        # 3. Check specific permission
        # The permission enum value (e.g., 'puede_crear_empresas') matches the DB column name
        if not vendedor.get(self.required_permission.value):
             raise AppError(
                message=AppMessages.PERM_FORBIDDEN,
                status_code=403,
                code=ErrorCodes.PERM_FORBIDDEN
            )
            
        return usuario

# Alias for easy import
requerir_permiso = PermissionChecker

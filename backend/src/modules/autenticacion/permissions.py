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
    def __init__(self, required_permission: Union[str, PermisosVendedor]):
        self.required_permission = required_permission

    def __call__(self, usuario: dict = Depends(get_current_user), repo_vendedores: RepositorioVendedores = Depends()):
        # 1. Superadmin bypass
        if usuario.get(AuthKeys.IS_SUPERADMIN):
            return usuario
            
        # Get permission string value (handle both Enum and string)
        req_perm_value = self.required_permission.value if hasattr(self.required_permission, 'value') else self.required_permission

        # 2. Check granular permissions (attached to usuario in services.py)
        granular_perms = usuario.get("permisos", [])
        if req_perm_value in granular_perms:
            return usuario

        # 3. Check Vendedor flags (for backward compatibility or specific vendor routes)
        if usuario.get(AuthKeys.IS_VENDEDOR):
            vendedor = repo_vendedores.obtener_por_user_id(usuario["id"])
            if vendedor and vendedor.get(req_perm_value):
                return usuario
        
        # 4. No permission found
        raise AppError(
            message=AppMessages.PERM_FORBIDDEN,
            status_code=403,
            code=ErrorCodes.PERM_FORBIDDEN
        )

# Alias for easy import
requerir_permiso = PermissionChecker

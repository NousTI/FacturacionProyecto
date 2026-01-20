# backend/dependencies/auth_dependencies.py

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from database.connection import get_db_connection
from services.user_session_service import validate_session
from services.superadmin_session_service import SuperadminSessionService
from services.vendedor_session_service import VendedorSessionService
from utils.jwt_utils import decode_access_token
from utils.responses import error_response

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

from utils.enums import AuthKeys

# ... (rest of imports)

def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    conn=Depends(get_db_connection),
):
    # 1. Decodificar JWT
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_response(status.HTTP_401_UNAUTHORIZED, "Token inválido o expirado"),
        )

    user_id = payload.get("sub")
    session_id = payload.get("sid")
    role = payload.get("role") # "superadmin" or None (regular user)

    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_response(status.HTTP_401_UNAUTHORIZED, "Token sin sesión válida"),
        )

    # 2. Get Strategy
    from auth.factory import AuthFactory
    strategy = AuthFactory.get_strategy(role)

    # 3. Authenticate using Strategy
    user = strategy.authenticate(conn, user_id, session_id)
    
    request.state.jwt_payload = payload
    return user


from repositories.permission_repository import PermissionRepository

def require_role(role_id): # role_id could be UUID or Int depending on schema transition
    """
    Dependencia para roles específicos.
    """

    def dependency(current_user: dict = Depends(get_current_user)):
        # Bypass for Superadmin
        if current_user.get(AuthKeys.IS_SUPERADMIN):
            return current_user
            
        # Using ROL_ID constant. Note: User dict now has "rol_id" from strategies.
        # Ensure we are comparing compatible types (UUID vs String UUID)
        user_rol_id = current_user.get(AuthKeys.ROL_ID)
        
        # Casting to string if necessary for safe comparison
        if str(user_rol_id) != str(role_id): 
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_response(status.HTTP_403_FORBIDDEN, "No tienes permisos suficientes"),
            )
        return current_user

    return dependency


def require_permission(permission_code: str):
    """
    Dependencia para validar permisos granulares.
    """
    def dependency(
        current_user: dict = Depends(get_current_user),
        perm_repo: PermissionRepository = Depends()
    ):
        # Bypass for Superadmin
        if current_user.get(AuthKeys.IS_SUPERADMIN):
            return current_user

        user_role_id = current_user.get(AuthKeys.ROL_ID)
        # Assuming Permission Repository expects UUID or handled gracefully
        permissions = perm_repo.get_permissions_by_role_id(user_role_id)
        
        # TODO: Asegurar que permiso.CODIGO exista o usar NOMBRE por ahora
        if permission_code not in permissions:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_response(status.HTTP_403_FORBIDDEN, f"Falta el permiso: {permission_code}"),
            )
        return current_user

    return dependency

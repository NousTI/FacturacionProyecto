from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from ...database.session import get_db_connection_raw
from ...utils.jwt import decode_access_token
from ...errors.app_error import AppError
from ...constants.enums import AuthKeys
from .strategies import EstrategiaAuthSuperadmin, EstrategiaAuthVendedor, EstrategiaAuthUsuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/autenticacion/iniciar-sesion")

from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages

async def obtener_usuario_actual(
    request: Request,
    token: str = Depends(oauth2_scheme)
):
    conn = get_db_connection_raw()
    try:
        payload = decode_access_token(token)
        if not payload:
            raise AppError(
                message=AppMessages.AUTH_TOKEN_INVALID, 
                status_code=401, 
                code=ErrorCodes.AUTH_TOKEN_INVALID,
                level="WARNING"
            )

        user_id = payload.get("sub")
        session_id = payload.get("sid")
        role = payload.get("role") 

        if not session_id:
             raise AppError(
                 message=AppMessages.AUTH_TOKEN_INVALID, 
                 status_code=401, 
                 code=ErrorCodes.AUTH_TOKEN_INVALID,
                 description="Token falta session_id"
             )

        # Seleccionar estrategia
        if role == "superadmin":
            strategy = EstrategiaAuthSuperadmin()
        elif role == "vendedor":
            strategy = EstrategiaAuthVendedor()
        else:
            strategy = EstrategiaAuthUsuario()

        user = strategy.autenticar(conn, user_id, session_id)
        
        request.state.jwt_payload = payload
        return user
    finally:
        conn.close()

def requerir_rol(rol_id):
    def dependency(usuario: dict = Depends(obtener_usuario_actual)):
        if usuario.get(AuthKeys.IS_SUPERADMIN):
            return usuario
            
        user_rol_id = usuario.get(AuthKeys.ROL_ID)
        if str(user_rol_id) != str(rol_id): 
            raise AppError(
                message=AppMessages.PERM_INSUFFICIENT_ROLE, 
                status_code=403, 
                code=ErrorCodes.PERM_INSUFFICIENT_ROLE,
                level="WARNING"
            )
        return usuario
    return dependency

from ..permisos.repository import RepositorioPermisos

def requerir_permiso(permiso_requerido: str):
    def dependency(usuario: dict = Depends(obtener_usuario_actual)):
        if usuario.get(AuthKeys.IS_SUPERADMIN):
            return usuario
            
        rol_id = usuario.get(AuthKeys.ROL_ID)
        if not rol_id:
             raise AppError(
                 message=AppMessages.PERM_FORBIDDEN, 
                 status_code=403, 
                 code=ErrorCodes.PERM_INSUFFICIENT_ROLE,
                 description="El usuario no tiene un rol asignado"
             )

        # Check permissions
        conn = get_db_connection_raw()
        try:
            repo = RepositorioPermisos(conn)
            permisos = repo.get_permissions_by_role_id(rol_id)
            if permiso_requerido not in permisos:
                raise AppError(
                    message=AppMessages.PERM_FORBIDDEN, 
                    status_code=403, 
                    code=ErrorCodes.PERM_FORBIDDEN,
                    description=f"Se requiere el permiso: {permiso_requerido}",
                    level="WARNING"
                )
            return usuario
        finally:
            conn.close()
    return dependency

def requerir_superadmin(usuario: dict = Depends(obtener_usuario_actual)):
    if not usuario.get(AuthKeys.IS_SUPERADMIN):
        raise AppError(
            message=AppMessages.PERM_FORBIDDEN, 
            status_code=403, 
            code=ErrorCodes.PERM_FORBIDDEN,
            description="Se requieren permisos de superadministrador",
            level="WARNING"
        )
    return usuario

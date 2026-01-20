from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from ...database.session import get_db_connection_raw
from ...utils.jwt import decode_access_token
from ...errors.app_error import AppError
from ...constants.enums import AuthKeys
from .strategies import EstrategiaAuthSuperadmin, EstrategiaAuthVendedor, EstrategiaAuthUsuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/autenticacion/iniciar-sesion")

async def obtener_usuario_actual(
    request: Request,
    token: str = Depends(oauth2_scheme)
):
    # Ya que 'get_db_connection_raw' crea una nueva conexión y no es un generador/dep que se cierre solo en este contexto si no lo usamos con Depends(get_db),
    # aqui lo usamos manualmente.
    # Pero cuidado: get_current_user se ejecuta por request. 
    # Lo ideal es usar la session del request si existe, o abrir una.
    # Usaremos get_db_connection_raw y cerraremos. 
    # O mejor, inyectamos la conex desde Depends(get_db) si fuera posible, pero get_current_user es usado en Depends.
    
    conn = get_db_connection_raw()
    try:
        payload = decode_access_token(token)
        if not payload:
            raise AppError("Token inválido o expirado", 401, "AUTH_TOKEN_INVALID")

        user_id = payload.get("sub")
        session_id = payload.get("sid")
        role = payload.get("role") 

        if not session_id:
             raise AppError("Token sin sesión válida", 401, "AUTH_TOKEN_INVALID")

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
            raise AppError("No tienes permisos suficientes", 403, "AUTH_FORBIDDEN")
        return usuario
    return dependency

# TODO: requerir_permiso (necesita repo de permisos migrado)

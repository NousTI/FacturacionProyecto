from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from database.connection import get_db_connection
from utils.jwt_utils import decode_access_token
from utils.responses import error_response
from services.superadmin_session_service import SuperadminSessionService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/superadmin/login")

def get_current_superadmin(
    request: Request,
    token: str = Depends(oauth2_scheme),
    conn=Depends(get_db_connection),
):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_response(status.HTTP_401_UNAUTHORIZED, "Token inválido o expirado"),
        )

    user_id = payload.get("sub")
    session_id = payload.get("sid")
    role = payload.get("role")

    # Si el token es válido pero no tiene el rol de superadmin, es un usuario/vendedor sin permisos
    if role != "superadmin":
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_response(status.HTTP_403_FORBIDDEN, "No tienes permisos de superadministrador"),
        )
    
    # Validate session
    session_service = SuperadminSessionService(conn)
    if not session_id or not session_service.validate_session(session_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_response(status.HTTP_401_UNAUTHORIZED, "Sesión inválida o expirada"),
        )

    # Store payload for potential use (e.g. logout)
    request.state.jwt_payload = payload

    with conn.cursor() as cur:
        cur.execute("SELECT * FROM superadmin WHERE id = %s", (user_id,))
        superadmin = cur.fetchone()

    if not superadmin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_response(status.HTTP_401_UNAUTHORIZED, "Credenciales de superadmin inválidas"),
        )

    return superadmin

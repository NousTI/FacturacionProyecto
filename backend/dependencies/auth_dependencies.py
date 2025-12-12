# backend/dependencies/auth_dependencies.py

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from database.connection import get_db_connection
from services.session_service import validate_session
from utils.jwt_utils import decode_access_token
from utils.responses import error_response

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


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

    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_response(status.HTTP_401_UNAUTHORIZED, "Token sin sesión válida"),
        )

    # 2. Validar sesión en base de datos
    if not validate_session(conn, session_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_response(status.HTTP_401_UNAUTHORIZED, "Sesión expirada o cerrada"),
        )

    # Guardar payload para logout (se usa en auth_router)
    request.state.jwt_payload = payload

    # 3. Obtener datos de usuario
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT ID, FK_ROL, FK_SUSCRIPCION, USUARIO, CORREO
            FROM USUARIO
            WHERE ID = %s
            """,
            (user_id,),
        )
        user = cur.fetchone()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_response(status.HTTP_404_NOT_FOUND, "Usuario no encontrado"),
        )

    return user



from repositories.permission_repository import PermissionRepository

def require_role(role_id: int):
    """
    Dependencia para roles específicos.
    """

    def dependency(current_user: dict = Depends(get_current_user)):
        if current_user["fk_rol"] != role_id:
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
        user_role_id = current_user["fk_rol"]
        permissions = perm_repo.get_permissions_by_role_id(user_role_id)
        
        # TODO: Asegurar que permiso.CODIGO exista o usar NOMBRE por ahora
        if permission_code not in permissions:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_response(status.HTTP_403_FORBIDDEN, f"Falta el permiso: {permission_code}"),
            )
        return current_user

    return dependency

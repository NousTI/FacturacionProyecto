from abc import ABC, abstractmethod
from typing import Dict, Any
from datetime import datetime, timezone

# Imports de servicios/repositorios existentes (Legacy location)
# Se moverán en futuras iteraciones
from services.superadmin_session_service import SuperadminSessionService
from services.user_session_service import validate_session
from repositories.vendedor_repository import VendedorRepository
from repositories.user_sessions_repository import get_session
from repositories.vendedor_session_repository import VendedorSessionRepository

from ...errors.app_error import AppError
from ...constants.enums import AuthKeys
from ...utils.response import error_response # Not used directly if raising AppError

class EstrategiaAuth(ABC):
    @abstractmethod
    def autenticar(self, conn, user_id: str, session_id: str) -> dict:
        pass

class EstrategiaAuthSuperadmin(EstrategiaAuth):
    def autenticar(self, conn, user_id: str, session_id: str) -> dict:
        session_service = SuperadminSessionService(conn)
        if not session_service.validate_session(session_id):
             raise AppError(
                message="Sesión de Superadmin inválida o expirada",
                status_code=401,
                code="AUTH_SESSION_INVALID"
            )
        
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM superadmin WHERE id = %s", (user_id,))
            superadmin = cur.fetchone()
            
        if not superadmin:
             raise AppError(
                message="Superadmin no encontrado",
                status_code=401,
                code="AUTH_USER_NOT_FOUND"
            )
            
        superadmin[AuthKeys.IS_SUPERADMIN] = True
        superadmin[AuthKeys.IS_VENDEDOR] = False
        superadmin[AuthKeys.IS_USUARIO] = False
        superadmin[AuthKeys.ROL_ID] = -1
        superadmin["role"] = "superadmin"
        
        superadmin.pop("password", None)
        superadmin.pop("password_hash", None)
        
        return superadmin

class EstrategiaAuthVendedor(EstrategiaAuth):
    def autenticar(self, conn, user_id: str, session_id: str) -> dict:
        v_sess_repo = VendedorSessionRepository(conn)
        session = v_sess_repo.get_session(session_id)
        
        if not session or not session['is_valid']:
            raise AppError("Sesión de Vendedor inválida", 401, "AUTH_SESSION_INVALID")

        if session['expires_at'] < datetime.now(timezone.utc):
             raise AppError("Sesión de Vendedor expirada", 401, "AUTH_SESSION_EXPIRED")

        vendedor_repo = VendedorRepository(conn)
        vendedor = vendedor_repo.get_by_id(user_id)
            
        if not vendedor:
             raise AppError("Vendedor no encontrado", 401, "AUTH_USER_NOT_FOUND")
        
        vendedor[AuthKeys.IS_SUPERADMIN] = False
        vendedor[AuthKeys.IS_VENDEDOR] = True
        vendedor[AuthKeys.IS_USUARIO] = False
        vendedor[AuthKeys.ROL_ID] = -2
        vendedor["role"] = "vendedor"
        
        vendedor.pop("password", None)
        vendedor.pop("password_hash", None)
        
        return vendedor

class EstrategiaAuthUsuario(EstrategiaAuth):
    def autenticar(self, conn, user_id: str, session_id: str) -> dict:
        if not validate_session(conn, session_id):
            raise AppError("Sesión expirada o cerrada", 401, "AUTH_SESSION_INVALID")

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT * 
                FROM usuario
                WHERE id = %s
                """,
                (user_id,),
            )
            user = cur.fetchone()

        if not user:
            raise AppError("Usuario no encontrado", 404, "AUTH_USER_NOT_FOUND")
            
        user[AuthKeys.IS_SUPERADMIN] = False
        user[AuthKeys.IS_VENDEDOR] = False
        user[AuthKeys.IS_USUARIO] = True
        user["role"] = "usuario"

        user.pop("password", None)
        user.pop("password_hash", None)
        
        return user

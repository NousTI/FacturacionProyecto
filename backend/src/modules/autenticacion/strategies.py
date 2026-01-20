from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime, timezone

# Modular Imports
from .repository import RepositorioAutenticacion
from ..superadmin.repository import RepositorioSuperadmin
from ..vendedores.repository import RepositorioVendedores

from ...errors.app_error import AppError
from ...constants.enums import AuthKeys

class EstrategiaAuth(ABC):
    @abstractmethod
    def autenticar(self, conn, user_id: str, session_id: str) -> dict:
        pass

class EstrategiaAuthSuperadmin(EstrategiaAuth):
    def autenticar(self, conn, user_id: str, session_id: str) -> dict:
        admin_repo = RepositorioSuperadmin(conn)
        session = admin_repo.obtener_sesion_activa(user_id)
        
        # Superadmin session is valid if it exists and id matches jti
        if not session or str(session['id']) != session_id or not session['is_valid']:
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
        auth_repo = RepositorioAutenticacion(conn)
        session = auth_repo.obtener_sesion_vendedor(session_id)
        
        if not session or not session['is_valid']:
            raise AppError("Sesión de Vendedor inválida", 401, "AUTH_SESSION_INVALID")

        # Handle naive datetime from DB
        expires_at = session['expires_at']
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
             raise AppError("Sesión de Vendedor expirada", 401, "AUTH_SESSION_EXPIRED")

        vendedor_repo = RepositorioVendedores(conn)
        vendedor = vendedor_repo.obtener_por_id(user_id)
            
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
        auth_repo = RepositorioAutenticacion(conn)
        session = auth_repo.obtener_sesion_usuario(session_id)
        
        if not session or not session['is_valid']:
            raise AppError("Sesión de Usuario inválida", 401, "AUTH_SESSION_INVALID")

        expires_at = session['expires_at']
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            raise AppError("Sesión de Usuario expirada", 401, "AUTH_SESSION_EXPIRED")

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

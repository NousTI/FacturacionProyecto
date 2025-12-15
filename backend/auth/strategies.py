from abc import ABC, abstractmethod
from fastapi import HTTPException, status
from services.superadmin_session_service import SuperadminSessionService
from services.session_service import validate_session
from repositories.vendedor_session_repository import VendedorSessionRepository
from repositories.vendedor_repository import VendedorRepository
from utils.responses import error_response
from datetime import datetime, timezone

class AuthStrategy(ABC):
    @abstractmethod
    def authenticate(self, conn, user_id: str, session_id: str) -> dict:
        pass

class SuperadminAuthStrategy(AuthStrategy):
    def authenticate(self, conn, user_id: str, session_id: str) -> dict:
        # Validate Session
        session_service = SuperadminSessionService(conn)
        if not session_service.validate_session(session_id):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_response(status.HTTP_401_UNAUTHORIZED, "Sesión de Superadmin inválida o expirada"),
            )
        
        # Fetch Superadmin
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM superadmin WHERE id = %s", (user_id,))
            superadmin = cur.fetchone()
            
        if not superadmin:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_response(status.HTTP_401_UNAUTHORIZED, "Superadmin no encontrado"),
            )
            
        superadmin["is_superadmin"] = True
        superadmin["is_vendedor"] = False
        superadmin["fk_rol"] = -1
        return superadmin

class VendedorAuthStrategy(AuthStrategy):
    def authenticate(self, conn, user_id: str, session_id: str) -> dict:
        v_sess_repo = VendedorSessionRepository(conn)
        session = v_sess_repo.get_session(session_id)
        
        if not session or not session['is_valid']:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_response(status.HTTP_401_UNAUTHORIZED, "Sesión de Vendedor inválida"),
            )

        if session['expires_at'] < datetime.now(timezone.utc):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_response(status.HTTP_401_UNAUTHORIZED, "Sesión de Vendedor expirada"),
            )

        # Fetch Vendedor
        vendedor_repo = VendedorRepository(conn)
        vendedor = vendedor_repo.get_by_id(user_id)
            
        if not vendedor:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_response(status.HTTP_401_UNAUTHORIZED, "Vendedor no encontrado"),
            )
        
        vendedor["is_superadmin"] = False
        vendedor["is_vendedor"] = True
        vendedor["fk_rol"] = -2
        return vendedor

class UsuarioAuthStrategy(AuthStrategy):
    def authenticate(self, conn, user_id: str, session_id: str) -> dict:
        # Validate Session
        if not validate_session(conn, session_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_response(status.HTTP_401_UNAUTHORIZED, "Sesión expirada o cerrada"),
            )

        # Fetch User
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, fk_rol, fk_suscripcion, usuario, correo 
                FROM usuario
                WHERE id = %s
                """,
                (user_id,),
            )
            user = cur.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_response(status.HTTP_404_NOT_FOUND, "Usuario no encontrado"),
            )
            
        user["is_superadmin"] = False
        user["is_vendedor"] = False
        return user

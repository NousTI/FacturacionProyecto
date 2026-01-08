from fastapi import Depends, HTTPException, status, Request
from typing import Dict, Any

from services.user_service import UserService
from services.user_session_service import end_user_session
from services.vendedor_session_service import VendedorSessionService
from services.superadmin_service import SuperadminService
from database.connection import get_db_connection

class AuthService:
    def __init__(
        self, 
        user_service: UserService = Depends(),
        vendedor_service: VendedorSessionService = Depends(),
        superadmin_service: SuperadminService = Depends(),
        db_conn = Depends(get_db_connection)
    ):
        self.user_service = user_service
        self.vendedor_service = vendedor_service
        self.superadmin_service = superadmin_service
        self.db_conn = db_conn

    def login(self, role: str, credentials: Dict[str, Any], request: Request):
        role_key = role.lower()
        
        if role_key == "usuario":
            return self.user_service.login_user(
                credentials, 
                user_agent=request.headers.get("user-agent"),
                ip_address=request.client.host
            )
            
        elif role_key == "vendedor":
            return self.vendedor_service.login_vendedor(
                email=credentials.get("email"),
                password=credentials.get("password"),
                request=request,
                user_agent=request.headers.get("user-agent"),
                ip_address=request.client.host
            )

        elif role_key == "superadmin":
            return self.superadmin_service.login(credentials, request)

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Rol '{role}' no soportado."
            )

    def logout(self, role: str, request: Request, current_user: Dict[str, Any]):
        role_key = role.lower()
        
        if role_key == "usuario":
             # Extract session_id from payload explicitly passed or from request state if middleware sets it
             # Middleware auth_dependencies sets request.state.jwt_payload
             payload = getattr(request.state, "jwt_payload", {})
             session_id = payload.get("sid")
             if session_id:
                 end_user_session(self.db_conn, session_id)
             return {"message": "Sesión cerrada correctamente"}

        elif role_key == "vendedor":
             payload = getattr(request.state, "jwt_payload", {})
             jti = payload.get("sid")
             if jti:
                 self.vendedor_service.logout_vendedor(jti)
             return {"message": "Sesión cerrada correctamente"}

        elif role_key == "superadmin":
             return self.superadmin_service.logout(request)
        
        return {"message": "Logout exitoso"} 

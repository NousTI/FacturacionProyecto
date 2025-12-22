from fastapi import Depends, HTTPException, status, Request
from uuid import uuid4

from repositories.superadmin_repository import SuperadminRepository
from services.superadmin_session_service import SuperadminSessionService
from services.subscription_monitor_service import SubscriptionMonitorService
from utils.security import verify_password
from utils.jwt_utils import create_access_token
from utils.responses import success_response, error_response
from utils.messages import ErrorMessages

class SuperadminService:
    def __init__(
        self,
        repo: SuperadminRepository = Depends(),
        session_service: SuperadminSessionService = Depends(),
        monitor_service: SubscriptionMonitorService = Depends()
    ):
        self.repo = repo
        self.session_service = session_service
        self.monitor_service = monitor_service

    def login(self, credentials: dict, request: Request):
        email = credentials.get("email")
        password = credentials.get("password")
        
        superadmin = self.repo.get_superadmin_by_email(email)
        if not superadmin or not verify_password(password, superadmin["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_response(status.HTTP_401_UNAUTHORIZED, "Credenciales incorrectas")
            )
        
        # Create Session
        session_id = uuid4().hex
        # Enforce single session (Strict Mode)
        new_sid = self.session_service.start_superadmin_session(
            superadmin["id"], 
            session_id, 
            user_agent=request.headers.get("User-Agent"),
            ip_address=request.client.host
        )
        
        if new_sid is None:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_response(status.HTTP_403_FORBIDDEN, "Ya existe una sesión activa. Debes cerrar sesión antes de ingresar nuevamente.")
            )
        
        # Update last login
        self.repo.update_last_login(superadmin["id"])
        
        token, _ = create_access_token({
            "sub": str(superadmin["id"]), 
            "role": "superadmin",
            "sid": new_sid,
            "jti": new_sid
        })
        return success_response({"access_token": token, "token_type": "bearer"})

    def logout(self, request: Request):
        # We need the SID from the token payload which is stored in request.state usually
        # But dependencies.superadmin_dependencies might extract it.
        # However, the original route logic extracted it from request.state.jwt_payload
        # We'll assume the same mechanism.
        
        if not hasattr(request.state, "jwt_payload"):
             # Or raise error / silently pass
             return success_response({"message": "Sesión ya cerrada o inválida"})

        payload = request.state.jwt_payload
        sid = payload.get("sid")
        if sid:
            self.session_service.end_session(sid)
        
        return success_response({"message": "Sesión cerrada correctamente"})

    def _sanitize(self, admin: dict) -> dict:
        if not admin: return None
        safe_admin = admin.copy()
        if "password_hash" in safe_admin:
            del safe_admin["password_hash"]
        return safe_admin

    def get_me(self, current_admin: dict):
        return self._sanitize(current_admin)

    def check_subscriptions(self, current_admin: dict):
        # Already protected by dependency in route, but we can double check logic here if needed.
        return success_response(self.monitor_service.process_expired_subscriptions())

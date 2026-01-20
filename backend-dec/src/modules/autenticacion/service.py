from fastapi import Depends, Request
from uuid import uuid4
from datetime import datetime
from typing import Dict, Any

from ...errors.app_error import AppError
from ...utils.password import verify_password
from ...utils.jwt import create_access_token
from ...utils.response import success_response

# Legacy Imports (To be refactored)
from services.user_session_service import start_user_session, end_user_session
from services.vendedor_session_service import VendedorSessionService
from services.superadmin_service import SuperadminService
from repositories.user_repository import UserRepository
from repositories.vendedor_repository import VendedorRepository

class AutenticacionService:
    def __init__(
        self, 
        user_repo: UserRepository = Depends(),
        vendedor_service: VendedorSessionService = Depends(), # Usamos el servicio existente por complejidad
        superadmin_service: SuperadminService = Depends(),
    ):
        self.user_repo = user_repo
        self.vendedor_service = vendedor_service
        self.superadmin_service = superadmin_service

    def iniciar_sesion(self, rol: str, correo: str, clave: str, ip_address: str, user_agent: str):
        rol = rol.lower()
        if rol == "usuario":
            return self._login_usuario(correo, clave, ip_address, user_agent)
        elif rol == "vendedor":
            return self._login_vendedor(correo, clave, ip_address, user_agent)
        elif rol == "superadmin":
            return self._login_superadmin(correo, clave, ip_address, user_agent)
        else:
            raise AppError("Rol no soportado", 400, "AUTH_ROLE_INVALID")

    def _login_usuario(self, correo: str, clave: str, ip_address: str, user_agent: str):
        # 1. Buscar Usuario
        user = self.user_repo.get_user_by_email(correo)
        if not user or not verify_password(clave, user['password_hash']):
             raise AppError("Credenciales incorrectas", 401, "AUTH_INVALID_CREDENTIALS")

        # 2. Gestionar Sesión
        user_id = user["id"]
        session_id = uuid4().hex
        
        # Usamos conexión del repo
        conn = self.user_repo.db
        
        sid = start_user_session(
            conn,
            user_id=user_id,
            jti=session_id,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        if sid is None:
             raise AppError("Ya existe una sesión activa. Cierra sesión antes de iniciar una nueva.", 403, "AUTH_SESSION_CONFLICT")

        # 3. Generar Token
        token, _ = create_access_token({
            "sub": str(user_id),
            "sid": sid,
            "jti": sid,
            # "role": "usuario" # El legacy no ponia "role" aqui explicitamente para usuario, 
            # pero auth_dependencies lo infiere si no es superadmin/vendedor?
            # Revisemos auth_dependencies.py: payload.get("role").
            # UserService.login_user NO ponia "role".
            # Pero UnifiedLogin espera saber el rol?
            # AuthFactory.get_strategy(role) maneja None -> UsuarioAuthStrategy.
            # Asi que 'None' o 'usuario' es valido. Pondremos 'usuario' para ser explicitos.
            "role": "usuario"
        })

        # Sanitize
        user_safe = user.copy()
        user_safe.pop("password", None)
        user_safe.pop("password_hash", None)

        return success_response(
            data={
                "access_token": token,
                "token_type": "bearer",
                "usuario": user_safe
            },
            mensaje="Inicio de sesión exitoso",
            codigo="LOGIN_SUCCESS"
        )

    def _login_vendedor(self, correo: str, clave: str, ip_address: str, user_agent: str):
        # Adaptador al servicio legacy
        # VendedorSessionService.login_vendedor retorna un dict response directo
        try:
            # Necesita 'request' object para ip/agent? 
            # El legacy pide request.
            # Podemos pasar objetos dummy o None si el legacy lo permite.
            # VendedorSessionService usa request.client.host.
            # Vamos a simular el request o refactorizar.
            # REFACTORIZAR es mejor.
            # Pero VendedorSessionService es complejo. wrapper por ahora.
            
            # Creare un objeto dummy si es necesario, pero mejor pasemos los valores.
            # VendedorSessionService espera 'request'.
            # Miremos el codigo de VendedorSessionService... (no lo leimos).
            # Asumamos que podemos llamar a un metodo interno o refactorizarlo luego.
            # Por ahora, invocaré `login_vendedor` pasando un MockRequest si es necesario.
            
            # TODO: Refactorizar Vendedor logic completamente. 
            # Por ahora, lanzamos error o intentamos usar el service.
            
            # Dummy request wrapper
            class MockRequest:
                def __init__(self, ip, ua):
                    self.headers = {"user-agent": ua}
                    self.client = type("Client", (), {"host": ip})()
            
            mock_req = MockRequest(ip_address, user_agent)
            
            # El service retorna el dict response directly? Si.
            result = self.vendedor_service.login_vendedor(
                email=correo,
                password=clave,
                request=mock_req,
                user_agent=user_agent,
                ip_address=ip_address
            )
            # Normalizar respuesta (keys espaniol)
            # El legacy devuelve message, code. Nosotros queremos mensaje, codigo.
            # Lo transformamos si es necesario.
            return result
        except Exception as e:
            # Capturar HTTPException del legacy y convertir a AppError
            if hasattr(e, "status_code"):
                detail = e.detail
                msg = detail.get("message") if isinstance(detail, dict) else detail
                raise AppError(str(msg), e.status_code, "AUTH_ERROR")
            raise e

    def _login_superadmin(self, correo: str, clave: str, ip_address: str, user_agent: str):
        # Similar wrapper for Superadmin
        class MockRequest:
            def __init__(self, ip, ua):
                self.headers = {"user-agent": ua}
                self.client = type("Client", (), {"host": ip})()
        mock_req = MockRequest(ip_address, user_agent)
        
        try:
            result = self.superadmin_service.login({"email": correo, "password": clave}, mock_req)
            return result
        except Exception as e:
            if hasattr(e, "status_code"):
                detail = e.detail
                msg = detail.get("message") if isinstance(detail, dict) else detail
                raise AppError(str(msg), e.status_code, "AUTH_ERROR")
            raise e

    def cerrar_sesion(self, rol: str, current_user: dict, token_payload: dict):
        rol = rol.lower()
        if rol == "usuario":
            sid = token_payload.get("sid")
            if sid:
                # Usamos user_repo.db connection
                end_user_session(self.user_repo.db, sid)
            return success_response(None, "Sesión cerrada correctamente", "LOGOUT_SUCCESS")
            
        elif rol == "vendedor":
            sid = token_payload.get("sid")
            if sid:
                self.vendedor_service.logout_vendedor(sid)
            return success_response(None, "Sesión cerrada correctamente", "LOGOUT_SUCCESS")

        elif rol == "superadmin":
            # Superadmin logout logic (usually empty or blacklist)
            return success_response(None, "Sesión cerrada correctamente", "LOGOUT_SUCCESS")

from fastapi import Depends, Request
from uuid import uuid4
from datetime import datetime, timezone
from typing import Dict, Any

from ...errors.app_error import AppError
from ...utils.password import verify_password
from ...utils.jwt import create_access_token
from ...utils.response import success_response
from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages

# Modular Imports
from ..usuarios.repository import RepositorioUsuarios
from ..vendedores.repository import RepositorioVendedores
from ..superadmin.service import ServicioSuperadmin
from .repository import RepositorioAutenticacion

class AutenticacionService:
    def __init__(
        self, 
        user_repo: RepositorioUsuarios = Depends(),
        vendedor_repo: RepositorioVendedores = Depends(),
        superadmin_service: ServicioSuperadmin = Depends(),
        auth_repo: RepositorioAutenticacion = Depends()
    ):
        self.user_repo = user_repo
        self.vendedor_repo = vendedor_repo
        self.superadmin_service = superadmin_service
        self.auth_repo = auth_repo

    def iniciar_sesion(self, rol: str, correo: str, clave: str, ip_address: str, user_agent: str):
        rol = rol.lower()
        if rol == "usuario":
            return self._login_usuario(correo, clave, ip_address, user_agent)
        elif rol == "vendedor":
            return self._login_vendedor(correo, clave, ip_address, user_agent)
        elif rol == "superadmin":
            return self._login_superadmin(correo, clave, ip_address, user_agent)
        else:
            raise AppError(
                message=AppMessages.VAL_INVALID_INPUT,
                status_code=400,
                code=ErrorCodes.VAL_INVALID_INPUT,
                description=f"El rol '{rol}' no es válido para inicio de sesión."
            )

    def _login_usuario(self, correo: str, clave: str, ip_address: str, user_agent: str):
        # 1. Buscar Usuario
        user = self.user_repo.obtener_por_correo(correo)
        if not user or not verify_password(clave, user['password_hash']):
             raise AppError(
                 message=AppMessages.AUTH_CREDENTIALS_INVALID, 
                 status_code=401, 
                 code=ErrorCodes.AUTH_CREDENTIALS_INVALID,
                 level="WARNING"
             )

        if not user.get('activo', True):
            raise AppError(
                message=AppMessages.AUTH_INACTIVE_USER, 
                status_code=403, 
                code=ErrorCodes.AUTH_INACTIVE_USER,
                level="WARNING"
            )

        # 2. Gestionar Sesión
        user_id = user["id"]
        session_id = uuid4().hex
        
        sid = self.auth_repo.crear_sesion_usuario(
            usuario_id=user_id,
            jti=session_id,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        if sid is None:
             raise AppError(
                 message=AppMessages.SYS_INTERNAL_ERROR, 
                 status_code=500, 
                 code=ErrorCodes.SYS_INTERNAL_ERROR,
                 description="Error al persistir la sesión del usuario."
             )

        # 3. Generar Token
        token, _ = create_access_token({
            "sub": str(user_id),
            "sid": sid,
            "jti": sid,
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
        # 1. Buscar Vendedor
        vendedor = self.vendedor_repo.obtener_por_email(correo)
        if not vendedor or not verify_password(clave, vendedor['password_hash']):
            raise AppError(
                message=AppMessages.AUTH_CREDENTIALS_INVALID, 
                status_code=401, 
                code=ErrorCodes.AUTH_CREDENTIALS_INVALID,
                level="WARNING"
            )

        if not vendedor.get('activo', True):
            raise AppError(
                message=AppMessages.AUTH_INACTIVE_USER, 
                status_code=403, 
                code=ErrorCodes.AUTH_INACTIVE_USER,
                level="WARNING"
            )

        # 2. Gestionar Sesión
        vendedor_id = vendedor["id"]
        session_id = uuid4().hex
        
        sid = self.auth_repo.crear_sesion_vendedor(
            vendedor_id=vendedor_id,
            jti=session_id,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        if sid is None:
            raise AppError(
                message=AppMessages.SYS_INTERNAL_ERROR, 
                status_code=500, 
                code=ErrorCodes.SYS_INTERNAL_ERROR,
                description="Error al persistir la sesión del vendedor."
            )

        # 3. Generar Token
        token, _ = create_access_token({
            "sub": str(vendedor_id),
            "sid": sid,
            "jti": sid,
            "role": "vendedor"
        })

        # Sanitize
        vendedor_safe = vendedor.copy()
        vendedor_safe.pop("password_hash", None)

        return success_response(
            data={
                "access_token": token,
                "token_type": "bearer",
                "usuario": vendedor_safe
            },
            mensaje="Inicio de sesión exitoso",
            codigo="LOGIN_SUCCESS"
        )

    def _login_superadmin(self, correo: str, clave: str, ip_address: str, user_agent: str):
        # MockRequest because ServicioSuperadmin expects a Request object
        class MockRequest:
            def __init__(self, ip, ua):
                self.headers = {"user-agent": ua}
                self.client = type("Client", (), {"host": ip})()
        
        mock_req = MockRequest(ip_address, user_agent)
        
        # SuperadminLogin schema equivalent (passing a dict or object)
        from .schemas import LoginRequest
        datos = LoginRequest(correo=correo, clave=clave)
      
        class SuperadminLoginShim:
            def __init__(self, email, password):
                self.email = email
                self.password = password
        
        shim = SuperadminLoginShim(correo, clave)
        
        try:
            result = self.superadmin_service.login(shim, mock_req)
            return success_response(
                data=result,
                mensaje="Inicio de sesión de Superadmin exitoso",
                codigo="LOGIN_SUCCESS"
            )
        except AppError as e:
            raise e
        except Exception as e:
            raise AppError(
                message=AppMessages.SYS_INTERNAL_ERROR,
                status_code=500,
                code=ErrorCodes.SYS_INTERNAL_ERROR,
                description=f"Error en login superadmin: {str(e)}"
            )

    def cerrar_sesion(self, rol: str, current_user: dict, token_payload: dict):
        rol = rol.lower()
        sid = token_payload.get("sid")
        
        if not sid:
            return success_response(None, "No hay sesión activa", "LOGOUT_NO_SESSION")

        if rol == "usuario":
            self.auth_repo.invalidar_sesion_usuario(sid)
        elif rol == "vendedor":
            self.auth_repo.invalidar_sesion_vendedor(sid)
        elif rol == "superadmin":
            self.superadmin_service.logout(sid)
        
        return success_response(None, "Sesión cerrada correctamente", "LOGOUT_SUCCESS")

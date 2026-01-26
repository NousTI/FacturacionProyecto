from fastapi import Depends, Request
from uuid import uuid4
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from ...errors.app_error import AppError
from ...utils.password import verify_password
from ...utils.jwt import create_access_token, decode_access_token
from ...utils.response import success_response
from ...constants.error_codes import ErrorCodes
from ...constants.messages import AppMessages
from ...constants.enums import AuthKeys

# Modular Imports
from ..usuarios.repository import RepositorioUsuarios
from ..roles.repositories import RolesRepository
from .repositories import AuthRepository

class AuthServices:
    def __init__(
        self, 
        user_repo: RepositorioUsuarios = Depends(),
        auth_repo: AuthRepository = Depends(),
        role_repo: RolesRepository = Depends()
    ):
        self.user_repo = user_repo
        self.auth_repo = auth_repo
        self.role_repo = role_repo

    def iniciar_sesion(self, correo: str, clave: str, ip_address: str, user_agent: str):
        # 1. Buscar Usuario en tabla única
        user = self.user_repo.obtener_por_correo(correo)
        
        if not user or not verify_password(clave, user['password_hash']):
            # Registrar Intento Fallido
            self.auth_repo.registrar_log(
                user_id=user['id'] if user else None,
                evento='LOGIN_FALLIDO',
                detail=f"Intento fallido para: {correo}",
                ip_address=ip_address,
                ua=user_agent
            )
            raise AppError(
                message=AppMessages.AUTH_CREDENTIALS_INVALID, 
                status_code=401, 
                code=ErrorCodes.AUTH_CREDENTIALS_INVALID
            )

        if user.get('estado') != 'ACTIVA':
            raise AppError(
                message=f"La cuenta está {user.get('estado')}.", 
                status_code=403, 
                code=ErrorCodes.AUTH_INACTIVE_USER
            )

        # 2. Obtener Roles del Usuario
        user_id = user["id"]
        user_roles = self.role_repo.obtener_roles_usuario(user_id)
        
        primary_role = "USUARIO"
        role_codes = [r['codigo'].upper() for r in user_roles]
        
        if "SUPERADMIN" in role_codes:
            primary_role = "SUPERADMIN"
        elif "VENDEDOR" in role_codes:
            primary_role = "VENDEDOR"

        # 3. Validar Sesión Única
        if self.auth_repo.tiene_sesion_activa(user_id):
             raise AppError(
                message=AppMessages.AUTH_SESSION_ALREADY_ACTIVE, 
                status_code=403, 
                code=ErrorCodes.AUTH_SESSION_ALREADY_ACTIVE
            )

        # 4. Crear Nueva Sesión
        session_id = uuid4().hex
        sid = self.auth_repo.crear_sesion(
            user_id=user_id,
            jti=session_id,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        # 4. Registrar Log de Éxito
        self.auth_repo.registrar_log(
            user_id=user_id,
            evento='LOGIN_OK',
            detail=f"Inicio de sesión exitoso para: {user.get('email')}",
            ip_address=ip_address,
            ua=user_agent
        )

        # 5. Generar Token
        token, _ = create_access_token({
            "sub": str(user_id),
            "sid": sid,
            "role": primary_role
        })

        # Sanitize
        user_safe = {
            "id": str(user["id"]),
            "email": user["email"],
            "estado": user["estado"],
            "role": primary_role
        }

        return success_response(
            data={
                "access_token": token,
                "token_type": "bearer",
                "usuario": user_safe
            },
            mensaje="Inicio de sesión exitoso",
            codigo="LOGIN_SUCCESS"
        )

    def cerrar_sesion(self, token_payload: dict, ip_address: str = None, user_agent: str = None):
        sid = token_payload.get("sid")
        user_id = token_payload.get("sub")
        
        if sid:
            self.auth_repo.invalidar_sesion(sid)
            if user_id:
                self.auth_repo.registrar_log(
                    user_id=user_id,
                    evento='LOGOUT',
                    detail="Cierre de sesión exitoso",
                    ip_address=ip_address,
                    ua=user_agent
                )
        
        return success_response(None, "Sesión cerrada correctamente", "LOGOUT_SUCCESS")

    def validar_token_y_obtener_usuario(self, token: str) -> dict:
        """Absorbe la lógica de dependencies.py y strategies.py"""
        payload = decode_access_token(token)
        if not payload:
            raise AppError(AppMessages.AUTH_TOKEN_INVALID, 401, ErrorCodes.AUTH_TOKEN_INVALID)

        user_id = payload.get("sub")
        session_id = payload.get("sid")
        role = payload.get("role")

        if not session_id or not user_id:
             raise AppError(AppMessages.AUTH_TOKEN_INVALID, 401, ErrorCodes.AUTH_TOKEN_INVALID)

        # Validar Sesión
        session = self.auth_repo.obtener_sesion(session_id)
        if not session or not session['is_valid'] or str(session['user_id']) != str(user_id):
            raise AppError("Sesión inválida o expirada", 401, "AUTH_SESSION_INVALID")

        if session['expires_at'] < datetime.now(timezone.utc):
            raise AppError("Sesión expirada", 401, "AUTH_SESSION_EXPIRED")

        # Obtener Usuario (Absorbe strategies)
        user = self.user_repo.obtener_por_id(user_id)
        if not user:
            raise AppError("Usuario no encontrado", 404, "AUTH_USER_NOT_FOUND")

        # Inyectar flags de rol para compatibilidad
        user[AuthKeys.IS_SUPERADMIN] = (role == "superadmin")
        user[AuthKeys.IS_VENDEDOR] = (role == "vendedor")
        user[AuthKeys.IS_USUARIO] = (role == "usuario")
        user["role"] = role

        user.pop("password_hash", None)
        return user

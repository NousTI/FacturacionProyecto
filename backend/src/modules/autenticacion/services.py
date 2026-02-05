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
from ...constants.enums import AuthKeys, SubscriptionStatus
from ...constants.roles import RolCodigo

# Modular Imports
from ..usuarios.repositories import RepositorioUsuarios
from ..vendedores.repositories import RepositorioVendedores
from .repositories import AuthRepository

class AuthServices:
    def __init__(
        self, 
        user_repo: RepositorioUsuarios = Depends(),
        auth_repo: AuthRepository = Depends(),
        vendedor_repo: RepositorioVendedores = Depends()
    ):
        self.user_repo = user_repo
        self.auth_repo = auth_repo
        self.vendedor_repo = vendedor_repo

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

        if user.get('estado') != SubscriptionStatus.ACTIVA.value:
            raise AppError(
                message=f"La cuenta está {user.get('estado')}.", 
                status_code=403, 
                code=ErrorCodes.AUTH_INACTIVE_USER
            )

        # 2. Obtener Rol del Usuario
        user_id = user['id']
        primary_role = str(user.get("role") or RolCodigo.USUARIO.value).strip().upper()

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

        # 4. Registrar Log de Éxito y Actualizar Último Acceso
        self.auth_repo.registrar_log(
            user_id=user_id,
            evento='LOGIN_OK',
            detail=f"Inicio de sesión exitoso para: {user.get('email')}",
            ip_address=ip_address,
            ua=user_agent
        )
        self.auth_repo.actualizar_ultimo_acceso(user_id)

        # 5. Generar Token
        token, _ = create_access_token({
            "sub": str(user_id),
            "sid": sid,
            "role": primary_role
        })

        # Sanitize and prepare base data
        is_superadmin = (primary_role == RolCodigo.SUPERADMIN.value)
        user_safe = {
            "id": str(user["id"]),
            "email": user["email"],
            "nombres": user.get("nombres"),
            "apellidos": user.get("apellidos"),
            "avatar_url": user.get("avatar_url"),
            "estado": user["estado"],
            "empresa_id": str(user.get("empresa_id")) if user.get("empresa_id") else None,
            "role": primary_role,
            "is_superadmin": is_superadmin,
            "permisos": []
        }

        # 6. Inject role-specific permissions
        if is_superadmin:
            # For superadmins, they logically have all perms. 
            # Frontend handles this via is_superadmin flag, but we keep array for consistency
            user_safe["permisos"] = [] 
        
        elif primary_role == RolCodigo.VENDEDOR.value:
            vendedor_profile = self.vendedor_repo.obtener_por_user_id(user_id)
            if vendedor_profile:
                # Vendor-specific flags for backward compatibility
                legacy_perms = [
                    "puede_crear_empresas",
                    "puede_gestionar_planes",
                    "puede_acceder_empresas",
                    "puede_ver_reportes"
                ]
                for p in legacy_perms:
                    if p in vendedor_profile:
                        user_safe[p] = vendedor_profile[p]
        
        elif primary_role == RolCodigo.USUARIO.value:
            # Business users get their company-defined permissions
            user_safe["permisos"] = self.user_repo.obtener_permisos_por_user_id(user_id)

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
        
         # 1. Buscar Usuario en tabla única
        user = self.user_repo.obtener_por_id(user_id)
        
        if sid:
            self.auth_repo.invalidar_sesion(sid)
            if user_id:
                self.auth_repo.registrar_log(
                    user_id=user_id,
                    evento='LOGOUT',
                    detail=f"Cierre de sesión exitoso para: {user.get('email')}",
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
        role_upper = str(role).strip().upper()
        user[AuthKeys.IS_SUPERADMIN] = (role_upper == RolCodigo.SUPERADMIN.value)
        user[AuthKeys.IS_VENDEDOR] = (role_upper == RolCodigo.VENDEDOR.value)
        user[AuthKeys.IS_USUARIO] = (role_upper == RolCodigo.USUARIO.value)
        user["role"] = role

        # Si es VENDEDOR, inyectar permisos tambien aqui
        if role_upper == RolCodigo.VENDEDOR.value:
            vendedor_profile = self.vendedor_repo.obtener_por_user_id(user_id)
            if vendedor_profile:
                permisos = [
                    "puede_crear_empresas",
                    "puede_gestionar_planes",
                    "puede_acceder_empresas",
                    "puede_ver_reportes"
                ]
                for p in permisos:
                    if p in vendedor_profile:
                        user[p] = vendedor_profile[p]
        
        # Si es USUARIO, inyectar permisos granulares
        if role_upper == RolCodigo.USUARIO.value:
            user["permisos"] = self.user_repo.obtener_permisos_por_user_id(user_id)

        user.pop("password_hash", None)
        return user

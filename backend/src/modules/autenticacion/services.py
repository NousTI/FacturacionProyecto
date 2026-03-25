from fastapi import Depends, Request
from uuid import uuid4
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import logging

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

logger = logging.getLogger("facturacion_api")

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
        logger.info(f"[INICIO] Intentando iniciar sesión - email: {correo}")
        # 1. Buscar Usuario en tabla única
        user = self.user_repo.obtener_por_correo(correo)
        
        if not user or not verify_password(clave, user['password_hash']):
            logger.warning(f"[VALIDACIÓN] Credenciales inválidas para: {correo}")
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
            logger.warning(f"[VALIDACIÓN] Cuenta inactiva: {correo}, estado: {user.get('estado')}")
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
             logger.warning(f"[VALIDACIÓN] Sesión activa para usuario: {user_id}")
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
        logger.info(f"[ÉXITO] Sesión creada - usuario ID: {user_id}, email: {user.get('email')}")
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
        empresa_id = user.get("empresa_id")
        
        # Identificar Bloqueo Proactivo y Aviso
        empresa_lock = None
        aviso_renovacion = None
        if not is_superadmin and primary_role == RolCodigo.USUARIO.value and empresa_id:
            with self.user_repo.db.cursor() as cur:
                cur.execute("""
                    SELECT e.ruc, e.razon_social, v.telefono as vendedor_telefono, e.activo,
                           s.estado as suscripcion_estado, s.fecha_fin,
                           (SELECT u.telefono FROM sistema_facturacion.usuarios u 
                            JOIN sistema_facturacion.users us ON u.user_id = us.id 
                            WHERE us.role = 'SUPERADMIN' AND u.telefono IS NOT NULL LIMIT 1) as admin_telefono
                    FROM sistema_facturacion.empresas e
                    LEFT JOIN sistema_facturacion.vendedores v ON e.vendedor_id = v.id
                    LEFT JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                    WHERE e.id = %s
                """, (str(empresa_id),))
                e_data = cur.fetchone()
            
            if e_data:
                import os
                from datetime import date
                # Fallback interno si no hay superadmin con teléfono en DB
                superadmin_phone = e_data['admin_telefono'] or "593900000000"
                
                if not e_data['activo']:
                    empresa_lock = {
                        "type": "COMPANY_DISABLED",
                        "phone": superadmin_phone,
                        "message": f"Hola, soy {e_data['razon_social']} (RUC: {e_data['ruc']}). Mi cuenta de empresa aparece inhabilitada. Por favor, desearía saber el motivo y los pasos para reactivarla."
                    }
                else:
                    estado_s = e_data['suscripcion_estado'] or 'INEXISTENTE'
                    fecha_f = e_data['fecha_fin']
                    
                    # Normalizar a date si es datetime (Postgres TIMESTAMPTZ)
                    if hasattr(fecha_f, 'date'):
                        fecha_f = fecha_f.date()
                        
                    vencida = (fecha_f < date.today()) if fecha_f else True
                    
                    if estado_s != 'ACTIVA' or vencida:
                        target_p = e_data['vendedor_telefono'] or superadmin_phone
                        
                        # Al día siguiente del vencimiento (days_diff >= 1) -> SuperAdmin
                        if fecha_f:
                            days_diff = (date.today() - fecha_f).days
                            if days_diff >= 1: target_p = superadmin_phone
                        
                        empresa_lock = {
                            "type": f"SUBSCRIPTION_{estado_s}",
                            "phone": target_p,
                            "message": f"Hola, mi nombre es {e_data['razon_social']} (RUC: {e_data['ruc']}). Mi suscripción venció el {fecha_f or 'N/A'} y deseo renovar mi plan. Por favor, ayúdeme con la información para el pago."
                        }
                    
                    # 7. AVISO DE RENOVACIÓN (Si no hay bloqueo duro, pero faltan <= 7 días)
                    elif fecha_f:
                        days_left = (fecha_f - date.today()).days
                        if 0 <= days_left <= 7:
                            aviso_renovacion = {
                                "dias": days_left,
                                "phone": e_data['vendedor_telefono'] or superadmin_phone,
                                "message": f"Hola, mi nombre es {e_data['razon_social']} (RUC: {e_data['ruc']}). Mi suscripción vence el {fecha_f} (en {days_left} días) y deseo renovar mi plan. Por favor, ayúdeme con la información."
                            }

        user_safe = {
            "id": str(user["id"]),
            "email": user["email"],
            "nombres": user.get("nombres"),
            "apellidos": user.get("apellidos"),
            "avatar_url": user.get("avatar_url"),
            "estado": user["estado"],
            "empresa_id": str(empresa_id) if empresa_id else None,
            "empresa_suscripcion_estado": user.get("empresa_suscripcion_estado"),
            "empresa_activa": user.get("empresa_activa", True),
            "empresa_lock": empresa_lock,
            "aviso_renovacion": aviso_renovacion,
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
        logger.info(f"[INICIO] Cerrando sesión")
        sid = token_payload.get("sid")
        user_id = token_payload.get("sub")
        
         # 1. Buscar Usuario en tabla única
        user = self.user_repo.obtener_por_id(user_id)
        
        if sid:
            self.auth_repo.invalidar_sesion(sid)
            if user_id:
                logger.info(f"[ÉXITO] Sesión cerrada - usuario ID: {user_id}")
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
        logger.info("[INICIO] Validando token y obteniendo usuario")
        payload = decode_access_token(token)
        if not payload:
            logger.warning("[VALIDACIÓN] Token inválido o no decodificable")
            raise AppError(AppMessages.AUTH_TOKEN_INVALID, 401, ErrorCodes.AUTH_TOKEN_INVALID)

        user_id = payload.get("sub")
        session_id = payload.get("sid")
        role = payload.get("role")

        if not session_id or not user_id:
             logger.warning("[VALIDACIÓN] Faltan parámetros en token (session_id o user_id)")
             raise AppError(AppMessages.AUTH_TOKEN_INVALID, 401, ErrorCodes.AUTH_TOKEN_INVALID)

        # Validar Sesión
        session = self.auth_repo.obtener_sesion(session_id)
        if not session or not session['is_valid'] or str(session['user_id']) != str(user_id):
            logger.warning(f"[VALIDACIÓN] Sesión inválida para usuario: {user_id}")
            raise AppError("Sesión inválida o expirada", 401, "AUTH_SESSION_INVALID")

        if session['expires_at'] < datetime.now(timezone.utc):
            logger.warning(f"[VALIDACIÓN] Sesión expirada para usuario: {user_id}")
            raise AppError("Sesión expirada", 401, "AUTH_SESSION_EXPIRED")

        # Obtener Usuario (Absorbe strategies)
        user = self.user_repo.obtener_por_id(user_id)
        if not user:
            logger.warning(f"[VALIDACIÓN] Usuario no encontrado: {user_id}")
            raise AppError("Usuario no encontrado", 404, "AUTH_USER_NOT_FOUND")
        
        logger.info(f"[ÉXITO] Token y usuario validados - usuario ID: {user_id}")

        # 5. Inyectar flags de rol para compatibilidad
        role_upper = str(role).strip().upper()
        user["role"] = role
        user["is_superadmin"] = (role_upper == "SUPERADMIN")
        user["is_vendedor"] = (role_upper == "VENDEDOR")
        user["is_usuario"] = (role_upper == "USUARIO")
        user["empresa_activa"] = user.get("empresa_activa", True)

        # 6. Bloqueo Proactivo y Aviso (Lógica dinámica)
        empresa_lock = None
        aviso_renovacion = None
        empresa_id = user.get("empresa_id")
        if not user["is_superadmin"] and user["is_usuario"] and empresa_id:
            with self.user_repo.db.cursor() as cur:
                cur.execute("""
                    SELECT e.ruc, e.razon_social, v.telefono as vendedor_telefono, e.activo,
                           s.estado as suscripcion_estado, s.fecha_fin,
                           (SELECT u.telefono FROM sistema_facturacion.usuarios u 
                            JOIN sistema_facturacion.users us ON u.user_id = us.id 
                            WHERE us.role = 'SUPERADMIN' AND u.telefono IS NOT NULL LIMIT 1) as admin_telefono
                    FROM sistema_facturacion.empresas e
                    LEFT JOIN sistema_facturacion.vendedores v ON e.vendedor_id = v.id
                    LEFT JOIN sistema_facturacion.suscripciones s ON s.empresa_id = e.id
                    WHERE e.id = %s
                """, (str(empresa_id),))
                e_data = cur.fetchone()
            
            if e_data:
                import os
                from datetime import date
                superadmin_phone = e_data['admin_telefono'] or "593900000000"
                if not e_data['activo']:
                    empresa_lock = {
                        "type": "COMPANY_DISABLED", "phone": superadmin_phone,
                        "message": f"Hola, soy {e_data['razon_social']} (RUC: {e_data['ruc']}). Mi cuenta de empresa aparece inhabilitada. Por favor, desearía saber el motivo y los pasos para reactivarla."
                    }
                else:
                    estado_s = e_data['suscripcion_estado'] or 'INEXISTENTE'
                    fecha_f = e_data['fecha_fin']
                    
                    if hasattr(fecha_f, 'date'):
                        fecha_f = fecha_f.date()
                        
                    vencida = (fecha_f < date.today()) if fecha_f else True
                    if estado_s != 'ACTIVA' or vencida:
                        target_p = e_data['vendedor_telefono'] or superadmin_phone
                        if fecha_f:
                            days_diff = (date.today() - fecha_f).days
                            if days_diff >= 1: target_p = superadmin_phone
                        empresa_lock = {
                            "type": f"SUBSCRIPTION_{estado_s}", "phone": target_p,
                            "message": f"Hola, mi nombre es {e_data['razon_social']} (RUC: {e_data['ruc']}). Mi suscripción venció el {fecha_f or 'N/A'} y deseo renovar mi plan. Por favor, ayúdeme con la información para el pago."
                        }
                    
                    # 7. AVISO DE RENOVACIÓN (Si no hay bloqueo duro, pero faltan <= 7 días)
                    elif fecha_f:
                        days_left = (fecha_f - date.today()).days
                        if 0 <= days_left <= 7:
                            aviso_renovacion = {
                                "dias": days_left,
                                "phone": e_data['vendedor_telefono'] or superadmin_phone,
                                "message": f"Hola, mi nombre es {e_data['razon_social']} (RUC: {e_data['ruc']}). Mi suscripción vence el {fecha_f} (en {days_left} días) y deseo renovar mi plan. Por favor, ayúdeme con la información."
                            }

        user["empresa_lock"] = empresa_lock
        user["aviso_renovacion"] = aviso_renovacion

        # Si es VENDEDOR/USUARIO, inyectar permisos
        if user["is_vendedor"]:
            vendedor_profile = self.vendedor_repo.obtener_por_user_id(user_id)
            if vendedor_profile:
                for p in ["puede_crear_empresas", "puede_gestionar_planes", "puede_acceder_empresas", "puede_ver_reportes"]:
                    if p in vendedor_profile: user[p] = vendedor_profile[p]
        
        if user["is_usuario"]:
            user["permisos"] = self.user_repo.obtener_permisos_por_user_id(user_id)

        user.pop("password_hash", None)
        return user

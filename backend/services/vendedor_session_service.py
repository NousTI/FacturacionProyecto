from fastapi import Depends, HTTPException, status, Request
from repositories.vendedor_session_repository import VendedorSessionRepository
from repositories.vendedor_repository import VendedorRepository
from utils.security import verify_password
from utils.jwt_utils import create_access_token
import uuid

class VendedorSessionService:
    def __init__(
        self, 
        session_repository: VendedorSessionRepository = Depends(),
        vendedor_repository: VendedorRepository = Depends()
    ):
        self.session_repository = session_repository
        self.vendedor_repository = vendedor_repository

    def login_vendedor(self, email, password, request: Request, user_agent=None, ip_address=None):
        # 1. Verify User
        vendedor = self.vendedor_repository.get_by_email(email)
        if not vendedor:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas" # Same message for security
            )
        
        # 2. Verify Password
        if not verify_password(password, vendedor['password_hash']):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas"
            )

        # 3. Check for existing session? (Optional, skipping strictly for now as per prompt to just implement login)
        # But prompts said: "ensure only one active session per Superadmin", implying similar for Vendedor?
        # The user said "igualmente con su tabla vendedor_sessions... solo que ahora es para el vendedor".
        # So I should probably enforce single session too to match Superadmin behavior.
        
        # 3. Check for existing session
        active_session = self.session_repository.get_active_session_for_vendedor(vendedor['id'])
        if active_session:
            # Check if expired
            from datetime import datetime, timezone
            if active_session['expires_at'] > datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Ya existe una sesión activa. Debe cerrar sesión primero."
                )
            # If expired but distinct as valid, invalidate it to be clean
            self.session_repository.invalidate_session(active_session['id'])

        # 4. Update Last Login
        # Update db and refresh variable to get new timestamp
        updated_vendedor = self.vendedor_repository.update_last_login(vendedor['id'])
        if updated_vendedor:
            vendedor = updated_vendedor

        # 5. Create Session
        jti = str(uuid.uuid4())
        self.session_repository.create_session(
            vendedor_id=vendedor['id'],
            jti=jti,
            user_agent=user_agent,
            ip_address=ip_address
        )

        # 6. Generate Token
        access_token = create_access_token(
            data={"sub": str(vendedor['id']), "sid": jti, "role": "vendedor"}
        )
        
        return {
            "access_token": access_token[0] if isinstance(access_token, tuple) else access_token, 
            "token_type": "bearer",
            "user": {
                "id": vendedor['id'],
                "nombres": vendedor['nombres'],
                "apellidos": vendedor['apellidos'],
                "email": vendedor['email'],
                "role": "vendedor",
                "porcentaje_comision": float(vendedor['porcentaje_comision']) if vendedor['porcentaje_comision'] else 0,
                "porcentaje_comision_inicial": float(vendedor['porcentaje_comision_inicial']) if vendedor['porcentaje_comision_inicial'] else 0,
                "porcentaje_comision_recurrente": float(vendedor['porcentaje_comision_recurrente']) if vendedor['porcentaje_comision_recurrente'] else 0,
                "tipo_comision": vendedor['tipo_comision'],
                "telefono": vendedor['telefono'],
                "documento_identidad": vendedor['documento_identidad'],
                "puede_crear_empresas": vendedor['puede_crear_empresas'],
                "puede_gestionar_planes": vendedor['puede_gestionar_planes'],
                "puede_ver_reportes": vendedor['puede_ver_reportes'],
                "activo": vendedor['activo'],
                "created_at": vendedor['created_at'],
                "updated_at": vendedor['updated_at'],
                "last_login": vendedor['last_login']
            }
        }

    def logout_vendedor(self, jti: str):
        self.session_repository.invalidate_session(jti)
        
    def validate_session(self, jti: str):
        session = self.session_repository.get_session(jti)
        if not session or not session['is_valid']:
            return False
        # Could check expiry here too if DB doesn't handle it, usually DB check suffices or check 'expires_at' > now
        # The repo just returns the row.
        from datetime import datetime, timezone
        if session['expires_at'] < datetime.now(timezone.utc):
             return False
        return True

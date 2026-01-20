from fastapi import Depends, Request
from uuid import UUID, uuid4
from datetime import datetime, timezone

from .repository import RepositorioSuperadmin
from .schemas import SuperadminLogin
from ...utils.security import verify_password
from ...utils.jwt_utils import create_access_token
from ...errors.app_error import AppError

class ServicioSuperadmin:
    def __init__(self, repo: RepositorioSuperadmin = Depends()):
        self.repo = repo

    def login(self, datos: SuperadminLogin, request: Request):
        admin = self.repo.obtener_por_email(datos.email)
        if not admin or not verify_password(datos.password, admin['password_hash']):
            raise AppError("Credenciales incorrectas", 401, "AUTH_INVALID")
            
        # Validar sesión activa (Opcional, según política deseada)
        activa = self.repo.obtener_sesion_activa(admin['id'])
        if activa:
            exp = activa['expires_at'].replace(tzinfo=timezone.utc)
            if exp > datetime.now(timezone.utc):
                # Opcional: Permitir relogin o bloquear
                pass
                
        sid = uuid4().hex
        self.repo.crear_sesion(admin['id'], sid, request.headers.get("User-Agent"), request.client.host)
        self.repo.actualizar_ultimo_login(admin['id'])
        
        token, _ = create_access_token({
            "sub": str(admin['id']),
            "role": "superadmin",
            "sid": sid
        })
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": admin['id'],
                "email": admin['email'],
                "nombres": admin['nombres'],
                "apellidos": admin['apellidos']
            }
        }

    def logout(self, sid: str):
        if sid: self.repo.invalidar_sesion(sid)
        return {"message": "Sesión cerrada"}

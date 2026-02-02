from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from .services import AuthServices
from ...utils.jwt import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/autenticacion/iniciar-sesion")

async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    service: AuthServices = Depends()
):
    user = service.validar_token_y_obtener_usuario(token)
    request.state.jwt_payload = decode_access_token(token)
    return user

# Alias para compatibilidad
obtener_usuario_actual = get_current_user

from fastapi import HTTPException, status

def requerir_rol(rol: str):
    def rol_dependency(current_user: dict = Depends(get_current_user)):
        if current_user.get("rol") != rol:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requieren permisos de {rol}"
            )
        return current_user
    return rol_dependency

def requerir_superadmin(current_user: dict = Depends(get_current_user)):
    if current_user.get("rol") != "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de Super Administrador"
        )
    return current_user

requerir_admin = requerir_superadmin

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from .services import AuthServices
from ...utils.jwt import decode_access_token
from ..suscripciones.repositories import RepositorioSuscripciones

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
        user_role = str(current_user.get("role") or current_user.get("rol") or "").upper()
        if user_role != rol.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requieren permisos de {rol}"
            )
        return current_user
    return rol_dependency

def requerir_superadmin(current_user: dict = Depends(get_current_user)):
    role = str(current_user.get("role") or current_user.get("rol") or "").upper()
    if role != "SUPERADMIN" and not current_user.get("is_superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de Super Administrador"
        )
    return current_user

requerir_admin = requerir_superadmin

async def requerir_suscripcion_activa(
    current_user: dict = Depends(get_current_user),
    repo_suscripciones: RepositorioSuscripciones = Depends()
):
    """
    Verifica que la empresa del usuario tenga una suscripción activa.
    Omite la verificación para Súper Administradores y Vendedores.
    """
    # 1. Skip check for roles that manage the system
    is_superadmin = current_user.get("role") == "SUPERADMIN" or current_user.get("is_superadmin")
    is_vendedor = current_user.get("role") == "VENDEDOR" or current_user.get("is_vendedor")
    
    if is_superadmin or is_vendedor:
        return current_user
        
    empresa_id = current_user.get("empresa_id")
    if not empresa_id:
        # Si un usuario no tiene empresa_id y no es admin, tal vez no debería estar aquí, 
        # pero por ahora permitimos el paso o lanzamos 403.
        return current_user
        
    # 2. Consultar suscripción
    suscripcion = repo_suscripciones.obtener_suscripcion_por_empresa(empresa_id)
    
    if not suscripcion or suscripcion['estado'] != 'ACTIVA':
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Suscripción inactiva. Por favor, regularice su situación para continuar."
        )
        
    return current_user

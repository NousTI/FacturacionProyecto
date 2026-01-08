import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Body, Path, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr

from database.connection import get_db_connection
from dependencies.auth_dependencies import get_current_user
from services.auth_service import AuthService
from utils.responses import success_response, error_response

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/usuario/login")

class UnifiedLoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/{role}/login")
def login(
    request: Request,
    role: str = Path(..., title="User Role", regex="^(usuario|vendedor|superadmin)$"),
    credentials: UnifiedLoginRequest = Body(...),
    auth_service: AuthService = Depends()
):
    """
    Endpoint unificado de login para usuario, vendedor y superadmin.
    """
    return auth_service.login(role, credentials.model_dump(), request)


@router.post("/{role}/logout")
def logout(
    request: Request,
    role: str = Path(..., regex="^(usuario|vendedor|superadmin)$"),
    current_user: dict = Depends(get_current_user),
    auth_service: AuthService = Depends()
):
    """
    Endpoint unificado de logout.
    """
    return auth_service.logout(role, request, current_user)


@router.get("/{role}/me")
def read_me(
    role: str = Path(..., regex="^(usuario|vendedor|superadmin)$"),
    current_user: dict = Depends(get_current_user)
):
    """
    Endpoint unificado para obtener perfil actual.
    El 'role' en el path es principalmente para consistencia de API.
    """
    # Validar que el rol del token (AuthKeys) corresponda con el role del path si se desea.
    # Por ahora se retorna el usuario autenticado que ya contiene la info.
    
    # SECURITY: Ensure password_hash is not returned
    if "password_hash" in current_user:
        current_user.pop("password_hash")
    if "password" in current_user:
        current_user.pop("password")
        
    return current_user

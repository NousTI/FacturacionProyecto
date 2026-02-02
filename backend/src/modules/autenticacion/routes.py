from fastapi import APIRouter, Depends, Request, Path, Body
from fastapi.security import OAuth2PasswordBearer

from .controller import AuthController
from .schemas import LoginRequest
from ...utils.response_schemas import RespuestaBase
from .dependencies import obtener_usuario_actual, get_current_user, requerir_superadmin, requerir_admin, requerir_rol
from .permissions import requerir_permiso

router = APIRouter()

@router.post("/iniciar-sesion", response_model=RespuestaBase)
def login(
    request: Request,
    body: LoginRequest,
    controller: AuthController = Depends()
):
    return controller.login(request, body)

@router.post("/cerrar-sesion", response_model=RespuestaBase)
def logout(
    request: Request,
    usuario: dict = Depends(get_current_user),
    controller: AuthController = Depends()
):
    return controller.logout(request)

@router.get("/perfil", response_model=RespuestaBase)
def obtener_perfil(
    usuario: dict = Depends(get_current_user),
    controller: AuthController = Depends()
):
    return controller.obtener_perfil(usuario)

from fastapi import APIRouter, Depends, Request, Path, Body
from fastapi.security import OAuth2PasswordBearer

from .controller import AuthController
from .services import AuthServices
from .schemas import LoginRequest

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/autenticacion/iniciar-sesion")

# Dependencia para obtener el usuario actual (reemplaza dependencies.py)
async def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    service: AuthServices = Depends()
):
    user = service.validar_token_y_obtener_usuario(token)
    # Almacenar payload para uso posterior (ej: logout)
    from ...utils.jwt import decode_access_token
    request.state.jwt_payload = decode_access_token(token)
    return user

@router.post("/iniciar-sesion")
def login(
    request: Request,
    body: LoginRequest,
    controller: AuthController = Depends()
):
    return controller.login(request, body)

@router.post("/cerrar-sesion")
def logout(
    request: Request,
    usuario: dict = Depends(get_current_user),
    controller: AuthController = Depends()
):
    return controller.logout(request)

@router.get("/perfil")
def obtener_perfil(
    usuario: dict = Depends(get_current_user),
    controller: AuthController = Depends()
):
    return controller.obtener_perfil(usuario)

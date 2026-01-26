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

# Alias para compatibilidad con módulos existentes (Arquitectura Modular)
obtener_usuario_actual = get_current_user

# Función de bypass para compatibilidad durante la migración
def requerir_permiso(permiso_codigo: str):
    """
    Dependency factory que permite el paso si el usuario está autenticado.
    Temporalmente ignora el permiso_codigo para permitir la migración.
    """
    async def bypass_dependency(usuario: dict = Depends(obtener_usuario_actual)):
        # Por ahora, solo requerimos que haya un usuario autenticado
        return usuario
    return bypass_dependency

async def requerir_superadmin(usuario: dict = Depends(obtener_usuario_actual)):
    """
    Bypass para requerir_superadmin. 
    Idealmente debería validar el rol, pero por ahora solo requiere login.
    """
    return usuario

# Alias adicionales comunes si existen
requerir_admin = requerir_superadmin
requerir_rol = requerir_permiso # O algo similar

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

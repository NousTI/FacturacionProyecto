from fastapi import APIRouter, Depends, Request, Path, Body
from .schemas import LoginRequest
from .service import AutenticacionService
from .dependencies import obtener_usuario_actual
from ...errors.app_error import AppError
from ...utils.response import success_response

router = APIRouter()

@router.post("/iniciar-sesion")
def login_unificado(
    request: Request,
    body: LoginRequest,
    service: AutenticacionService = Depends()
):
    """
    Intenta iniciar sesión buscando en Usuario, Vendedor y Superadmin secuencialmente.
    """
    # Intentar roles secuencialmente
    for rol in ["usuario", "vendedor", "superadmin"]:
        try:
            return service.iniciar_sesion(rol, body.correo, body.clave, request.client.host, request.headers.get("user-agent"))
        except AppError as e:
            # Si el error es específicamente que ya tiene una sesión, lo lanzamos de inmediato
            if e.code == "AUTH_SESSION_ALREADY_ACTIVE":
                raise e
            # Si es otro error (como credenciales), seguimos probando el siguiente rol
            continue
        except Exception:
            # Si falla un rol por otra razón, probamos el siguiente
            continue
    
    # Si llegamos aquí, falló para todos los roles
    # Llamamos una última vez con 'usuario' para que lance la excepción correspondiente (401)
    return service.iniciar_sesion("usuario", body.correo, body.clave, request.client.host, request.headers.get("user-agent"))


@router.post("/{rol}/iniciar-sesion")
def login_por_rol(
    request: Request,
    rol: str = Path(..., title="Rol de usuario", regex="^(usuario|vendedor|superadmin)$"),
    body: LoginRequest = Body(...),
    service: AutenticacionService = Depends()
):
    return service.iniciar_sesion(rol, body.correo, body.clave, request.client.host, request.headers.get("user-agent"))

@router.post("/{rol}/cerrar-sesion")
def logout_por_rol(
    rol: str = Path(..., regex="^(usuario|vendedor|superadmin)$"),
    request: Request = None, # Para obtener el payload del state
    usuario: dict = Depends(obtener_usuario_actual),
    service: AutenticacionService = Depends()
):
    payload = getattr(request.state, "jwt_payload", {})
    return service.cerrar_sesion(rol, usuario, payload)

@router.get("/perfil")
def obtener_perfil(usuario: dict = Depends(obtener_usuario_actual)):
    # Sanitizar seguridad
    usuario.pop("password", None)
    usuario.pop("password_hash", None)
    return success_response(data=usuario)

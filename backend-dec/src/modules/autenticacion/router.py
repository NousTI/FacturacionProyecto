from fastapi import APIRouter, Depends, Request, Path, Body
from .schemas import LoginRequest
from .service import AutenticacionService
from .dependencies import obtener_usuario_actual

router = APIRouter()

@router.post("/iniciar-sesion")
def login_unificado(
    request: Request,
    body: LoginRequest,
    service: AutenticacionService = Depends()
):
    """
    Intenta iniciar sesión buscando en Usuario, Vendedor y Superadmin secuencialmente (o unificado si se decide).
    De momento, por compatibilidad con endpoint legacy '/login', este endpoint decide.
    Pero la arquitectura pide '/{rol}/iniciar-sesion' explícito o unificado? 
    El legacy tenia ambos.
    Haremos el unificado iterando roles o por defecto "usuario". 
    Para ser explícitos y RESTful: POST /autenticacion/{rol}/iniciar-sesion es mejor.
    Pero si el frontend usa un solo form login... 
    Mantengamos '/iniciar-sesion' por defecto como USUARIO (o intentar todos).
    """
    # Intentar como Usuario por defecto, o lógica unificada.
    # Por simplicidad y seguridad, exigimos rol o probamos todos catch-fail.
    try:
        return service.iniciar_sesion("usuario", body.correo, body.clave, request.client.host, request.headers.get("user-agent"))
    except Exception:
        # Fallback a vendedor, luego superadmin? 
        # Mejor forzar a usar el endpoint tipado si el frontend lo soporta.
        # Pero PROMPT dice "frontend se ajustará".
        # Haremos endpoints explícitos.
        pass
    
    # Si falla, error generico
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
    return usuario

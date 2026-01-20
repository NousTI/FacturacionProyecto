from fastapi import APIRouter, Depends, Request
from .service import ServicioSuperadmin
from .schemas import SuperadminLogin
from ..autenticacion.dependencies import requerir_superadmin

router = APIRouter()

@router.post("/login")
def login(
    datos: SuperadminLogin,
    request: Request,
    servicio: ServicioSuperadmin = Depends()
):
    return servicio.login(datos, request)

@router.post("/logout")
def logout(
    usuario: dict = Depends(requerir_superadmin),
    servicio: ServicioSuperadmin = Depends()
):
    # El SID debe venir en el token decodificado
    sid = usuario.get('sid')
    return servicio.logout(sid)

@router.get("/me")
def get_me(usuario: dict = Depends(requerir_superadmin)):
    return usuario

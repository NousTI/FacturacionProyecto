from fastapi import APIRouter, Depends, Request
from .controller import SuperadminController
from .schemas import PerfilUpdate
from ..autenticacion.routes import get_current_user
from ...utils.response_schemas import RespuestaBase

router = APIRouter()

@router.get("/me", response_model=RespuestaBase)
def obtener_mi_perfil(
    usuario: dict = Depends(get_current_user),
    controller: SuperadminController = Depends()
):
    # 'usuario' ya contiene la info de la tabla users + flags
    return controller.obtener_mi_perfil(usuario.get("id"))

@router.patch("/me", response_model=RespuestaBase)
def actualizar_mi_perfil(
    body: PerfilUpdate,
    usuario: dict = Depends(get_current_user),
    controller: SuperadminController = Depends()
):
    return controller.actualizar_mi_perfil(usuario.get("id"), body)

from fastapi import APIRouter, Depends, Request, Path
from uuid import UUID
from .controller import RolesController
from .schemas import AsignacionRolRequest
from ..autenticacion.routes import get_current_user

router = APIRouter()

# Middleware de seguridad opcional aquí: Depends(requerir_superadmin)
@router.get("/")
def listar_roles(
    usuario: dict = Depends(get_current_user),
    controller: RolesController = Depends()
):
    return controller.listar_roles()

@router.get("/usuario/{user_id}")
def obtener_roles_usuario(
    user_id: UUID,
    usuario: dict = Depends(get_current_user),
    controller: RolesController = Depends()
):
    return controller.obtener_roles_usuario(user_id)

@router.post("/asignar")
def asignar_rol(
    body: AsignacionRolRequest,
    usuario: dict = Depends(get_current_user),
    request: Request = None,
    controller: RolesController = Depends()
):
    # Inyectar manualmente el user_id del autor en el state para el controlador
    request.state.user_id = usuario.get("id")
    return controller.asignar_rol(request, body)

@router.post("/remover")
def remover_rol(
    body: AsignacionRolRequest,
    usuario: dict = Depends(get_current_user),
    request: Request = None,
    controller: RolesController = Depends()
):
    request.state.user_id = usuario.get("id")
    return controller.remover_rol(request, body)

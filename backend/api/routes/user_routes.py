from fastapi import APIRouter, Depends, HTTPException
from typing import List
from services.user_service import UserService
from models.Usuario import UserRead, UserRegister
from dependencies.auth_dependencies import require_permission
from utils.responses import error_response

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)

@router.get("/", response_model=List[UserRead], dependencies=[Depends(require_permission("users:read"))])
def list_users(
    usuario: str = None, 
    correo: str = None, 
    fk_rol: int = None, 
    service: UserService = Depends()
):
    return service.list_users(usuario, correo, fk_rol)

@router.get("/{user_id}", response_model=UserRead, dependencies=[Depends(require_permission("users:read"))])
def get_user(user_id: int, service: UserService = Depends()):
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=error_response(404, "Usuario no encontrado"))
    return user

@router.post("/", response_model=UserRead, dependencies=[Depends(require_permission("users:create"))])
def create_user(user: UserRegister, service: UserService = Depends()):
    new_user = service.create_user(user)
    if not new_user:
        raise HTTPException(status_code=400, detail=error_response(400, "Error al crear usuario"))
    return new_user

@router.put("/{user_id}", response_model=UserRead, dependencies=[Depends(require_permission("users:update"))])
def update_user(user_id: int, user: UserRegister, service: UserService = Depends()):
    updated_user = service.update_user(user_id, user)
    if not updated_user:
        raise HTTPException(status_code=404, detail=error_response(404, "Usuario no encontrado o error al actualizar"))
    return updated_user

@router.delete("/{user_id}", dependencies=[Depends(require_permission("users:delete"))])
def delete_user(user_id: int, service: UserService = Depends()):
    deleted = service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=error_response(404, "Usuario no encontrado"))
    return {"message": "Usuario eliminado correctamente"}

from fastapi import APIRouter, Depends, status
from typing import List
from uuid import UUID
from dependencies.auth_dependencies import get_current_user
from services.user_service import UserService
from models.Usuario import UserCreate, UserRead, UserUpdate, PasswordReset
from utils.enums import AuthKeys

router = APIRouter()

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserCreate,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    return service.create_user(user, current_user)

@router.get("/", response_model=List[UserRead])
def list_users(
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    return service.list_users(current_user)

@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    return service.get_user(user_id, current_user)

@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    return service.update_user(user_id, user_update, current_user)

@router.delete("/{user_id}")
def delete_user(
    user_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    service.delete_user(user_id, current_user)
    return {"message": "Usuario eliminado correctamente"}

@router.post("/reset-password")
def reset_password(
    payload: PasswordReset,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    user_id = current_user.get("id")
    # This route seems to be for the logged-in user to reset THEIR OWN password
    # OR for an admin to reset another's? 
    # Current implementation in original file used `user_id = current_user.get("id")` implying SELF reset.
    # And it had a check: "if is_vendedor or is_superadmin: pass" to allow them?
    # Actually, original code: `user_id = current_user.get("id")` -> always resets CURRENT USER password.
    
    service.reset_password(user_id, payload.new_password)
    return {"message": "Contraseña actualizada correctamente"}

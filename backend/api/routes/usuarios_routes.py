from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from dependencies.auth_dependencies import get_current_user
from services.user_service import UserService
from services.empresa_service import EmpresaService
from models.Usuario import UserCreate, UserRead, UserUpdate, PasswordReset
from utils.responses import error_response
from utils.enums import AuthKeys
from utils.messages import UserMessages

router = APIRouter()

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserCreate,
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(),
    empresa_service: EmpresaService = Depends()
):
    is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
    is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
    is_usuario = current_user.get(AuthKeys.IS_USUARIO, False)
    user_id = current_user.get("id")
    user_empresa_id = current_user.get("empresa_id")

    # Access Control: Superadmin OR Vendedor OR Company Admin
    
    if is_usuario:
        # Check if they are defining the correct company
        if str(user.empresa_id) != str(user_empresa_id):
             raise HTTPException(status_code=403, detail=UserMessages.COMPANY_MISMATCH)


    # If Vendedor, verify they own the empresa
    if not is_superadmin and is_vendedor:
        empresa = empresa_service.get_empresa(user.empresa_id, user_id, is_superadmin=False)
        # Service already throws 403 or 404 if not found/owned
    
    # Check if the user is trying to register a user for a company they don't own (handled above by get_empresa check potentially)

    return user_service.create_user(user, creator_id=user_id, is_superadmin=is_superadmin, is_vendedor=is_vendedor)

@router.get("/", response_model=List[UserRead])
def list_users(
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(),
    empresa_service: EmpresaService = Depends()
):
    is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
    is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
    is_usuario = current_user.get(AuthKeys.IS_USUARIO, False)
    user_id = current_user.get("id")

    if is_superadmin:
        return service.list_users() # Return all
    
    if is_vendedor:
        # Get all companies for this vendor
        empresas = empresa_service.list_empresas(user_id=user_id, is_superadmin=False)
        
        # Let's start simple: Return empty list if no companies, or iterate.
        all_users = []
        for emp in empresas:
            all_users.extend(service.list_users(empresa_id=emp['id']))
        return all_users


    if is_usuario:
        # List users for their own company only
        # Assuming the service supports filtering by empresa_id
        return service.list_users(empresa_id=current_user.get("empresa_id"))

    raise HTTPException(status_code=403, detail="No tienes permisos para listar usuarios")


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(),
    empresa_service: EmpresaService = Depends()
):
    # Fetch target user
    target_user = service.get_user(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
    is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
    current_id = current_user.get("id")

    # 1. Superadmin can see all
    if is_superadmin:
        return target_user

    # 2. User can see themselves
    if str(current_id) == str(user_id):
        return target_user

    # 3. Vendedor can see users of their companies
    if is_vendedor:
        # Check if target user's company belongs to this vendedor
        empresa_id = target_user['empresa_id']
        empresa = empresa_service.get_empresa(empresa_id, user_id=current_id, is_superadmin=False) # This throws if no permission
        if empresa:
            return target_user

    raise HTTPException(status_code=403, detail="No tienes permiso para ver este usuario")


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: UUID,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(),
    empresa_service: EmpresaService = Depends()
):
    is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
    is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
    is_usuario = current_user.get(AuthKeys.IS_USUARIO, False)
    current_id = current_user.get("id")
    
    # Regular users cannot update themselves (except password via reset) -> Actually Admins CAN update users
    if is_usuario:
         # Check if target user belongs to same company
         if not target_user or str(target_user.get('empresa_id')) != str(current_user.get('empresa_id')):
             raise HTTPException(status_code=403, detail="No tienes permisos para actualizar este usuario")


    # Validate target existence and Vendedor ownership
    target_user = service.get_user(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if is_vendedor:
         # Cannot update themselves via this route (if they were a user, but they are a Vendedor, different table)
         # Check if target user belongs to a company owned by Vendedor
         empresa_id = target_user['empresa_id']
         empresa_service.get_empresa(empresa_id, user_id=current_id, is_superadmin=False)
         # If update changes empresa_id, check ownership of NEW empresa too?
         if user_update.empresa_id:
              empresa_service.get_empresa(user_update.empresa_id, user_id=current_id, is_superadmin=False)

    return service.update_user(user_id, user_update)

@router.delete("/{user_id}")
def delete_user(
    user_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(),
    empresa_service: EmpresaService = Depends()
):
    is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN, False)
    is_vendedor = current_user.get(AuthKeys.IS_VENDEDOR, False)
    is_usuario = current_user.get(AuthKeys.IS_USUARIO, False)
    current_id = current_user.get("id")

    if is_usuario:
        # Check ownership validation inside service or here
        target_check = service.get_user(user_id)
        if not target_check or str(target_check.get('empresa_id')) != str(current_user.get('empresa_id')):
             raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este usuario")


    target_user = service.get_user(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if is_vendedor:
        empresa_id = target_user['empresa_id']
        empresa_service.get_empresa(empresa_id, user_id=current_id, is_superadmin=False)
    
    service.delete_user(user_id)
    return {"message": "Usuario eliminado correctamente"}

@router.post("/reset-password")
def reset_password(
    payload: PasswordReset,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    user_id = current_user.get("id")
    
    if current_user.get(AuthKeys.IS_VENDEDOR) or current_user.get(AuthKeys.IS_SUPERADMIN):
         # Role check to prevent non-User table entities from checking this 
         # (or you could allow them if they share logic, but for now blocking as per requirements)
         pass

    service.reset_password(user_id, payload.new_password)
    return {"message": "Contraseña actualizada correctamente"}

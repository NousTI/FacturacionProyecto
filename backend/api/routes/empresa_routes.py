from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from dependencies.auth_dependencies import get_current_user
from services.empresa_service import EmpresaService
from models.Empresa import EmpresaCreate, EmpresaRead, EmpresaUpdate

router = APIRouter()

@router.post("/", response_model=EmpresaRead, status_code=status.HTTP_201_CREATED)
def create_empresa(
    empresa: EmpresaCreate,
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    is_superadmin = current_user.get("is_superadmin", False)
    # If not superadmin, check if they are a valid vendedor (or user)
    # We pass current_user['id'] to service to enforce assignment if needed
    user_id = current_user.get("id")
    
    
    # Permission Check: Only Superadmin or Vendedor can create/manage companies
    if not is_superadmin and not current_user.get("is_vendedor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos suficientes para realizar esta acción"
        )

    return service.create_empresa(empresa, user_id, is_superadmin)

@router.get("/", response_model=List[EmpresaRead])
def list_empresas(
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    is_superadmin = current_user.get("is_superadmin", False)
    
    if not is_superadmin and not current_user.get("is_vendedor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para listar empresas"
        )
        
    user_id = current_user.get("id")
    return service.list_empresas(user_id, is_superadmin)

@router.get("/{empresa_id}", response_model=EmpresaRead)
def get_empresa(
    empresa_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    is_superadmin = current_user.get("is_superadmin", False)
    
    if not is_superadmin and not current_user.get("is_vendedor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver esta empresa"
        )
        
    user_id = current_user.get("id")
    return service.get_empresa(empresa_id, user_id, is_superadmin)

@router.put("/{empresa_id}", response_model=EmpresaRead)
def update_empresa(
    empresa_id: UUID,
    empresa_update: EmpresaUpdate,
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    is_superadmin = current_user.get("is_superadmin", False)
    
    if not is_superadmin and not current_user.get("is_vendedor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para editar esta empresa"
        )

    user_id = current_user.get("id")
    return service.update_empresa(empresa_id, empresa_update, user_id, is_superadmin)

@router.delete("/{empresa_id}", status_code=status.HTTP_200_OK)
def delete_empresa(
    empresa_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    is_superadmin = current_user.get("is_superadmin", False)
    
    if not is_superadmin and not current_user.get("is_vendedor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar esta empresa"
        )

    user_id = current_user.get("id")
    service.delete_empresa(empresa_id, user_id, is_superadmin)
    return {"message": "Empresa eliminada exitosamente"}

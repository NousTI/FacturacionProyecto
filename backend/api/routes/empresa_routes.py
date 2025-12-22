from fastapi import APIRouter, Depends, status
from typing import List, Optional
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
    return service.create_empresa(empresa, current_user)

@router.get("/", response_model=List[EmpresaRead])
def list_empresas(
    vendedor_id: Optional[UUID] = None,
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    return service.list_empresas(current_user, vendedor_id)

@router.get("/{empresa_id}", response_model=EmpresaRead)
def get_empresa(
    empresa_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    return service.get_empresa(empresa_id, current_user)

@router.put("/{empresa_id}", response_model=EmpresaRead)
def update_empresa(
    empresa_id: UUID,
    empresa_update: EmpresaUpdate,
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    return service.update_empresa(empresa_id, empresa_update, current_user)

@router.delete("/{empresa_id}", status_code=status.HTTP_200_OK)
def delete_empresa(
    empresa_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    service.delete_empresa(empresa_id, current_user)
    return {"message": "Empresa eliminada exitosamente"}

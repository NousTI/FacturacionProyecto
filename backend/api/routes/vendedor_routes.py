from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from uuid import UUID
from dependencies.auth_dependencies import get_current_user
from services.vendedor_service import VendedorService
from models.Vendedor import VendedorCreate, VendedorRead, VendedorUpdate

router = APIRouter()

@router.post("/", response_model=VendedorRead, status_code=status.HTTP_201_CREATED)
def create_vendedor(
    vendedor: VendedorCreate,
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    return service.create_vendedor(vendedor, current_user)

@router.get("/me", response_model=VendedorRead)
def get_current_vendedor_profile(
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    return service.get_profile(current_user)

@router.get("/", response_model=List[VendedorRead])
def get_all_vendedores(
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    return service.get_all_vendedores(current_user)

@router.get("/{vendedor_id}", response_model=VendedorRead)
def get_vendedor(
    vendedor_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    return service.get_vendedor(vendedor_id, current_user)

@router.put("/{vendedor_id}", response_model=VendedorRead)
def update_vendedor(
    vendedor_id: UUID,
    vendedor_update: VendedorUpdate,
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    return service.update_vendedor(vendedor_id, vendedor_update, current_user)

@router.delete("/{vendedor_id}", status_code=status.HTTP_200_OK)
def delete_vendedor(
    vendedor_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: VendedorService = Depends()
):
    service.delete_vendedor(vendedor_id, current_user)
    return {"message": "Vendedor eliminado exitosamente"}

from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from uuid import UUID

from models.Comision import ComisionRead, ComisionUpdate, ComisionCreate
from services.comision_service import ComisionService
from dependencies.auth_dependencies import get_current_user
from repositories.comision_repository import ComisionRepository
from utils.enums import AuthKeys

router = APIRouter()

@router.get("/", response_model=List[ComisionRead])
def list_comisiones(
    current_user: dict = Depends(get_current_user),
    service: ComisionService = Depends()
):
    return service.list_comisiones(current_user)

@router.get("/{comision_id}", response_model=ComisionRead)
def get_comision(
    comision_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: ComisionService = Depends()
):
    return service.get_comision(comision_id, current_user)

@router.post("/", response_model=ComisionRead, status_code=status.HTTP_201_CREATED)
def create_comision(
    comision: ComisionCreate,
    current_user: dict = Depends(get_current_user),
    service: ComisionService = Depends()
):
    return service.create_manual(comision, current_user)

@router.put("/{comision_id}", response_model=ComisionRead)
def update_comision(
    comision_id: UUID,
    update_data: ComisionUpdate,
    current_user: dict = Depends(get_current_user),
    service: ComisionService = Depends()
):
    return service.update(comision_id, update_data, current_user)

@router.delete("/{comision_id}")
def delete_comision(
    comision_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: ComisionService = Depends()
):
    service.delete(comision_id, current_user)
    return {"message": "Comisión eliminada correctamente"}

from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from uuid import UUID

from models.Plan import PlanCreate, PlanRead, PlanUpdate
from services.plan_service import PlanService
from dependencies.superadmin_dependencies import get_current_superadmin

router = APIRouter()

@router.put("/reorder", status_code=status.HTTP_200_OK)
def reorder_plans(
    order_updates: List[dict],
    service: PlanService = Depends(),
    current_superadmin = Depends(get_current_superadmin)
):
    """
    Recibe una lista de objetos { "id": "uuid", "orden": int }
    Actualiza el orden de los planes en bloque.
    """
    service.reorder_plans(order_updates)
    return {"message": "Orden actualizado correctamente"}

@router.post("/", response_model=PlanRead, status_code=status.HTTP_201_CREATED)
def create_plan(
    plan: PlanCreate,
    service: PlanService = Depends(),
    current_superadmin = Depends(get_current_superadmin) # Restricted to superadmin
):
    return service.create_plan(plan)

@router.get("/", response_model=List[PlanRead])
def list_plans(
    service: PlanService = Depends(),
    current_superadmin = Depends(get_current_superadmin) # Restricted to superadmin as per request
):
    return service.list_plans()

@router.get("/{plan_id}", response_model=PlanRead)
def get_plan(
    plan_id: UUID,
    service: PlanService = Depends(),
    current_superadmin = Depends(get_current_superadmin) # Restricted to superadmin
):
    return service.get_plan(plan_id)

@router.put("/{plan_id}", response_model=PlanRead)
def update_plan(
    plan_id: UUID,
    plan_update: PlanUpdate,
    service: PlanService = Depends(),
    current_superadmin = Depends(get_current_superadmin) # Restricted to superadmin
):
    return service.update_plan(plan_id, plan_update)

@router.delete("/{plan_id}", status_code=status.HTTP_200_OK)
def delete_plan(
    plan_id: UUID,
    service: PlanService = Depends(),
    current_superadmin = Depends(get_current_superadmin) # Restricted to superadmin
):
    service.delete_plan(plan_id)
    return {"message": "Plan eliminado correctamente"}

@router.get("/{plan_id}/companies", response_model=List[dict])
def get_plan_companies(
    plan_id: UUID,
    service: PlanService = Depends(),
    current_superadmin = Depends(get_current_superadmin)
):
    return service.get_companies_by_plan(plan_id)

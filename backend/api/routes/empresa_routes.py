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

@router.patch("/{empresa_id}/toggle-active", response_model=EmpresaRead)
def toggle_active_empresa(
    empresa_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    """
    Alterna el estado ACTIVO de una empresa.
    Exclusivo para Superadmin.
    """
    return service.toggle_active(empresa_id, current_user)

from fastapi import Body

@router.patch("/{empresa_id}/assign-vendor", response_model=EmpresaRead)
def assign_vendor_empresa(
    empresa_id: UUID,
    vendedor_payload: dict = Body(..., example={"vendedor_id": "uuid"}),
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    """
    Asigna o cambia el vendedor de una empresa.
    Exclusivo para Superadmin.
    """
    # Validamos que al menos se envíe la clave en el JSON
    if "vendedor_id" not in vendedor_payload:
         from fastapi import HTTPException
         raise HTTPException(status_code=400, detail="vendedor_id es requerido en el payload")
    
    vendedor_id = vendedor_payload.get("vendedor_id")
    # Nota: Si vendedor_id es None, se desasigna el vendedor.
         
    return service.assign_vendor(empresa_id, vendedor_id, current_user)

@router.post("/{empresa_id}/change-plan", status_code=status.HTTP_200_OK)
def change_plan_empresa(
    empresa_id: UUID,
    plan_payload: dict = Body(..., example={"plan_id": "uuid"}),
    current_user: dict = Depends(get_current_user),
    service: EmpresaService = Depends()
):
    """
    Cambia el plan de suscripción de una empresa (Superadmin).
    Crea un registro en pago_suscripcion.
    """
    if "plan_id" not in plan_payload:
         from fastapi import HTTPException
         raise HTTPException(status_code=400, detail="plan_id es requerido en el payload")
    
    plan_id = plan_payload.get("plan_id")
    return service.change_plan(empresa_id, plan_id, current_user)

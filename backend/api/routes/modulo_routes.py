from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from services.modulo_service import ModuloService
from models.Modulo import ModuloCreate, ModuloRead, ModuloUpdate, ModuloPlanCreate, ModuloPlanRead, ModuloEmpresaRead, ModuloPlanUpdate, ModuloEmpresaCreate, ModuloEmpresaUpdate
from dependencies.auth_dependencies import get_current_user
from utils.enums import PermissionCodes, AuthKeys

router = APIRouter(prefix="/api/modulos", tags=["Modulos"])

@router.get("/", response_model=List[ModuloRead])
def list_modulos(
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    # Available for Superadmins (manage) AND Users with permission
    permissions = current_user.get('permissions', [])
    if not current_user.get(AuthKeys.IS_SUPERADMIN) and PermissionCodes.MODULO_VER not in permissions:
         raise HTTPException(status_code=403, detail="No tiene permisos para ver módulos")
         
    return service.list_all()


# --- All Assignments (Superadmin sees all, User sees own) ---
@router.get("/assignments", response_model=List[ModuloEmpresaRead])
def list_modulo_assignments(
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
    permissions = current_user.get('permissions', [])
    empresa_id = current_user.get('empresa_id')

    # 1. Superadmin -> View All
    if is_superadmin:
        return service.get_all_assignments()

    # 2. Regular User -> View Own (if has permission)
    # The user request specifically mentioned verifying permissions from enums.py
    if PermissionCodes.MODULO_VER in permissions:
        if not empresa_id:
             raise HTTPException(status_code=400, detail="Usuario no asociado a una empresa")
        return service.get_modules_for_empresa(empresa_id)

    # 3. Deny access
    raise HTTPException(status_code=403, detail="No tiene permisos para ver asignaciones de módulos")

@router.get("/{id}", response_model=ModuloRead)
def get_modulo(
    id: UUID,
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    return service.get_by_id(id)

@router.post("/", response_model=ModuloRead)
def create_modulo(
    modulo: ModuloCreate,
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    # Only Superadmin
    if not current_user.get(AuthKeys.IS_SUPERADMIN):
         # Or check permission MODULO_GESTIONAR
         permissions = current_user.get('permissions', [])
         if PermissionCodes.MODULO_GESTIONAR not in permissions and not current_user.get('role') == 'superadmin':
             raise HTTPException(status_code=403, detail="Requiere permiso de Superadmin")
    
    return service.create(modulo)

@router.put("/{id}", response_model=ModuloRead)
def update_modulo(
    id: UUID,
    modulo: ModuloUpdate,
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    if not current_user.get(AuthKeys.IS_SUPERADMIN):
         raise HTTPException(status_code=403, detail="Requiere permiso de Superadmin")
    return service.update(id, modulo)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_modulo(
    id: UUID,
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    if not current_user.get(AuthKeys.IS_SUPERADMIN):
         raise HTTPException(status_code=403, detail="Requiere permiso de Superadmin")
    service.delete(id)
    return {"message": "Módulo eliminado correctamente"}

# --- Plan Context Routes (Could be here or in plan routes) ---
@router.post("/plans/{plan_id}/assign", response_model=ModuloPlanRead)
def assign_modulo_to_plan(
    plan_id: UUID,
    assignment: ModuloPlanCreate,
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    if not current_user.get(AuthKeys.IS_SUPERADMIN):
         raise HTTPException(status_code=403, detail="Requiere permiso de Superadmin")
    
    return service.add_to_plan(plan_id, assignment)

@router.put("/plans/{plan_id}/modulos/{modulo_id}", response_model=ModuloPlanRead)
def update_modulo_in_plan(
    plan_id: UUID,
    modulo_id: UUID,
    data: ModuloPlanUpdate, 
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    if not current_user.get(AuthKeys.IS_SUPERADMIN):
         raise HTTPException(status_code=403, detail="Requiere permiso de Superadmin")
    
    # Construct complete data for service which expects Create/Full object
    # We use ModuloPlanCreate internally
    full_data = ModuloPlanCreate(modulo_id=modulo_id, incluido=data.incluido)
    
    return service.add_to_plan(plan_id, full_data)

@router.delete("/plans/{plan_id}/modulos/{modulo_id}", status_code=status.HTTP_200_OK)
def remove_modulo_from_plan(
    plan_id: UUID,
    modulo_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    if not current_user.get(AuthKeys.IS_SUPERADMIN):
         raise HTTPException(status_code=403, detail="Requiere permiso de Superadmin")
    
    service.remove_from_plan(plan_id, modulo_id)
    return {"message": "Módulo removido del plan correctamente"}

@router.get("/plans/{plan_id}", response_model=List[ModuloPlanRead])
def get_plan_modules(
    plan_id: UUID, 
    service: ModuloService = Depends(),
    _ = Depends(get_current_user)
):
    return service.get_by_plan(plan_id)

# --- My Modules ---
@router.get("/me", response_model=List[ModuloEmpresaRead])
def get_my_modules(
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    empresa_id = current_user.get('empresa_id')
    if not empresa_id:
         raise HTTPException(status_code=400, detail="Usuario no asociado a una empresa")
         
    return service.get_my_modules(empresa_id)

# --- Manual Management for Companies (Superadmin Only) ---
@router.get("/empresas/{empresa_id}/modulos", response_model=List[ModuloEmpresaRead])
def get_empresa_modulos_admin(
    empresa_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    check_empresa_id = current_user.get('empresa_id')
    permissions = current_user.get('permissions', [])
    is_superadmin = current_user.get(AuthKeys.IS_SUPERADMIN)
    
    # 1. Superadmin can see all
    if is_superadmin:
        return service.get_modules_for_empresa(empresa_id)
        
    # 2. User can see OWN if has permission
    # NOTE: PermissionCode check logic - reusing checks
    if PermissionCodes.MODULO_VER in permissions:
        # Check if requested empresa_id matches user's empresa_id
        if str(check_empresa_id) != str(empresa_id):
             raise HTTPException(status_code=403, detail="No puede ver módulos de otra empresa")
        return service.get_modules_for_empresa(empresa_id)
    
    # 3. Deny everyone else
    raise HTTPException(status_code=403, detail="Requiere permiso de Superadmin o MODULO_VER")

@router.post("/empresas/{empresa_id}/modulos", response_model=ModuloEmpresaRead)
def assign_modulo_manually(
    empresa_id: UUID,
    assignment: ModuloEmpresaCreate,
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    if not current_user.get(AuthKeys.IS_SUPERADMIN):
         raise HTTPException(status_code=403, detail="Requiere permiso de Superadmin")
         
    return service.add_modulo_to_empresa(
        empresa_id, 
        assignment.modulo_id, 
        assignment.activo, 
        assignment.fecha_vencimiento
    )

@router.put("/empresas/{empresa_id}/modulos/{modulo_id}", response_model=ModuloEmpresaRead)
def update_modulo_empresa(
    empresa_id: UUID,
    modulo_id: UUID,
    data: ModuloEmpresaUpdate,
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    if not current_user.get(AuthKeys.IS_SUPERADMIN):
         raise HTTPException(status_code=403, detail="Requiere permiso de Superadmin")
         
    return service.update_modulo_empresa(
        empresa_id, 
        modulo_id, 
        data.activo, 
        data.fecha_vencimiento
    )

@router.delete("/empresas/{empresa_id}/modulos/{modulo_id}", status_code=status.HTTP_200_OK)
def revoke_modulo_empresa(
    empresa_id: UUID,
    modulo_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: ModuloService = Depends()
):
    if not current_user.get(AuthKeys.IS_SUPERADMIN):
         raise HTTPException(status_code=403, detail="Requiere permiso de Superadmin")
         
    service.remove_modulo_from_empresa(empresa_id, modulo_id)
    return {"message": "Módulo revocado de la empresa correctamente"}

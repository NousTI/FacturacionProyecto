from fastapi import APIRouter, Depends, status, Query, HTTPException
from uuid import UUID
from typing import Optional, List

from services.configuracion_sri_service import ConfiguracionSRIService
from models.ConfiguracionSRI import ConfiguracionSRIRead, ConfiguracionSRIUpdate, ConfiguracionSRICreate
from dependencies.auth_dependencies import get_current_user, require_permission
from dependencies.superadmin_dependencies import get_current_superadmin
from utils.enums import PermissionCodes, AuthKeys

router = APIRouter()

@router.post("/", response_model=ConfiguracionSRIRead, status_code=status.HTTP_201_CREATED)
def create_config(
    data: ConfiguracionSRICreate,
    current_admin=Depends(get_current_superadmin),
    service: ConfiguracionSRIService = Depends()
):
    """
    [Superadmin] Crear configuración inicial para una empresa.
    """
    # Current Admin is dict or model, ensuring it has IS_SUPERADMIN flag if Service checks it
    # or Service just checks IS_SUPERADMIN key. 
    # get_current_superadmin returns the model or dict? Usually model.
    # Service expects dict with AuthKeys.IS_SUPERADMIN.
    # We'll pass a constructed dict or rely on service.
    
    # Adapter for service expecting dict with rights
    admin_dict = {AuthKeys.IS_SUPERADMIN: True}
    return service.create_config(admin_dict, data)

@router.get("/all", response_model=List[ConfiguracionSRIRead])
def get_all_configs(
    current_admin=Depends(get_current_superadmin),
    service: ConfiguracionSRIService = Depends()
):
    """
    [Superadmin] Listar todas las configuraciones.
    """
    return service.get_all()

@router.get("/{empresa_id}", response_model=Optional[ConfiguracionSRIRead])
def get_config_by_id(
    empresa_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: ConfiguracionSRIService = Depends()
):
    """
    Obtener configuración por ID de Empresa.
    """
    return service.get_config(current_user, empresa_id)

@router.get("/", response_model=Optional[ConfiguracionSRIRead])
def get_config_me(
    current_user: dict = Depends(get_current_user), 
    service: ConfiguracionSRIService = Depends()
):
    """
    Obtener mi configuración.
    """
    return service.get_config(current_user)

@router.put("/{empresa_id}", response_model=ConfiguracionSRIRead)
def update_config_by_id(
    empresa_id: UUID,
    data: ConfiguracionSRIUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.CONFIG_SRI_EDITAR)),
    service: ConfiguracionSRIService = Depends()
):
    """
    Actualizar configuración por ID de Empresa.
    """
    return service.update_config(current_user, data, empresa_id)

@router.put("/", response_model=ConfiguracionSRIRead)
def update_config_me(
    data: ConfiguracionSRIUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.CONFIG_SRI_EDITAR)),
    service: ConfiguracionSRIService = Depends()
):
    """
    Actualizar mi configuración.
    """
    return service.update_config(current_user, data)

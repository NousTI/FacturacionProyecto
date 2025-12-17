from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from services.proveedor_service import ProveedorService
from models.Proveedor import ProveedorCreate, ProveedorUpdate, ProveedorResponse
from dependencies.auth_dependencies import require_permission
from utils.responses import error_response, success_response

router = APIRouter()

@router.get("/", response_model=List[ProveedorResponse])
def list_providers(
    current_user: dict = Depends(require_permission("PROVEEDOR_VER")),
    service: ProveedorService = Depends()
):
    return service.listar_proveedores(current_user)

@router.get("/{provider_id}", response_model=ProveedorResponse)
def get_provider(
    provider_id: UUID,
    current_user: dict = Depends(require_permission("PROVEEDOR_VER")),
    service: ProveedorService = Depends()
):
    provider = service.obtener_proveedor(provider_id, current_user)
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return provider

@router.post("/", response_model=ProveedorResponse)
def create_provider(
    provider: ProveedorCreate,
    current_user: dict = Depends(require_permission("PROVEEDOR_CREAR")),
    service: ProveedorService = Depends()
):
    result = service.crear_proveedor(provider, current_user)
    
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.put("/{provider_id}", response_model=ProveedorResponse)
def update_provider(
    provider_id: UUID,
    provider: ProveedorUpdate,
    current_user: dict = Depends(require_permission("PROVEEDOR_EDITAR")),
    service: ProveedorService = Depends()
):
    result = service.actualizar_proveedor(provider_id, provider, current_user)
    
    if result is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.delete("/{provider_id}")
def delete_provider(
    provider_id: UUID,
    current_user: dict = Depends(require_permission("PROVEEDOR_ELIMINAR")),
    service: ProveedorService = Depends()
):
    result = service.eliminar_proveedor(provider_id, current_user)
    
    if result is None:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
        
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return success_response("Proveedor eliminado correctamente")

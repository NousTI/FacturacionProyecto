from fastapi import APIRouter, Depends, HTTPException
from typing import List
from services.proveedor_service import ProveedorService
from models.Proveedor import ProveedorCreate, ProveedorResponse
from dependencies.auth_dependencies import require_permission
from utils.responses import error_response

router = APIRouter(
    tags=["Proveedores"]
)

@router.get("/", response_model=List[ProveedorResponse], dependencies=[Depends(require_permission("providers:read"))])
def list_providers(service: ProveedorService = Depends()):
    return service.listar_proveedores()

@router.get("/{provider_id}", response_model=ProveedorResponse, dependencies=[Depends(require_permission("providers:read"))])
def get_provider(provider_id: int, service: ProveedorService = Depends()):
    provider = service.obtener_proveedor(provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail=error_response(404, "Proveedor no encontrado"))
    return provider

@router.post("/", response_model=ProveedorResponse, dependencies=[Depends(require_permission("providers:create"))])
def create_provider(provider: ProveedorCreate, service: ProveedorService = Depends()):
    result = service.crear_proveedor(provider)
    if not result:
         raise HTTPException(status_code=400, detail=error_response(400, "Error al crear proveedor"))
    if "error" in result:
        raise HTTPException(status_code=400, detail=error_response(400, result["error"]))
    return result

@router.put("/{provider_id}", response_model=ProveedorResponse, dependencies=[Depends(require_permission("providers:update"))])
def update_provider(provider_id: int, provider: ProveedorCreate, service: ProveedorService = Depends()):
    result = service.actualizar_proveedor(provider_id, provider)
    if not result:
        raise HTTPException(status_code=404, detail=error_response(404, "Proveedor no encontrado"))
    if "error" in result:
        raise HTTPException(status_code=400, detail=error_response(400, result["error"]))
    return result

@router.delete("/{provider_id}", dependencies=[Depends(require_permission("providers:delete"))])
def delete_provider(provider_id: int, service: ProveedorService = Depends()):
    result = service.eliminar_proveedor(provider_id)
    if not result:
        raise HTTPException(status_code=404, detail=error_response(404, "Proveedor no encontrado"))
    if "error" in result:
        raise HTTPException(status_code=400, detail=error_response(400, result["error"]))
    return {"message": "Proveedor eliminado correctamente"}

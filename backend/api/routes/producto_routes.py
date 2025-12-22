from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from services.producto_service import ProductoService
from models.Producto import ProductoCreate, ProductoUpdate, ProductoResponse
from dependencies.auth_dependencies import require_permission
from utils.responses import error_response, success_response
from utils.enums import PermissionCodes

router = APIRouter()

@router.get("/", response_model=List[ProductoResponse])
def list_products(
    nombre: str = None, 
    codigo: str = None, 
    current_user: dict = Depends(require_permission(PermissionCodes.PRODUCTO_VER)),
    service: ProductoService = Depends()
):
    return service.listar_productos(current_user, nombre, codigo)

@router.get("/{product_id}", response_model=ProductoResponse)
def get_product(
    product_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.PRODUCTO_VER)), 
    service: ProductoService = Depends()
):
    product = service.obtener_producto(product_id, current_user)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.post("/", response_model=ProductoResponse)
def create_product(
    product: ProductoCreate,
    current_user: dict = Depends(require_permission(PermissionCodes.PRODUCTO_CREAR)),
    service: ProductoService = Depends()
):
    result = service.crear_producto(product, current_user)
    
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.put("/{product_id}", response_model=ProductoResponse)
def update_product(
    product_id: UUID,
    product: ProductoUpdate,
    current_user: dict = Depends(require_permission(PermissionCodes.PRODUCTO_EDITAR)),
    service: ProductoService = Depends()
):
    result = service.actualizar_producto(product_id, product, current_user)
    if result is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return result

@router.delete("/{product_id}")
def delete_product(
    product_id: UUID,
    current_user: dict = Depends(require_permission(PermissionCodes.PRODUCTO_ELIMINAR)),
    service: ProductoService = Depends()
):
    result = service.eliminar_producto(product_id, current_user)
    
    if result is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
        
    return success_response("Producto eliminado correctamente")

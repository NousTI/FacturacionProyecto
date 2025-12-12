from fastapi import APIRouter, Depends, HTTPException
from typing import List
from services.producto_service import ProductoService
from models.Producto import ProductoCreate, ProductoUpdate, ProductoResponse
from dependencies.auth_dependencies import require_permission
from utils.responses import error_response

router = APIRouter(
    tags=["Productos"]
)

@router.get("/", response_model=List[ProductoResponse], dependencies=[Depends(require_permission("products:read"))])
def list_products(
    nombre: str = None, 
    codigo: str = None, 
    service: ProductoService = Depends()
):
    return service.listar_productos(nombre, codigo)

@router.get("/{product_id}", response_model=ProductoResponse, dependencies=[Depends(require_permission("products:read"))])
def get_product(product_id: int, service: ProductoService = Depends()):
    product = service.obtener_producto(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=error_response(404, "Producto no encontrado"))
    return product

@router.post("/", response_model=ProductoResponse, dependencies=[Depends(require_permission("products:create"))])
def create_product(product: ProductoCreate, service: ProductoService = Depends()):
    result = service.crear_producto(product)
    if not result:
         raise HTTPException(status_code=400, detail=error_response(400, "Error al crear producto"))
    if "error" in result:
        raise HTTPException(status_code=400, detail=error_response(400, result["error"]))
    return result

@router.put("/{product_id}", response_model=ProductoResponse, dependencies=[Depends(require_permission("products:update"))])
def update_product(product_id: int, product: ProductoUpdate, service: ProductoService = Depends()):
    result = service.actualizar_producto(product_id, product)
    if not result:
        raise HTTPException(status_code=404, detail=error_response(404, "Producto no encontrado"))
    if "error" in result:
        raise HTTPException(status_code=400, detail=error_response(400, result["error"]))
    return result

@router.delete("/{product_id}", dependencies=[Depends(require_permission("products:delete"))])
def delete_product(product_id: int, service: ProductoService = Depends()):
    result = service.eliminar_producto(product_id)
    if not result:
        raise HTTPException(status_code=404, detail=error_response(404, "Producto no encontrado"))
    if "error" in result:
        raise HTTPException(status_code=400, detail=error_response(400, result["error"]))
    return {"message": "Producto eliminado correctamente"}

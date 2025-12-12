from typing import Optional
from pydantic import BaseModel

class ProductoBase(BaseModel):
    fk_proveedor: Optional[int] = None
    nombre_producto: str
    descripcion: Optional[str] = None
    costo_unitario: float
    stock: int = 0
    codigo_producto: str

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    fk_proveedor: Optional[int] = None
    nombre_producto: Optional[str] = None
    descripcion: Optional[str] = None
    costo_unitario: Optional[float] = None
    stock: Optional[int] = None
    codigo_producto: Optional[str] = None

class ProductoResponse(ProductoBase):
    id: int

    model_config = {
        "from_attributes": True
    }

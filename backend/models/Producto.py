from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ProductoBase(BaseModel):
    proveedor_id: UUID
    nombre: str
    descripcion: Optional[str] = None
    costo_unitario: float
    stock: int = 0
    codigo_producto: str
    activo: Optional[bool] = True

class ProductoCreate(ProductoBase):
    empresa_id: Optional[UUID] = None # Injected by Service

class ProductoUpdate(BaseModel):
    proveedor_id: Optional[UUID] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    costo_unitario: Optional[float] = None
    stock: Optional[int] = None
    codigo_producto: Optional[str] = None
    activo: Optional[bool] = None

class ProductoResponse(ProductoBase):
    id: UUID
    empresa_id: UUID
    nombre_proveedor: Optional[str] = None # Added for convenience in listing
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

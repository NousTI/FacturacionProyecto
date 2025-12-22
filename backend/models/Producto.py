from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class ProductoBase(BaseModel):
    empresa_id: Optional[UUID] = None # Will be injected or validated
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    
    precio: float
    costo: float
    
    stock_actual: int = 0
    stock_minimo: int = 0
    
    tipo_iva: str
    porcentaje_iva: float
    
    maneja_inventario: bool = True
    
    tipo: Optional[str] = None
    unidad_medida: Optional[str] = None
    
    activo: bool = True

class ProductoCreate(ProductoBase):
    empresa_id: Optional[UUID] = None # Injected by Service

class ProductoUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    
    precio: Optional[float] = None
    costo: Optional[float] = None
    
    stock_actual: Optional[int] = None
    stock_minimo: Optional[int] = None
    
    tipo_iva: Optional[str] = None
    porcentaje_iva: Optional[float] = None
    
    maneja_inventario: Optional[bool] = None
    
    tipo: Optional[str] = None
    unidad_medida: Optional[str] = None
    
    activo: Optional[bool] = None

class ProductoResponse(ProductoBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

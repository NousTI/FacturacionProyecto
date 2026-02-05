from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

class ProductoBase(BaseModel):
    empresa_id: Optional[UUID] = None
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    precio: float = Field(..., ge=0)
    costo: Optional[float] = Field(None, ge=0)
    stock_actual: float = Field(0, ge=0)
    stock_minimo: float = Field(0, ge=0)
    tipo_iva: str
    porcentaje_iva: float
    maneja_inventario: bool = True
    tipo: Optional[str] = None
    unidad_medida: Optional[str] = None
    activo: bool = True

class ProductoCreacion(ProductoBase):
    pass

class ProductoActualizacion(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(None, ge=0)
    costo: Optional[float] = Field(None, ge=0)
    stock_actual: Optional[int] = Field(None, ge=0)
    stock_minimo: Optional[int] = Field(None, ge=0)
    tipo_iva: Optional[str] = None
    porcentaje_iva: Optional[float] = None
    maneja_inventario: Optional[bool] = None
    tipo: Optional[str] = None
    unidad_medida: Optional[str] = None
    activo: Optional[bool] = None

class ProductoLectura(ProductoBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

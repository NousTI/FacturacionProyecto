from uuid import UUID
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field

class FacturaDetalleBase(BaseModel):
    factura_id: UUID
    producto_id: Optional[UUID] = None
    codigo_producto: str
    descripcion: str
    cantidad: int = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0)
    descuento: Decimal = Field(default=Decimal(0), ge=0)
    subtotal: Decimal
    tipo_iva: str = '12'
    valor_iva: Decimal
    costo_unitario: Optional[Decimal] = None

class FacturaDetalleCreacion(FacturaDetalleBase):
    pass

class FacturaDetalleActualizacion(BaseModel):
    codigo_producto: Optional[str] = None
    descripcion: Optional[str] = None
    cantidad: Optional[int] = Field(None, gt=0)
    precio_unitario: Optional[Decimal] = Field(None, ge=0)
    descuento: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    tipo_iva: Optional[str] = None
    valor_iva: Optional[Decimal] = None

class FacturaDetalleLectura(FacturaDetalleBase):
    id: UUID

    class Config:
        from_attributes = True

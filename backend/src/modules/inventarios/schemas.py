from uuid import UUID
from datetime import datetime
from typing import Optional, Literal
from decimal import Decimal
from pydantic import BaseModel, Field

class MovimientoInventarioBase(BaseModel):
    producto_id: UUID
    tipo_movimiento: Literal['entrada', 'salida', 'ajuste', 'devolucion']
    cantidad: int = Field(..., gt=0)
    costo_unitario: Optional[Decimal] = Field(None, ge=0)
    costo_total: Optional[Decimal] = Field(None, ge=0)
    documento_referencia: Optional[str] = None
    observaciones: Optional[str] = None
    factura_id: Optional[UUID] = None

class MovimientoInventarioCreacion(MovimientoInventarioBase):
    usuario_id: Optional[UUID] = None

class MovimientoInventarioLectura(MovimientoInventarioBase):
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    stock_anterior: int
    stock_nuevo: int
    fecha_movimiento: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

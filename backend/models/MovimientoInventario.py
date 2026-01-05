from uuid import UUID
from datetime import datetime
from typing import Optional, Literal
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

class MovimientoInventarioBase(BaseModel):
    producto_id: UUID
    tipo_movimiento: Literal['entrada', 'salida', 'ajuste', 'devolucion']
    cantidad: int = Field(..., gt=0)
    costo_unitario: Optional[Decimal] = Field(None, ge=0)
    costo_total: Optional[Decimal] = Field(None, ge=0)
    documento_referencia: Optional[str] = None
    observaciones: Optional[str] = None
    factura_id: Optional[UUID] = None

class MovimientoInventarioCreate(MovimientoInventarioBase):
    usuario_id: Optional[UUID] = None # Optional, mandatory for Superadmin

class MovimientoInventarioRead(MovimientoInventarioBase):
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    stock_anterior: int
    stock_nuevo: int
    fecha_movimiento: datetime
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

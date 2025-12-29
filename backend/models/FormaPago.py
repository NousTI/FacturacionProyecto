from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class FormaPagoBase(BaseModel):
    forma_pago: str # efectivo, tarjeta, transferencia, credito
    valor: Decimal = Field(..., ge=0)
    plazo: Optional[int] = Field(0, ge=0)
    unidad_tiempo: Optional[str] = None # dias, meses

class FormaPagoCreate(FormaPagoBase):
    factura_id: UUID

class FormaPagoUpdate(BaseModel):
    forma_pago: Optional[str] = None
    valor: Optional[Decimal] = Field(None, ge=0)
    plazo: Optional[int] = Field(None, ge=0)
    unidad_tiempo: Optional[str] = None

class FormaPagoRead(FormaPagoBase):
    id: UUID
    factura_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

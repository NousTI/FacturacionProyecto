from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class FormaPagoBase(BaseModel):
    forma_pago_sri: str = Field(default='01', min_length=2, max_length=2)
    valor: Decimal = Field(..., ge=0)
    plazo: Optional[int] = Field(0, ge=0)
    unidad_tiempo: Optional[str] = None # DIAS, MESES, ANIOS

class FormaPagoCreacion(FormaPagoBase):
    factura_id: UUID

class FormaPagoActualizacion(BaseModel):
    forma_pago_sri: Optional[str] = Field(None, min_length=2, max_length=2)
    valor: Optional[Decimal] = Field(None, ge=0)
    plazo: Optional[int] = Field(None, ge=0)
    unidad_tiempo: Optional[str] = None

class FormaPagoLectura(FormaPagoBase):
    id: UUID
    factura_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

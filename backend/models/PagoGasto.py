from uuid import UUID
from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

class PagoGastoBase(BaseModel):
    gasto_id: UUID
    numero_comprobante: Optional[str] = None
    fecha_pago: date = Field(default_factory=date.today)
    monto: Decimal = Field(..., gt=0)
    metodo_pago: str
    numero_referencia: Optional[str] = None
    observaciones: Optional[str] = None

class PagoGastoCreate(PagoGastoBase):
    usuario_id: Optional[UUID] = None # Optional, mandatory for Superadmin

class PagoGastoUpdate(BaseModel):
    numero_comprobante: Optional[str] = None
    fecha_pago: Optional[date] = None
    monto: Optional[Decimal] = Field(None, gt=0)
    metodo_pago: Optional[str] = None
    numero_referencia: Optional[str] = None
    observaciones: Optional[str] = None

class PagoGastoRead(PagoGastoBase):
    id: UUID
    usuario_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

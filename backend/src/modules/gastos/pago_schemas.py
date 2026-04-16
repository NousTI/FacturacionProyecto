from uuid import UUID
from datetime import date, datetime
from typing import Optional, Literal
from decimal import Decimal
from pydantic import BaseModel, Field

class PagoGastoBase(BaseModel):
    gasto_id: UUID
    numero_comprobante: Optional[str] = None
    fecha_pago: date
    monto: Decimal = Field(..., gt=0)
    metodo_pago: Literal['01', '15', '16', '17', '18', '19', '20', '21']
    numero_referencia: Optional[str] = None
    observaciones: Optional[str] = None

class PagoGastoCreacion(PagoGastoBase):
    user_id: Optional[UUID] = None

class PagoGastoActualizacion(BaseModel):
    numero_comprobante: Optional[str] = None
    fecha_pago: Optional[date] = None
    monto: Optional[Decimal] = Field(None, gt=0)
    metodo_pago: Optional[Literal['01', '15', '16', '17', '18', '19', '20', '21']] = None
    numero_referencia: Optional[str] = None
    observaciones: Optional[str] = None

class PagoGastoLectura(PagoGastoBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

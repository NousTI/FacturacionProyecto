from uuid import UUID
from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field

class PagoGastoBase(BaseModel):
    gasto_id: UUID
    numero_comprobante: Optional[str] = None
    fecha_pago: date
    monto: Decimal = Field(..., gt=0)
    metodo_pago: str # efectivo, depósito, transferencia, cheque
    numero_referencia: Optional[str] = None
    observaciones: Optional[str] = None

class PagoGastoCreacion(PagoGastoBase):
    usuario_id: Optional[UUID] = None

class PagoGastoActualizacion(BaseModel):
    numero_comprobante: Optional[str] = None
    fecha_pago: Optional[date] = None
    monto: Optional[Decimal] = Field(None, gt=0)
    metodo_pago: Optional[str] = None
    numero_referencia: Optional[str] = None
    observaciones: Optional[str] = None

class PagoGastoLectura(PagoGastoBase):
    id: UUID
    usuario_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

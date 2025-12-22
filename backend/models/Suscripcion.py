from decimal import Decimal
from uuid import UUID
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class PagoSuscripcionBase(BaseModel):
    empresa_id: UUID
    plan_id: UUID
    monto: Decimal
    fecha_pago: datetime
    fecha_inicio_periodo: datetime
    fecha_fin_periodo: datetime
    metodo_pago: str
    estado: str = "PAGADO"
    numero_comprobante: Optional[str] = None
    comprobante_url: Optional[str] = None
    observaciones: Optional[str] = None
    registrado_por: Optional[UUID] = None

class PagoSuscripcionCreate(PagoSuscripcionBase):
    pass

class PagoSuscripcionRead(PagoSuscripcionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

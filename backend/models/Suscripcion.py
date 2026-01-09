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
    estado: str = "COMPLETED"
    numero_comprobante: Optional[str] = None
    comprobante_url: Optional[str] = None
    observaciones: Optional[str] = None
    registrado_por: Optional[UUID] = None

class PagoSuscripcionCreate(PagoSuscripcionBase):
    pass

class PagoSuscripcionRead(PagoSuscripcionBase):
    id: UUID
    empresa_nombre: Optional[str] = None
    plan_nombre: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PagoSuscripcionQuick(BaseModel):
    empresa_id: UUID
    plan_id: UUID
    metodo_pago: str
    monto: Optional[Decimal] = None
    fecha_inicio_periodo: Optional[datetime] = None
    fecha_fin_periodo: Optional[datetime] = None
    numero_comprobante: Optional[str] = None
    observaciones: Optional[str] = None

from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import date, datetime

class ComisionBase(BaseModel):
    vendedor_id: UUID
    pago_suscripcion_id: UUID
    monto: Decimal
    porcentaje_aplicado: Decimal
    estado: str = "PENDIENTE"
    fecha_generacion: date = date.today()
    fecha_pago: Optional[date] = None
    metodo_pago: Optional[str] = None
    observaciones: Optional[str] = None

class ComisionCreacion(ComisionBase):
    pass

class ComisionActualizacion(BaseModel):
    estado: Optional[str] = None
    fecha_pago: Optional[date] = None
    metodo_pago: Optional[str] = None
    observaciones: Optional[str] = None

class ComisionLectura(ComisionBase):
    id: UUID
    vendedor_nombre: Optional[str] = None
    empresa_nombre: Optional[str] = None
    monto_pago: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

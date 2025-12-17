from uuid import UUID
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class ComisionBase(BaseModel):
    vendedor_id: UUID
    pago_suscripcion_id: UUID
    monto: float
    porcentaje_aplicado: float
    estado: str = "PENDIENTE"
    fecha_generacion: date = date.today()
    fecha_pago: Optional[date] = None
    metodo_pago: Optional[str] = None
    observaciones: Optional[str] = None

class ComisionCreate(ComisionBase):
    pass

class ComisionUpdate(BaseModel):
    estado: Optional[str] = None
    fecha_pago: Optional[date] = None
    metodo_pago: Optional[str] = None
    observaciones: Optional[str] = None

class ComisionRead(ComisionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

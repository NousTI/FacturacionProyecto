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
    aprobado_por: Optional[UUID] = None
    aprobado_por_nombre: Optional[str] = None
    fecha_aprobacion: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Audit log schemas
class ComisionLogBase(BaseModel):
    comision_id: UUID
    responsable_id: Optional[UUID] = None
    rol_responsable: str  # SUPERADMIN, SISTEMA
    estado_anterior: Optional[str] = None
    estado_nuevo: str
    datos_snapshot: Optional[dict] = None
    observaciones: Optional[str] = None

class ComisionLogLectura(ComisionLogBase):
    id: UUID
    created_at: datetime
    responsable_email: Optional[str] = None
    
    class Config:
        from_attributes = True


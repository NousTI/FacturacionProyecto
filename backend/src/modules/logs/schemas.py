from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class LogEmisionBase(BaseModel):
    facturacion_programada_id: Optional[UUID] = None
    factura_id: Optional[UUID] = None
    estado: str
    mensaje_error: Optional[str] = None
    intento_numero: int = Field(default=1, gt=0)

class LogEmisionCreacion(LogEmisionBase):
    pass

class LogEmisionLectura(LogEmisionBase):
    id: UUID
    fecha_intento: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class LogAuditoriaLectura(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    evento: str
    origen: str
    motivo: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    modulo: Optional[str] = None
    created_at: datetime
    actor_email: Optional[str] = None
    actor_nombre: Optional[str] = None

    class Config:
        from_attributes = True

from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class PuntoEmisionBase(BaseModel):
    codigo: str
    nombre: str
    secuencial_actual: int = Field(default=1, ge=1)
    activo: bool = True

class PuntoEmisionCreacion(PuntoEmisionBase):
    establecimiento_id: UUID

class PuntoEmisionActualizacion(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    secuencial_actual: Optional[int] = Field(None, ge=1)
    activo: Optional[bool] = None
    establecimiento_id: Optional[UUID] = None

class PuntoEmisionLectura(PuntoEmisionBase):
    id: UUID
    establecimiento_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

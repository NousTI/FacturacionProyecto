from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class PuntoEmisionBase(BaseModel):
    codigo: str = Field(..., pattern=r'^\d{3}$', description="Código punto de emisión SRI (001-999)")
    nombre: str
    activo: bool = True

class PuntoEmisionCreacion(PuntoEmisionBase):
    establecimiento_id: UUID

class PuntoEmisionActualizacion(BaseModel):
    codigo: Optional[str] = Field(None, pattern=r'^\d{3}$', description="Código punto de emisión SRI (001-999)")
    nombre: Optional[str] = None
    activo: Optional[bool] = None
    establecimiento_id: Optional[UUID] = None

class PuntoEmisionLectura(PuntoEmisionBase):
    id: UUID
    establecimiento_id: UUID
    establecimiento_nombre: Optional[str] = None
    secuencial_actual: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

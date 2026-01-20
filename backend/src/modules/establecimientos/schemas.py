from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class EstablecimientoBase(BaseModel):
    codigo: str
    nombre: str
    direccion: Optional[str] = None
    activo: bool = True

class EstablecimientoCreacion(EstablecimientoBase):
    empresa_id: Optional[UUID] = None

class EstablecimientoActualizacion(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None

class EstablecimientoLectura(EstablecimientoBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

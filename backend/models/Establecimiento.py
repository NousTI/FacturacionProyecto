from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# Base Model
class EstablecimientoBase(BaseModel):
    codigo: str
    nombre: str
    direccion: Optional[str] = None
    activo: bool = True

# Create Input (API)
class EstablecimientoCreateInput(EstablecimientoBase):
    empresa_id: Optional[UUID] = None

# Internal Create (Repo)
class EstablecimientoCreate(EstablecimientoBase):
    pass

# Update
class EstablecimientoUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    activo: Optional[bool] = None

# Read
class EstablecimientoRead(EstablecimientoBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

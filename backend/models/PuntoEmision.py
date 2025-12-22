from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

# Base Model
class PuntoEmisionBase(BaseModel):
    codigo: str
    nombre: str
    secuencial_actual: int = Field(default=1, ge=1)
    activo: bool = True

# Create Input (API)
class PuntoEmisionCreateInput(PuntoEmisionBase):
    establecimiento_id: UUID

# Internal Create (Repo)
class PuntoEmisionCreate(PuntoEmisionBase):
    establecimiento_id: UUID

# Update
class PuntoEmisionUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    secuencial_actual: Optional[int] = Field(None, ge=1)
    activo: Optional[bool] = None
    establecimiento_id: Optional[UUID] = None # Allow moving? Usually not common but Schema allows FK update.

# Read
class PuntoEmisionRead(PuntoEmisionBase):
    id: UUID
    establecimiento_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

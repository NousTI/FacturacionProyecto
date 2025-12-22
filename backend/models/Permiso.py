from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PermisoBase(BaseModel):
    codigo: str
    nombre: str
    modulo: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None

class PermisoCreate(PermisoBase):
    pass

class PermisoRead(PermisoBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

from uuid import UUID
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

    class Config:
        from_attributes = True

from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class RolBase(BaseModel):
    empresa_id: Optional[UUID] = None
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    es_sistema: bool = False
    activo: bool = True

class RolCreate(RolBase):
    pass

class RolRead(RolBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

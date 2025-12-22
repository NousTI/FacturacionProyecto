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

from models.Permiso import PermisoRead
from typing import List

class RolPermisoRead(PermisoRead):
    assigned_at: datetime
    assigned_updated_at: datetime
    activo: bool = True

class RolRead(RolBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    permisos: Optional[List[RolPermisoRead]] = []

    class Config:
        from_attributes = True

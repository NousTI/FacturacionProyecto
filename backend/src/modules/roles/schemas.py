from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel
from ..permisos.schemas import PermisoLectura

class RolBase(BaseModel):
    empresa_id: Optional[UUID] = None
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    es_sistema: bool = False
    activo: bool = True

class RolCreacion(RolBase):
    pass

class RolActualizacion(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

class RolPermisoLectura(PermisoLectura):
    assigned_at: datetime
    assigned_updated_at: datetime
    activo: bool = True

class RolLectura(RolBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    permisos: Optional[List[RolPermisoLectura]] = []

    class Config:
        from_attributes = True

class RolPermisoAsignacion(BaseModel):
    permiso_ids: List[UUID]

class RolPermisoAgregar(BaseModel):
    permiso_id: UUID

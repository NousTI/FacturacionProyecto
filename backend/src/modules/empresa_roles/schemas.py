from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List
from datetime import datetime

# Permisos
class PermisoBase(BaseModel):
    codigo: str
    nombre: str
    modulo: str
    descripcion: Optional[str] = None
    tipo: str  # LECTURA, ACCION, ADMIN, SISTEMA

class PermisoCreacion(PermisoBase):
    pass

class PermisoLectura(PermisoBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Roles
class RolBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    es_sistema: bool = False
    activo: bool = True

class RolCreacion(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    permiso_ids: List[UUID] = []

class RolActualizacion(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None
    permiso_ids: Optional[List[UUID]] = None

class RolLectura(RolBase):
    id: UUID
    empresa_id: UUID
    permisos: List[PermisoLectura] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

class ModuloBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    categoria: Optional[str] = None
    orden: int = 0
    activo: bool = True

class ModuloCreacion(ModuloBase):
    pass

class ModuloActualizacion(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    categoria: Optional[str] = None
    orden: Optional[int] = None
    activo: Optional[bool] = None

class ModuloLectura(ModuloBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# --- Modulo Plan ---
class ModuloPlanCreacion(BaseModel):
    modulo_id: UUID
    incluido: bool = True

class ModuloPlanLectura(BaseModel):
    plan_id: UUID
    modulo_id: UUID
    incluido: bool
    modulo_nombre: Optional[str] = None
    modulo_codigo: Optional[str] = None

# --- Modulo Empresa ---
class ModuloEmpresaCreacion(BaseModel):
    modulo_id: UUID
    activo: bool = True
    fecha_vencimiento: Optional[date] = None

class ModuloEmpresaLectura(BaseModel):
    empresa_id: UUID
    modulo_id: UUID
    activo: bool
    fecha_activacion: date
    fecha_vencimiento: Optional[date]
    modulo_nombre: Optional[str] = None
    modulo_codigo: Optional[str] = None
    modulo_icono: Optional[str] = None

from pydantic import BaseModel, Field
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

class ModuloCreate(ModuloBase):
    pass

class ModuloUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    categoria: Optional[str] = None
    orden: Optional[int] = None
    activo: Optional[bool] = None

class ModuloRead(ModuloBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# --- Modulo Plan ---
class ModuloPlanCreate(BaseModel):
    modulo_id: UUID
    incluido: bool = True

class ModuloPlanUpdate(BaseModel):
    incluido: bool = True
    modulo_id: Optional[UUID] = None # Optional because it may come from URL

class ModuloPlanRead(BaseModel):
    plan_id: UUID
    modulo_id: UUID
    incluido: bool
    # We might want to join details
    modulo_nombre: Optional[str] = None
    modulo_codigo: Optional[str] = None

# --- Modulo Empresa ---
class ModuloEmpresaCreate(BaseModel):
    modulo_id: UUID
    activo: bool = True
    fecha_vencimiento: Optional[date] = None

class ModuloEmpresaUpdate(BaseModel):
    activo: Optional[bool] = None
    fecha_vencimiento: Optional[date] = None

class ModuloEmpresaRead(BaseModel):
    empresa_id: UUID
    modulo_id: UUID
    activo: bool
    fecha_activacion: date
    fecha_vencimiento: Optional[date]
    
    modulo_nombre: Optional[str] = None
    modulo_codigo: Optional[str] = None
    modulo_icono: Optional[str] = None

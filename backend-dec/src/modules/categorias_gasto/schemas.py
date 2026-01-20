from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class CategoriaGastoBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    tipo: str  # fijo | variable | operativo | financiero
    activo: bool = True

class CategoriaGastoCreacion(CategoriaGastoBase):
    empresa_id: Optional[UUID] = None

class CategoriaGastoActualizacion(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    activo: Optional[bool] = None

class CategoriaGastoLectura(CategoriaGastoBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class EstablecimientoBase(BaseModel):
    codigo: str = Field(..., pattern=r'^\d{3}$', description="Código de establecimiento SRI (001-999)")
    nombre: str
    direccion: str = Field(..., min_length=1, description="Dirección del establecimiento")
    activo: bool = True

class EstablecimientoCreacion(EstablecimientoBase):
    empresa_id: Optional[UUID] = None

class EstablecimientoActualizacion(BaseModel):
    codigo: Optional[str] = Field(None, pattern=r'^\d{3}$', description="Código de establecimiento SRI (001-999)")
    nombre: Optional[str] = None
    direccion: Optional[str] = Field(None, min_length=1, description="Dirección del establecimiento")
    activo: Optional[bool] = None

class EstablecimientoLectura(EstablecimientoBase):
    id: UUID
    empresa_id: UUID
    puntos_emision_total: int = 0
    ultimo_secuencial: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

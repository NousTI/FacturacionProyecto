from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class PuntoEmisionBase(BaseModel):
    codigo: str = Field(..., pattern=r'^\d{3}$', description="Código punto de emisión SRI (001-999)")
    nombre: str
    telefono: Optional[str] = None
    activo: bool = True

class PuntoEmisionCreacion(PuntoEmisionBase):
    establecimiento_id: UUID

class PuntoEmisionActualizacion(BaseModel):
    codigo: Optional[str] = Field(None, pattern=r'^\d{3}$', description="Código punto de emisión SRI (001-999)")
    nombre: Optional[str] = None
    activo: Optional[bool] = None
    establecimiento_id: Optional[UUID] = None
    secuencial_factura: Optional[int] = Field(None, ge=1)
    secuencial_nota_credito: Optional[int] = Field(None, ge=1)
    secuencial_nota_debito: Optional[int] = Field(None, ge=1)
    secuencial_retencion: Optional[int] = Field(None, ge=1)
    secuencial_guia_remision: Optional[int] = Field(None, ge=1)

class PuntoEmisionLectura(PuntoEmisionBase):
    id: UUID
    establecimiento_id: UUID
    establecimiento_nombre: Optional[str] = None
    secuencial_factura: int
    secuencial_nota_credito: int
    secuencial_nota_debito: int
    secuencial_retencion: int
    secuencial_guia_remision: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

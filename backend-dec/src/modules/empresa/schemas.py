from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class EmpresaBase(BaseModel):
    ruc: str = Field(..., pattern=r"^[0-9]{13}$")
    razon_social: str
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, pattern=r"^([0-9]{10})?$")
    direccion: Optional[str] = None
    logo_url: Optional[str] = None
    activo: bool = True
    estado_suscripcion: str = "PENDIENTE"
    tipo_contribuyente: Optional[str] = None
    obligado_contabilidad: bool = False

class EmpresaCreacion(EmpresaBase):
    vendedor_id: Optional[UUID] = None
    fecha_activacion: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None

class EmpresaActualizacion(BaseModel):
    vendedor_id: Optional[UUID] = None
    ruc: Optional[str] = Field(None, pattern=r"^([0-9]{13})?$")
    razon_social: Optional[str] = None
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, pattern=r"^([0-9]{10})?$")
    direccion: Optional[str] = None
    logo_url: Optional[str] = None
    activo: Optional[bool] = None
    estado_suscripcion: Optional[str] = None
    tipo_contribuyente: Optional[str] = None
    obligado_contabilidad: Optional[bool] = None
    fecha_activacion: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None

class EmpresaLectura(EmpresaBase):
    id: UUID
    vendedor_id: Optional[UUID] = None
    fecha_registro: datetime
    fecha_activacion: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    plan: Optional[str] = None
    plan_id: Optional[UUID] = None
    fecha_inicio_plan: Optional[datetime] = None
    fecha_fin_plan: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

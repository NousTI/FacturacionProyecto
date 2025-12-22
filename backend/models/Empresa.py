from uuid import UUID
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class EmpresaBase(BaseModel):
    ruc: str
    razon_social: str
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    logo_url: Optional[str] = None
    activo: bool = True
    estado_suscripcion: str = "PENDIENTE"
    tipo_contribuyente: Optional[str] = None
    obligado_contabilidad: bool = False

class EmpresaCreate(EmpresaBase):
    vendedor_id: Optional[UUID] = None
    fecha_activacion: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None

class EmpresaUpdate(BaseModel):
    vendedor_id: Optional[UUID] = None
    ruc: Optional[str] = None
    razon_social: Optional[str] = None
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    logo_url: Optional[str] = None
    activo: Optional[bool] = None
    estado_suscripcion: Optional[str] = None
    tipo_contribuyente: Optional[str] = None
    obligado_contabilidad: Optional[bool] = None
    fecha_activacion: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None

class EmpresaRead(EmpresaBase):
    id: UUID
    vendedor_id: Optional[UUID] = None
    fecha_registro: datetime
    fecha_activacion: Optional[datetime] = None
    fecha_vencimiento: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

from uuid import UUID
from datetime import date
from typing import Optional
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
    estado_suscripcion: Optional[str] = None
    tipo_contribuyente: Optional[str] = None
    obligado_contabilidad: bool = False

class EmpresaCreate(EmpresaBase):
    vendedor_id: Optional[UUID] = None
    plan_id: Optional[UUID] = None
    fecha_activacion: Optional[date] = None
    fecha_vencimiento: Optional[date] = None

class EmpresaRead(EmpresaBase):
    id: UUID
    vendedor_id: Optional[UUID] = None
    plan_id: Optional[UUID] = None
    fecha_registro: date
    fecha_activacion: Optional[date] = None
    fecha_vencimiento: Optional[date] = None

    class Config:
        from_attributes = True

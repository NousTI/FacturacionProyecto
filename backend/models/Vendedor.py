from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr

class VendedorBase(BaseModel):
    email: EmailStr
    nombres: str
    apellidos: str
    telefono: Optional[str] = None
    documento_identidad: Optional[str] = None
    porcentaje_comision: Optional[float] = None
    tipo_comision: Optional[str] = None
    puede_crear_empresas: bool = False
    puede_gestionar_planes: bool = False
    puede_ver_reportes: bool = False
    activo: bool = True
    configuracion: Optional[Dict[str, Any]] = None

class VendedorCreate(VendedorBase):
    password: str

class VendedorUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    documento_identidad: Optional[str] = None
    porcentaje_comision: Optional[float] = None
    tipo_comision: Optional[str] = None
    puede_crear_empresas: Optional[bool] = None
    puede_gestionar_planes: Optional[bool] = None
    puede_ver_reportes: Optional[bool] = None
    activo: Optional[bool] = None
    configuracion: Optional[Dict[str, Any]] = None
    password: Optional[str] = None

class VendedorRead(VendedorBase):
    id: UUID
    fecha_registro: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class VendedorLogin(BaseModel):
    email: EmailStr
    password: str

from typing import Optional
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class ProveedorBase(BaseModel):
    identificacion: str
    tipo_identificacion: str # RUC | CEDULA | PASAPORTE
    razon_social: str
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    dias_credito: int = 0
    activo: bool = True

class ProveedorCreacion(ProveedorBase):
    empresa_id: Optional[UUID] = None

class ProveedorActualizacion(BaseModel):
    identificacion: Optional[str] = None
    tipo_identificacion: Optional[str] = None
    razon_social: Optional[str] = None
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    dias_credito: Optional[int] = None
    activo: Optional[bool] = None

class ProveedorLectura(ProveedorBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

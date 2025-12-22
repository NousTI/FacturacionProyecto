from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class ClienteBase(BaseModel):
    identificacion: str
    tipo_identificacion: str  # SQL is NOT NULL
    razon_social: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    pais: Optional[str] = None
    avatar_url: Optional[str] = None
    observaciones: Optional[str] = None
    activo: bool = True

class ClienteCreate(ClienteBase):
    empresa_id: Optional[UUID] = None

class ClienteUpdate(BaseModel):
    identificacion: Optional[str] = None
    tipo_identificacion: Optional[str] = None
    razon_social: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    pais: Optional[str] = None
    avatar_url: Optional[str] = None
    observaciones: Optional[str] = None
    activo: Optional[bool] = None

class ClienteRead(ClienteBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

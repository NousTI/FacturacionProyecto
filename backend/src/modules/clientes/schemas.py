from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class ClienteBase(BaseModel):
    identificacion: str
    tipo_identificacion: str 
    razon_social: str
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    pais: Optional[str] = "Ecuador"
    dias_credito: int = 0
    limite_credito: float = 0
    activo: bool = True

class ClienteCreacion(ClienteBase):
    empresa_id: Optional[UUID] = None

class ClienteActualizacion(BaseModel):
    identificacion: Optional[str] = None
    tipo_identificacion: Optional[str] = None
    razon_social: Optional[str] = None
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    pais: Optional[str] = None
    dias_credito: Optional[int] = None
    limite_credito: Optional[float] = None
    activo: Optional[bool] = None

class ClienteLectura(ClienteBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

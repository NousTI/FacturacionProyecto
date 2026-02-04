from pydantic import BaseModel, EmailStr, Field, validator
from uuid import UUID
from datetime import datetime
from typing import Optional, Literal

class ClienteBase(BaseModel):
    identificacion: str
    tipo_identificacion: Literal['CEDULA', 'RUC', 'PASAPORTE']
    razon_social: str
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    pais: str = "Ecuador"
    dias_credito: int = Field(default=0, ge=0)
    limite_credito: float = Field(default=0.0, ge=0)
    activo: bool = True

class ClienteCreacion(ClienteBase):
    pass

class ClienteActualizacion(BaseModel):
    identificacion: Optional[str] = None
    tipo_identificacion: Optional[Literal['CEDULA', 'RUC', 'PASAPORTE']] = None
    razon_social: Optional[str] = None
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    pais: Optional[str] = None
    dias_credito: Optional[int] = Field(None, ge=0)
    limite_credito: Optional[float] = Field(None, ge=0)
    activo: Optional[bool] = None

class ClienteLectura(ClienteBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ClienteStats(BaseModel):
    total: int
    activos: int
    con_credito: int

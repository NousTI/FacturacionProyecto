from pydantic import BaseModel, EmailStr, Field, field_validator, ValidationInfo
from uuid import UUID
from datetime import datetime
from typing import Optional, Literal
from ...utils.validators import validar_identificacion

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
    dias_credito: int = Field(default=0, ge=0)
    limite_credito: float = Field(default=0.0, ge=0)
    activo: bool = True

    @field_validator("identificacion")
    @classmethod
    def validar_documento(cls, v: str, info: ValidationInfo) -> str:
        # Pydantic v2: info.data contiene los otros campos del modelo
        tipo = info.data.get("tipo_identificacion")
        
        if v and not validar_identificacion(v):
            raise ValueError(f"La identificación '{v}' no es un(a) {tipo} válido(a) según SRI.")
        return v

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
    dias_credito: Optional[int] = Field(None, ge=0)
    limite_credito: Optional[float] = Field(None, ge=0)
    activo: Optional[bool] = None

    @field_validator("identificacion")
    @classmethod
    def validar_documento(cls, v: str, info: ValidationInfo) -> Optional[str]:
        if v is None:
            return v
            
        tipo = info.data.get("tipo_identificacion")
        
        if v and not validar_identificacion(v):
            raise ValueError(f"La identificación '{v}' no es un(a) {tipo} válido(a) según SRI.")
        return v

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

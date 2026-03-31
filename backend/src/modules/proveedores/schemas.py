from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ValidationInfo
from ...utils.validators import validar_identificacion
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

    @field_validator("identificacion")
    @classmethod
    def validar_documento(cls, v: str, info: ValidationInfo) -> str:
        # En proveedores el tipo_identificacion también define si es CEDULA o RUC
        tipo = info.data.get("tipo_identificacion")
        if tipo in ["CEDULA", "RUC"] and v and not validar_identificacion(v):
            raise ValueError(f"La identificación '{v}' no es un(a) {tipo} válido(a) según SRI.")
        return v

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

    @field_validator("identificacion")
    @classmethod
    def validar_documento(cls, v: str, info: ValidationInfo) -> Optional[str]:
        if v is None:
            return v
        tipo = info.data.get("tipo_identificacion")
        if tipo in ["CEDULA", "RUC"] and not validar_identificacion(v):
            raise ValueError(f"La identificación '{v}' no es un(a) {tipo} válido(a) según SRI.")
        return v

class ProveedorLectura(ProveedorBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

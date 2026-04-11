from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator, ValidationInfo
from ...utils.validators import validar_identificacion
from uuid import UUID
from datetime import datetime

class ProveedorBase(BaseModel):
    identificacion: str
    # 04 RUC, 05 Cédula, 06 Pasaporte, 07 Consumidor Final, 08 ID Exterior
    tipo_identificacion: Literal['04', '05', '06', '07', '08']
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
        # 04: RUC, 05: Cédula, 06: Pasaporte, 07: Consumidor Final, 08: ID Exterior
        tipo = info.data.get("tipo_identificacion")
        if tipo and v and not validar_identificacion(v):
            raise ValueError(f"La identificación '{v}' no es válida para el tipo '{tipo}' según el SRI.")
        return v

class ProveedorCreacion(ProveedorBase):
    empresa_id: Optional[UUID] = None

class ProveedorActualizacion(BaseModel):
    identificacion: Optional[str] = None
    tipo_identificacion: Optional[Literal['04', '05', '06', '07', '08']] = None
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
        if tipo and v and not validar_identificacion(v):
            raise ValueError(f"La identificación '{v}' no es válida para el tipo '{tipo}' según el SRI.")
        return v

class ProveedorLectura(ProveedorBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

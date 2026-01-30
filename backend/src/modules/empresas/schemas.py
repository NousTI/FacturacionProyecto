from uuid import UUID
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field, field_validator
from ...utils.validators import validar_ruc

class EmpresaBase(BaseModel):
    ruc: str = Field(..., min_length=13, max_length=13, pattern=r"^[0-9]{13}$")
    razon_social: str = Field(..., min_length=3)
    nombre_comercial: Optional[str] = None
    email: EmailStr
    telefono: Optional[str] = Field(None, pattern=r"^([0-9]{10})?$")
    direccion: str = Field(..., min_length=5)
    logo_url: Optional[str] = None
    activo: bool = True
    tipo_contribuyente: str
    obligado_contabilidad: bool = False

    @field_validator("ruc")
    @classmethod
    def validar_ruc_ecuador(cls, v: str) -> str:
        if not validar_ruc(v):
            raise ValueError("El RUC ingresado no es válido según los algoritmos del SRI.")
        return v

class EmpresaCreacion(EmpresaBase):
    vendedor_id: Optional[UUID] = None

class EmpresaAsignarVendedor(BaseModel):
    vendedor_id: Optional[UUID] = None

class EmpresaActualizacion(BaseModel):
    vendedor_id: Optional[UUID] = None
    ruc: Optional[str] = Field(None, pattern=r"^([0-9]{13})?$")
    razon_social: Optional[str] = None
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, pattern=r"^([0-9]{10})?$")
    direccion: Optional[str] = None
    logo_url: Optional[str] = None
    activo: Optional[bool] = None
    tipo_contribuyente: Optional[str] = None
    obligado_contabilidad: Optional[bool] = None

    @field_validator("ruc")
    @classmethod
    def validar_ruc_ecuador(cls, v: str) -> Optional[str]:
        if v is not None and not validar_ruc(v):
            raise ValueError("El RUC ingresado no es válido según los algoritmos del SRI.")
        return v

class EmpresaLectura(EmpresaBase):
    id: UUID
    vendedor_id: Optional[UUID] = None
    vendedor_name: Optional[str] = None
    plan_nombre: Optional[str] = None
    current_plan_id: Optional[UUID] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    suscripcion_estado: Optional[str] = None
    max_usuarios: Optional[int] = None
    max_facturas_mes: Optional[int] = None
    max_establecimientos: Optional[int] = None
    max_programaciones: Optional[int] = None
    ultimo_pago_fecha: Optional[datetime] = None
    ultimo_pago_monto: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

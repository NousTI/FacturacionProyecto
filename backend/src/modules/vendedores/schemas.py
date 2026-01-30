from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from ...utils.validators import validar_identificacion

class VendedorBase(BaseModel):
    nombres: str
    apellidos: str
    telefono: Optional[str] = Field(None, pattern=r"^([0-9]{10})?$")
    documento_identidad: Optional[str] = Field(None, pattern=r"^([0-9]{10,13})?$")
    porcentaje_comision: Optional[float] = None
    porcentaje_comision_inicial: Optional[float] = None
    porcentaje_comision_recurrente: Optional[float] = None
    tipo_comision: Optional[str] = None
    puede_crear_empresas: bool = False
    puede_gestionar_planes: bool = False
    puede_acceder_empresas: bool = False
    puede_ver_reportes: bool = False
    activo: bool = True
    configuracion: Optional[Dict[str, Any]] = None

    @field_validator("documento_identidad")
    @classmethod
    def validar_documento(cls, v: str) -> Optional[str]:
        if v is not None and not validar_identificacion(v):
            raise ValueError("La identificación (Cédula o RUC) no es válida según los algoritmos del SRI.")
        return v

class VendedorCreacion(VendedorBase):
    email: EmailStr
    password: Optional[str] = Field(None, min_length=6)

class VendedorActualizacion(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    telefono: Optional[str] = Field(None, pattern=r"^([0-9]{10})?$")
    documento_identidad: Optional[str] = Field(None, pattern=r"^([0-9]{10,13})?$")
    porcentaje_comision: Optional[float] = None
    porcentaje_comision_inicial: Optional[float] = None
    porcentaje_comision_recurrente: Optional[float] = None
    tipo_comision: Optional[str] = None
    puede_crear_empresas: Optional[bool] = None
    puede_gestionar_planes: Optional[bool] = None
    puede_acceder_empresas: Optional[bool] = None
    puede_ver_reportes: Optional[bool] = None
    activo: Optional[bool] = None
    configuracion: Optional[Dict[str, Any]] = None

class VendedorLectura(VendedorBase):
    id: UUID
    email: Optional[str] = None
    fecha_registro: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    ultimo_acceso: Optional[datetime] = None
    empresas_asignadas: int = 0
    empresas_activas: int = 0
    ingresos_generados: float = 0.0

class VendedorStats(BaseModel):
    total: int
    activos: int
    inactivos: int
    empresas_totales: int
    ingresos_generados: float

class ReasignacionEmpresas(BaseModel):
    vendedor_destino_id: UUID
    empresa_ids: Optional[List[UUID]] = None

from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, validator

class FacturaProgramadaBase(BaseModel):
    cliente_id: UUID
    usuario_id: UUID
    tipo_frecuencia: str
    dia_emision: Optional[int] = Field(None, ge=1, le=31)
    monto: Decimal = Field(..., ge=0)
    concepto: str
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    activo: bool = True
    enviar_email: bool = True
    configuracion: Optional[Dict[str, Any]] = None

    @validator('tipo_frecuencia')
    def validar_tipo_frecuencia(cls, v):
        allowed = ['MENSUAL', 'TRIMESTRAL', 'ANUAL']
        if v.upper() not in allowed:
            raise ValueError(f"tipo_frecuencia debe ser uno de {allowed}")
        return v.upper()

class FacturaProgramadaCreateInput(BaseModel):
    empresa_id: Optional[UUID] = None
    cliente_id: UUID
    usuario_id: Optional[UUID] = None
    tipo_frecuencia: str
    dia_emision: Optional[int] = Field(None, ge=1, le=31)
    monto: Decimal = Field(..., ge=0)
    concepto: str
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    activo: bool = True
    enviar_email: bool = True
    configuracion: Optional[Dict[str, Any]] = None

    @validator('tipo_frecuencia')
    def validar_tipo_frecuencia(cls, v):
        allowed = ['MENSUAL', 'TRIMESTRAL', 'ANUAL']
        if v.upper() not in allowed:
            raise ValueError(f"tipo_frecuencia debe ser uno de {allowed}")
        return v.upper()

class FacturaProgramadaCreate(FacturaProgramadaBase):
    pass

class FacturaProgramadaUpdate(BaseModel):
    cliente_id: Optional[UUID] = None
    usuario_id: Optional[UUID] = None
    tipo_frecuencia: Optional[str] = None
    dia_emision: Optional[int] = Field(None, ge=1, le=31)
    monto: Optional[Decimal] = Field(None, ge=0)
    concepto: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    activo: Optional[bool] = None
    enviar_email: Optional[bool] = None
    configuracion: Optional[Dict[str, Any]] = None

    @validator('tipo_frecuencia')
    def validar_tipo_frecuencia(cls, v):
        if v is None:
            return v
        allowed = ['MENSUAL', 'TRIMESTRAL', 'ANUAL']
        if v.upper() not in allowed:
            raise ValueError(f"tipo_frecuencia debe ser uno de {allowed}")
        return v.upper()

class FacturaProgramadaRead(FacturaProgramadaBase):
    id: UUID
    empresa_id: UUID
    ultima_emision: Optional[date] = None
    proxima_emision: Optional[date] = None
    total_emisiones: int
    emisiones_exitosas: int
    emisiones_fallidas: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

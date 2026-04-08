from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Literal, List, Any
from pydantic import BaseModel, Field

TipoFrecuencia = Literal['MENSUAL', 'TRIMESTRAL', 'ANUAL']

class FacturacionProgramadaBase(BaseModel):
    cliente_id: UUID
    tipo_frecuencia: TipoFrecuencia
    dia_emision: int = Field(..., ge=1, le=31)
    monto: Decimal = Field(..., ge=0)
    concepto: str
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    activo: bool = True
    enviar_email: bool = True
    configuracion: Optional[dict] = None

class FacturacionProgramadaCreacion(FacturacionProgramadaBase):
    empresa_id: Optional[UUID] = None # Se obtiene del contexto
    usuario_id: Optional[UUID] = None # Se obtiene del contexto

class FacturacionProgramadaActualizacion(BaseModel):
    tipo_frecuencia: Optional[TipoFrecuencia] = None
    dia_emision: Optional[int] = Field(None, ge=1, le=31)
    monto: Optional[Decimal] = Field(None, ge=0)
    concepto: Optional[str] = None
    fecha_fin: Optional[date] = None
    activo: Optional[bool] = None
    enviar_email: Optional[bool] = None
    configuracion: Optional[dict] = None

class FacturacionProgramadaLectura(FacturacionProgramadaBase):
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    ultima_emision: Optional[date] = None
    proxima_emision: Optional[date] = None
    cliente_nombre: Optional[str] = None
    total_emisiones: int
    emisiones_exitosas: int
    emisiones_fallidas: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

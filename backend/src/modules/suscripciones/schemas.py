from decimal import Decimal
from uuid import UUID
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, field_validator

class PlanBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = ""
    precio_mensual: float
    max_usuarios: int
    max_facturas_mes: int
    max_establecimientos: int
    max_programaciones: int
    caracteristicas: Optional[List[Dict[str, Any]]] = []
    bloqueo_automatico: bool = False
    visible_publico: bool = True
    activo: bool = True
    orden: int = 0

    @field_validator('caracteristicas', mode='before')
    @classmethod
    def normalizar_caracteristicas(cls, v):
        if isinstance(v, dict):
            return [{'nombre': str(k), 'descripcion': str(val)} for k, val in v.items()]
        return v

class PlanCreacion(PlanBase):
    pass

class PlanLectura(PlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PagoSuscripcionBase(BaseModel):
    empresa_id: UUID
    plan_id: UUID
    monto: Decimal
    fecha_pago: datetime
    fecha_inicio_periodo: datetime
    fecha_fin_periodo: datetime
    metodo_pago: str
    estado: str = "COMPLETED"
    numero_comprobante: Optional[str] = None
    observaciones: Optional[str] = None
    registrado_por: Optional[UUID] = None

class PagoSuscripcionCreacion(PagoSuscripcionBase):
    pass

class PagoSuscripcionQuick(BaseModel):
    empresa_id: UUID
    plan_id: UUID
    metodo_pago: str
    monto: Optional[Decimal] = None
    fecha_inicio_periodo: Optional[datetime] = None
    fecha_fin_periodo: Optional[datetime] = None
    numero_comprobante: Optional[str] = None

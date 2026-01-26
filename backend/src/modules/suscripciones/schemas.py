from decimal import Decimal
from uuid import UUID
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, field_validator

class PlanCaracteristicas(BaseModel):
    api_acceso: bool = False
    multi_usuario: bool = False
    backup_automatico: bool = True
    exportacion_datos: bool = False
    reportes_avanzados: bool = False
    alertas_vencimiento: bool = True
    personalizacion_pdf: bool = False
    soporte_prioritario: bool = False
    facturacion_electronica: bool = True

class PlanBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = ""
    precio_mensual: float
    max_usuarios: int
    max_facturas_mes: int
    max_establecimientos: int
    max_programaciones: int
    caracteristicas: PlanCaracteristicas
    visible_publico: bool = True
    activo: bool = True
    orden: int = 0

class PlanCreacion(PlanBase):
    pass

class PlanUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_mensual: Optional[float] = None
    max_usuarios: Optional[int] = None
    max_facturas_mes: Optional[int] = None
    max_establecimientos: Optional[int] = None
    max_programaciones: Optional[int] = None
    caracteristicas: Optional[PlanCaracteristicas] = None
    visible_publico: Optional[bool] = None
    activo: Optional[bool] = None
    orden: Optional[int] = None

class PlanLectura(PlanBase):
    id: UUID
    active_companies: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PlanStats(BaseModel):
    total_mrr: Decimal
    suscripciones_activas: int
    plan_mas_rentable: Optional[str]
    crecimiento: float

class HistoricoSuscripcion(BaseModel):
    id: UUID
    empresa_id: UUID
    razon_social: str
    plan_nombre: str
    monto: Decimal
    fecha_pago: datetime
    numero_comprobante: Optional[str]
    metodo_pago: str

class PagoSuscripcionBase(BaseModel):
    empresa_id: UUID
    plan_id: UUID
    monto: Decimal
    fecha_pago: datetime
    fecha_inicio_periodo: datetime
    fecha_fin_periodo: datetime
    metodo_pago: str
    estado: str = "PAGADO"
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

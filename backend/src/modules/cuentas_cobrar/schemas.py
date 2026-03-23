from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field

class CuentaCobrarBase(BaseModel):
    empresa_id: UUID
    factura_id: UUID
    cliente_id: UUID
    numero_documento: str
    fecha_emision: date
    fecha_vencimiento: date
    monto_total: Decimal = Field(..., ge=0)
    monto_pagado: Decimal = Field(default=Decimal('0.00'), ge=0)
    saldo_pendiente: Decimal = Field(..., ge=0)
    estado: str = 'pendiente' # pendiente | pagado | vencido | anulado
    dias_vencido: int = 0
    observaciones: Optional[str] = None

class CuentaCobrarCreacion(BaseModel):
    factura_id: UUID
    cliente_id: UUID
    numero_documento: str
    fecha_emision: date
    fecha_vencimiento: date
    monto_total: Optional[Decimal] = Field(None, ge=0)
    observaciones: Optional[str] = None
    empresa_id: Optional[UUID] = None

class CuentaCobrarActualizacion(BaseModel):
    monto_pagado: Optional[Decimal] = Field(None, ge=0)
    saldo_pendiente: Optional[Decimal] = Field(None, ge=0)
    estado: Optional[str] = None
    dias_vencido: Optional[int] = None
    observaciones: Optional[str] = None
    fecha_vencimiento: Optional[date] = None

class CuentaCobrarLectura(CuentaCobrarBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- NUEVOS MODELOS PARA REPORTES ---

class AgingBucket(BaseModel):
    monto: Decimal = Field(default=Decimal('0.00'))
    porcentaje: float = 0.0

class CuentasCobrarResumen(BaseModel):
    total_por_cobrar: Decimal
    vigente: AgingBucket
    vencido_1_30: AgingBucket
    vencido_31_60: AgingBucket
    vencido_60_mas: AgingBucket

class CuentaCobrarDetallado(BaseModel):
    id: UUID
    cliente_nombre: str
    numero_documento: str
    fecha_emision: date
    fecha_vencimiento: date
    monto_total: Decimal
    monto_pagado: Decimal
    saldo_pendiente: Decimal
    dias_vencido: int
    estado: str

class ChartDataPoint(BaseModel):
    label: str
    value: float

class CuentasCobrarGraficos(BaseModel):
    distribucion_antiguedad: List[ChartDataPoint]
    top_clientes_morosos: List[ChartDataPoint]

class CuentasCobrarOverview(BaseModel):
    resumen: CuentasCobrarResumen
    listado: List[CuentaCobrarDetallado]
    graficos: CuentasCobrarGraficos
    fecha_corte: date

# R-009 Antigüedad por Cliente
class AntiguedadCliente(BaseModel):
    cliente: str
    vigente: Decimal
    vencido_1_30: Decimal
    vencido_31_60: Decimal
    vencido_mas_60: Decimal
    total: Decimal

# R-010 Clientes Morosos
class ClienteMoroso(BaseModel):
    cliente: str
    total_facturas_vencidas: int
    monto_total_adeudado: Decimal
    mayor_antiguedad_dias: int
    ultima_fecha_pago: Optional[date] = None
    telefono: Optional[str] = None
    email: Optional[str] = None

# R-011 Historial de Pagos
class HistorialPago(BaseModel):
    fecha_pago: date
    cliente: str
    numero_factura: str
    numero_recibo: Optional[str] = None
    monto_pagado: Decimal
    metodo_pago: Optional[str] = None
    usuario_registro: Optional[str] = None
    observaciones: Optional[str] = None

# R-012 Proyección de Cobros
class ProyeccionCobro(BaseModel):
    mes: str
    facturas_vencen: int
    monto_total: Decimal

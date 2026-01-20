from uuid import UUID
from datetime import date, datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field

class GastoBase(BaseModel):
    proveedor_id: Optional[UUID] = None
    categoria_gasto_id: UUID
    numero_factura: Optional[str] = None
    fecha_emision: date
    fecha_vencimiento: Optional[date] = None
    concepto: str
    subtotal: Decimal = Field(..., ge=0)
    iva: Decimal = Field(default=Decimal('0.00'), ge=0)
    total: Decimal = Field(..., ge=0)
    estado_pago: str = "pendiente" # pendiente | pagado | vencido
    comprobante_url: Optional[str] = None
    observaciones: Optional[str] = None

class GastoCreacion(GastoBase):
    empresa_id: Optional[UUID] = None
    usuario_id: Optional[UUID] = None

class GastoActualizacion(BaseModel):
    proveedor_id: Optional[UUID] = None
    categoria_gasto_id: Optional[UUID] = None
    numero_factura: Optional[str] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    concepto: Optional[str] = None
    subtotal: Optional[Decimal] = Field(None, ge=0)
    iva: Optional[Decimal] = Field(None, ge=0)
    total: Optional[Decimal] = Field(None, ge=0)
    estado_pago: Optional[str] = None
    comprobante_url: Optional[str] = None
    observaciones: Optional[str] = None

class GastoLectura(GastoBase):
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

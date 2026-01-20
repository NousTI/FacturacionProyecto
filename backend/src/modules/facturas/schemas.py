from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field

class FacturaBase(BaseModel):
    establecimiento_id: UUID
    punto_emision_id: UUID
    cliente_id: UUID
    facturacion_programada_id: Optional[UUID] = None
    fecha_emision: date
    fecha_vencimiento: Optional[date] = None
    subtotal_sin_iva: Decimal = Field(default=Decimal('0.00'), ge=0)
    subtotal_con_iva: Decimal = Field(default=Decimal('0.00'), ge=0)
    iva: Decimal = Field(default=Decimal('0.00'), ge=0)
    descuento: Decimal = Field(default=Decimal('0.00'), ge=0)
    propina: Decimal = Field(default=Decimal('0.00'), ge=0)
    total: Decimal = Field(..., ge=0)
    origen: Optional[str] = None
    observaciones: Optional[str] = None

class FacturaCreacion(FacturaBase):
    empresa_id: Optional[UUID] = None
    usuario_id: Optional[UUID] = None

class FacturaActualizacion(BaseModel):
    estado_pago: Optional[str] = None
    observaciones: Optional[str] = None
    fecha_emision: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    subtotal_sin_iva: Optional[Decimal] = Field(None, ge=0)
    subtotal_con_iva: Optional[Decimal] = Field(None, ge=0)
    iva: Optional[Decimal] = Field(None, ge=0)
    descuento: Optional[Decimal] = Field(None, ge=0)
    propina: Optional[Decimal] = Field(None, ge=0)
    total: Optional[Decimal] = Field(None, ge=0)
    origen: Optional[str] = None
    estado: Optional[str] = None
    facturacion_programada_id: Optional[UUID] = None

class FacturaLectura(FacturaBase):
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    numero_factura: str
    clave_acceso: Optional[str] = None
    estado: str
    estado_pago: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

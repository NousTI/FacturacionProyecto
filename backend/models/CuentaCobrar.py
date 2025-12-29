from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

# Base Model
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
    
    estado: str = 'pendiente'
    dias_vencido: int = 0
    
    observaciones: Optional[str] = None

# Create Input
class CuentaCobrarCreate(BaseModel):
    factura_id: UUID
    cliente_id: UUID
    numero_documento: str
    fecha_emision: date
    fecha_vencimiento: date
    monto_total: Optional[Decimal] = Field(None, ge=0)
    observaciones: Optional[str] = None
    empresa_id: Optional[UUID] = None # Admin/Superadmin can specify this

# Update
class CuentaCobrarUpdate(BaseModel):
    monto_pagado: Optional[Decimal] = Field(None, ge=0)
    saldo_pendiente: Optional[Decimal] = Field(None, ge=0)
    estado: Optional[str] = None
    dias_vencido: Optional[int] = None
    observaciones: Optional[str] = None
    fecha_vencimiento: Optional[date] = None

# Read
class CuentaCobrarRead(CuentaCobrarBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

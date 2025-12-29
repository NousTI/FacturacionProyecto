from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

# Base
class PagoFacturaBase(BaseModel):
    cuenta_cobrar_id: UUID
    factura_id: UUID
    usuario_id: UUID
    
    numero_recibo: str
    fecha_pago: date
    monto: Decimal = Field(..., gt=0)
    metodo_pago: str
    numero_referencia: Optional[str] = None
    comprobante_url: Optional[str] = None
    observaciones: Optional[str] = None

# Create Input
class PagoFacturaCreate(BaseModel):
    cuenta_cobrar_id: UUID
    factura_id: UUID
    # usuario_id derived from context usually, but Superadmin can assign
    usuario_id: Optional[UUID] = None 
    numero_recibo: str
    fecha_pago: date = Field(default_factory=date.today)
    monto: Decimal = Field(..., gt=0)
    metodo_pago: str
    numero_referencia: Optional[str] = None
    comprobante_url: Optional[str] = None
    observaciones: Optional[str] = None

# Read
class PagoFacturaRead(PagoFacturaBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

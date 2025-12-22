from uuid import UUID
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

# Base Model
class FacturaDetalleBase(BaseModel):
    factura_id: UUID
    producto_id: Optional[UUID] = None
    
    # If producto_id is provided, backend can fetch these. 
    # But if it's a manual item (no linked product), user must provide them.
    codigo_producto: str
    descripcion: str
    
    cantidad: int = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0)
    descuento: Decimal = Field(default=Decimal('0.00'), ge=0)
    subtotal: Decimal = Field(..., ge=0)
    
    tipo_iva: str # e.g., '12%', '0%', 'Exento'
    valor_iva: Decimal = Field(default=Decimal('0.00'), ge=0)
    
    costo_unitario: Optional[Decimal] = None # For internal tracking/profitability

# Create Input (API)
class FacturaDetalleCreateInput(FacturaDetalleBase):
    pass
    # All base fields are required/optional as defined. 
    # Logic: if producto_id is given, codigo/descripcion can be overridden or auto-filled.

# Internal Create (Repo)
class FacturaDetalleCreate(FacturaDetalleBase):
    pass

# Update
class FacturaDetalleUpdate(BaseModel):
    # What can be updated in a line item?
    cantidad: Optional[int] = Field(None, gt=0)
    precio_unitario: Optional[Decimal] = Field(None, ge=0)
    descuento: Optional[Decimal] = Field(None, ge=0)
    subtotal: Optional[Decimal] = Field(None, ge=0)
    valor_iva: Optional[Decimal] = Field(None, ge=0)
    descripcion: Optional[str] = None
    
    # Recalculations specific to logic might be needed in Service if these change.
    
# Read
class FacturaDetalleRead(FacturaDetalleBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

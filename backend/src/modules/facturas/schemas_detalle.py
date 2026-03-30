from uuid import UUID
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field

class FacturaDetalleBase(BaseModel):
    factura_id: UUID
    producto_id: Optional[UUID] = None
    codigo_producto: str
    nombre: str
    descripcion: str
    cantidad: int = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0)
    descuento: Decimal = Field(default=Decimal(0), ge=0)
    subtotal: Decimal
    tipo_iva: str = Field(..., description="Tarifa IVA (ej: '0', '2', '3') o porcentaje")
    valor_iva: Decimal
    
    # NUEVOS CAMPOS SRI
    codigo_impuesto: str = '2'
    tarifa_iva: Decimal = Decimal('0.00')
    base_imponible: Decimal = Decimal('0.00')
    
    costo_unitario: Optional[Decimal] = None

class FacturaDetalleCreacion(BaseModel):
    """Schema para crear un detalle de factura. 
    Los campos factura_id, subtotal y valor_iva son opcionales y se calculan en el backend."""
    factura_id: Optional[UUID] = None  # Se inyecta desde la ruta
    producto_id: Optional[UUID] = None
    codigo_producto: str
    nombre: str
    descripcion: str
    cantidad: int = Field(..., gt=0)
    precio_unitario: Decimal = Field(..., ge=0)
    descuento: Decimal = Field(default=Decimal(0), ge=0)
    subtotal: Optional[Decimal] = None  # Se calcula en el backend
    tipo_iva: str = Field(..., description="Código SRI Tarifa IVA (ej: '0', '2', '3', '4', '10')")
    valor_iva: Optional[Decimal] = None  # Se calcula en el backend
    
    # NUEVOS CAMPOS SRI
    codigo_impuesto: str = Field(default='2', description="Código del impuesto (2=IVA SRI)")
    tarifa_iva: Optional[Decimal] = Field(default=Decimal(0), description="Porcentaje real (ej: 0.00, 15.00)")
    base_imponible: Optional[Decimal] = None  # Suele ser igual al subtotal
    costo_unitario: Optional[Decimal] = None

class FacturaDetalleActualizacion(BaseModel):
    codigo_producto: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    cantidad: Optional[int] = Field(None, gt=0)
    precio_unitario: Optional[Decimal] = Field(None, ge=0)
    descuento: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None
    tipo_iva: Optional[str] = None
    valor_iva: Optional[Decimal] = None
    costo_unitario: Optional[Decimal] = None

class FacturaDetalleLectura(FacturaDetalleBase):
    id: UUID

    class Config:
        from_attributes = True

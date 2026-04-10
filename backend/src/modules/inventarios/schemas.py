from uuid import UUID
from datetime import datetime
from typing import Optional, Literal
from decimal import Decimal
from pydantic import BaseModel, Field

class MovimientoInventarioBase(BaseModel):
    producto_id: UUID
    tipo_movimiento: Literal['entrada', 'salida', 'ajuste', 'devolucion']
    cantidad: Decimal = Field(..., gt=0)
    costo_unitario: Optional[Decimal] = Field(None, ge=0)
    costo_total: Optional[Decimal] = Field(None, ge=0)
    documento_referencia: Optional[str] = None
    observaciones: Optional[str] = None
    factura_id: Optional[UUID] = None

class MovimientoInventarioCreacion(MovimientoInventarioBase):
    usuario_id: Optional[UUID] = None

class MovimientoInventarioLectura(MovimientoInventarioBase):
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    stock_anterior: Decimal
    stock_nuevo: Decimal
    fecha_movimiento: datetime
    created_at: datetime
    
    # Joined fields
    producto_nombre: Optional[str] = None
    usuario_nombre: Optional[str] = None

class InventarioStats(BaseModel):
    total_valor_inventario: Decimal
    movimientos_30d: int
    productos_stock_bajo: int

    class Config:
        from_attributes = True


# Schemas para tabla 'inventario' (gestión de stock)
class InventarioBase(BaseModel):
    producto_id: UUID
    tipo_movimiento: Literal['COMPRA', 'VENTA', 'DEVOLUCION']
    unidad_medida: Literal['UNIDAD', 'CAJA', 'BULTO', 'KILO', 'METRO', 'LITRO']
    cantidad: int = Field(..., ge=0)
    estado: Literal['DISPONIBLE', 'RESERVADO', 'DAÑADO', 'EN_TRANSITO']
    ubicacion_fisica: Optional[str] = None
    observaciones: Optional[str] = None
    fecha: Optional[str] = None

class InventarioCreacion(InventarioBase):
    pass

class InventarioActualizacion(BaseModel):
    tipo_movimiento: Optional[Literal['COMPRA', 'VENTA', 'DEVOLUCION']] = None
    unidad_medida: Optional[Literal['UNIDAD', 'CAJA', 'BULTO', 'KILO', 'METRO', 'LITRO']] = None
    cantidad: Optional[int] = Field(None, ge=0)
    estado: Optional[Literal['DISPONIBLE', 'RESERVADO', 'DAÑADO', 'EN_TRANSITO']] = None
    ubicacion_fisica: Optional[str] = None
    observaciones: Optional[str] = None

class InventarioLectura(InventarioBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    # Joined fields
    producto_nombre: Optional[str] = None
    producto_codigo: Optional[str] = None

class InventarioResumen(BaseModel):
    id: UUID
    nombre: str
    codigo: str
    disponible: int
    reservado: int
    danado: int
    en_transito: int
    total: int

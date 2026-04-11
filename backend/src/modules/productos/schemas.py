from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from datetime import datetime, date

class ProductoBase(BaseModel):
    empresa_id: Optional[UUID] = None
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    precio: float = Field(..., ge=0)
    costo: Optional[float] = Field(None, ge=0)
    stock_actual: float = Field(0, ge=0)
    stock_minimo: float = Field(0, ge=0)
    # Códigos SRI:
    # '0' = 0%
    # '2' = 12%
    # '3' = 14%
    # '4' = 15% (Actual)
    # '5' = 5%
    # '6' = No Objeto
    # '7' = Exento (0%)
    # '8' = 8%
    # '10' = 13%
    tipo_iva: Literal['0', '2', '3', '4', '5', '6', '7', '8', '10']
    porcentaje_iva: float = 0.0
    maneja_inventario: bool = True
    tipo: Optional[str] = None
    unidad_medida: Optional[str] = None
    activo: bool = True

    @field_validator('porcentaje_iva', mode='before')
    @classmethod
    def set_porcentaje_iva(cls, v, info):
        from ...constants.sri_constants import SRI_TARIFAS_IVA
        tipo = info.data.get('tipo_iva')
        if tipo in SRI_TARIFAS_IVA:
            return float(SRI_TARIFAS_IVA[tipo])
        return v

class ProductoCreacion(ProductoBase):
    pass

class ProductoActualizacion(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = Field(None, ge=0)
    costo: Optional[float] = Field(None, ge=0)
    stock_actual: Optional[int] = Field(None, ge=0)
    stock_minimo: Optional[int] = Field(None, ge=0)
    tipo_iva: Optional[Literal['0', '2', '3', '4', '5', '6', '7', '8', '10']] = None
    porcentaje_iva: Optional[float] = None

    @field_validator('porcentaje_iva', mode='before')
    @classmethod
    def set_porcentaje_iva_update(cls, v, info):
        # Intentamos obtener tipo_iva del payload de actualización, 
        # si no está presente, Pydantic no podrá inferir el porcentaje automáticamente 
        # sin consultar la base de datos (lo cual es responsabilidad del servicio).
        from ...constants.sri_constants import SRI_TARIFAS_IVA
        tipo = info.data.get('tipo_iva')
        if tipo and tipo in SRI_TARIFAS_IVA:
            return float(SRI_TARIFAS_IVA[tipo])
        return v
    maneja_inventario: Optional[bool] = None
    tipo: Optional[str] = None
    unidad_medida: Optional[str] = None
    activo: Optional[bool] = None

class ProductoLectura(ProductoBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductoMasVendido(BaseModel):
    id: UUID
    codigo: str
    nombre: str
    unidad_medida: Optional[str] = None
    cantidad_vendida: float
    total_vendido: float
    utilidad: Optional[float] = None
    margen: Optional[float] = None

class ProductoSinMovimiento(BaseModel):
    id: UUID
    codigo: str
    nombre: str
    unidad_medida: Optional[str] = None
    ultima_venta: Optional[date] = None
    dias_sin_movimiento: Optional[int] = None
    stock_actual: float
    costo: float

class ProductoRentabilidad(BaseModel):
    id: UUID
    codigo: str
    nombre: str
    unidad_medida: Optional[str] = None
    precio: float
    costo: float
    utilidad_unitaria: float
    margen: float
    cantidad_vendida: float
    utilidad_total: float

class ProductoReporteInventario(BaseModel):
    id: UUID
    codigo: str
    nombre: str
    unidad_medida: Optional[str] = None
    stock_actual: float
    stock_minimo: float
    estado_alerta: str
    costo_unitario: float
    valor_total_inventario: float

class ProductoKardexItem(BaseModel):
    fecha: datetime
    tipo: str
    documento: Optional[str] = None
    entrada: float
    salida: float
    saldo: float
    costo_unitario: float
    costo_total: float

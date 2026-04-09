from uuid import UUID
from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class TipoMovimientoBase(BaseModel):
    nombre: Literal['COMPRA', 'VENTA', 'DEVOLUCION']


class TipoMovimientoCreacion(TipoMovimientoBase):
    pass


class TipoMovimientoActualizacion(BaseModel):
    nombre: Literal['COMPRA', 'VENTA', 'DEVOLUCION']


class TipoMovimientoLectura(TipoMovimientoBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

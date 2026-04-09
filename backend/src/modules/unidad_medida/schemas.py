from uuid import UUID
from datetime import datetime
from typing import Literal
from pydantic import BaseModel


class UnidadMedidaBase(BaseModel):
    nombre: Literal['UNIDAD', 'CAJA', 'BULTO', 'KILO', 'METRO', 'LITRO']


class UnidadMedidaCreacion(UnidadMedidaBase):
    pass


class UnidadMedidaActualizacion(BaseModel):
    nombre: Literal['UNIDAD', 'CAJA', 'BULTO', 'KILO', 'METRO', 'LITRO']


class UnidadMedidaLectura(UnidadMedidaBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

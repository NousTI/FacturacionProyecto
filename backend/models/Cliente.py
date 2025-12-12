# backend/models/Cliente.py
from typing import Literal

from pydantic import BaseModel

from schemas.common import (
    Address,
    Identification,
    NullableEmail,
    Phone,
)


class ClienteBase(BaseModel):
    nombre: str
    num_identificacion: Identification
    celular: Phone = None
    direccion: Address = None
    correo: NullableEmail = None
    tipo_cliente: Literal["NATURAL", "JURIDICA"]  # NATURAL / JURIDICA


class ClienteCreate(ClienteBase):
    pass  # No necesita fk_usuario


class ClienteResponse(ClienteBase):
    id: int
    # fk_usuario removed

    class Config:
        from_attributes = True

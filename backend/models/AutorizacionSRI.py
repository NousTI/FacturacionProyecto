from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from enum import Enum

class AutorizacionSRICreate(BaseModel):
    factura_id: UUID
    numero_autorizacion: Optional[str] = None
    fecha_autorizacion: Optional[datetime] = None
    estado: str  # autorizado | no_autorizado | devuelto | error
    mensajes: Optional[str] = None
    xml_enviado: Optional[str] = None
    xml_respuesta: Optional[str] = None

class AutorizacionSRIRead(BaseModel):
    id: UUID
    factura_id: UUID
    numero_autorizacion: Optional[str]
    fecha_autorizacion: Optional[datetime]
    estado: str
    mensajes: Optional[str]
    xml_enviado: Optional[str]
    xml_respuesta: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

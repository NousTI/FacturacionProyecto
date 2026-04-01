from datetime import datetime
from uuid import UUID
from typing import Optional, Any
from pydantic import BaseModel, Field

class NotificacionBase(BaseModel):
    titulo: str
    mensaje: str
    tipo: str = "RENOVACION" # RENOVACION, PAGO, SISTEMA, OTRO
    prioridad: str = "MEDIA" # BAJA, MEDIA, ALTA
    metadata: Optional[dict[str, Any]] = None

class NotificacionCreate(NotificacionBase):
    user_id: UUID

class NotificacionUpdate(BaseModel):
    leido: bool

class NotificacionLectura(NotificacionBase):
    id: UUID
    user_id: UUID
    leido: bool
    leido_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

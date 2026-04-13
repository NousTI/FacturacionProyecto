from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, Field

class SolicitudRenovacionBase(BaseModel):
    empresa_id: UUID
    plan_id: UUID
    comprobante_url: Optional[str] = None

class SolicitudRenovacionCreate(BaseModel):
    empresa_id: UUID
    plan_id: UUID

class SolicitudRenovacionProcess(BaseModel):
    estado: str = Field(..., pattern="^(ACEPTADA|RECHAZADA)$")
    motivo_rechazo: Optional[str] = None
    metodo_pago: Optional[str] = "TRANSFERENCIA"
    numero_comprobante: Optional[str] = None

class SolicitudRenovacionLectura(SolicitudRenovacionBase):
    id: UUID
    suscripcion_id: UUID
    vendedor_id: Optional[UUID] = None
    estado: str
    procesado_por: Optional[UUID] = None
    motivo_rechazo: Optional[str] = None
    fecha_solicitud: datetime
    fecha_procesamiento: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Datos extras para la UI
    empresa_nombre: Optional[str] = None
    plan_nombre: Optional[str] = None
    vendedor_nombre: Optional[str] = None

    class Config:
        from_attributes = True

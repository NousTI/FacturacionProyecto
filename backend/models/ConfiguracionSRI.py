from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ConfiguracionSRIBase(BaseModel):
    empresa_id: UUID
    ambiente: str # '1' Pruebas | '2' Produccion
    tipo_emision: str # '1' Normal
    # Sensitive data usually excluded from base read... but needed for signing
    fecha_expiracion_cert: Optional[datetime] = None
    firma_activa: bool = True

class ConfiguracionSRICreate(ConfiguracionSRIBase):
    certificado_digital: str
    clave_certificado: str

class ConfiguracionSRIUpdate(BaseModel):
    ambiente: Optional[str] = None
    tipo_emision: Optional[str] = None
    certificado_digital: Optional[str] = None # Assuming update might re-upload
    clave_certificado: Optional[str] = None
    fecha_expiracion_cert: Optional[datetime] = None
    firma_activa: Optional[bool] = None

class ConfiguracionSRIRead(ConfiguracionSRIBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

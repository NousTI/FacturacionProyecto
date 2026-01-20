from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ConfigSRIBase(BaseModel):
    empresa_id: UUID
    ambiente: str # '1' Pruebas | '2' Producción
    tipo_emision: str # '1' Normal
    fecha_expiracion_cert: Optional[datetime] = None
    firma_activa: bool = True

class ConfigSRICreacion(ConfigSRIBase):
    certificado_digital: str # Base64
    clave_certificado: str

class ConfigSRIActualizacion(BaseModel):
    ambiente: Optional[str] = None
    tipo_emision: Optional[str] = None
    certificado_digital: Optional[str] = None
    clave_certificado: Optional[str] = None
    firma_activa: Optional[bool] = None

class ConfigSRILectura(ConfigSRIBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AutorizacionSRILectura(BaseModel):
    id: UUID
    factura_id: UUID
    numero_autorizacion: Optional[str] = None
    fecha_autorizacion: Optional[datetime] = None
    estado: str
    mensajes: Optional[str] = None
    xml_enviado: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

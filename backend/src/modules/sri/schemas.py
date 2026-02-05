from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ConfigSRIBase(BaseModel):
    empresa_id: UUID
    ambiente: str # 'PRUEBAS' | 'PRODUCCION'
    tipo_emision: str # 'NORMAL' | 'CONTINGENCIA'
    fecha_activacion_cert: Optional[datetime] = None
    fecha_expiracion_cert: Optional[datetime] = None
    cert_serial: Optional[str] = None
    cert_sujeto: Optional[str] = None
    cert_emisor: Optional[str] = None
    estado: str = "ACTIVO" # 'ACTIVO' | 'INACTIVO' | 'EXPIRADO' | 'REVOCADO'

class ConfigSRICreacion(ConfigSRIBase):
    certificado_digital: str # Base64
    clave_certificado: str

class ConfigSRIActualizacion(BaseModel):
    ambiente: Optional[str] = None
    tipo_emision: Optional[str] = None
    certificado_digital: Optional[str] = None
    clave_certificado: Optional[str] = None
    estado: Optional[str] = None

class ConfigSRIActualizacionParametros(BaseModel):
    ambiente: str
    tipo_emision: str

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

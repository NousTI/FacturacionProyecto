from uuid import UUID
from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, Field

# Base
class ReporteGeneradoBase(BaseModel):
    empresa_id: UUID
    usuario_id: UUID
    tipo_reporte: str
    nombre: str
    parametros: Optional[Dict[str, Any]] = None
    formato: str
    archivo_url: Optional[str] = None
    tamanio_bytes: Optional[int] = Field(None, ge=0)
    estado: str = 'GENERADO'
    fecha_expiracion: Optional[datetime] = None

# Create
class ReporteGeneradoCreate(BaseModel):
    # empresa_id derived from context usually, or passed
    empresa_id: Optional[UUID] = None
    usuario_id: Optional[UUID] = None # Superadmin must specify
    tipo_reporte: str
    nombre: str
    parametros: Optional[Dict[str, Any]] = None
    formato: str
    
    # Optional fields that might be set on initial creation or update
    archivo_url: Optional[str] = None
    tamanio_bytes: Optional[int] = Field(None, ge=0)

# Update
class ReporteGeneradoUpdate(BaseModel):
    nombre: Optional[str] = None
    estado: Optional[str] = None
    archivo_url: Optional[str] = None
    descargas: Optional[int] = None
    fecha_expiracion: Optional[datetime] = None

# Read
class ReporteGeneradoRead(ReporteGeneradoBase):
    id: UUID
    fecha_generacion: datetime
    descargas: int
    created_at: datetime

    class Config:
        from_attributes = True

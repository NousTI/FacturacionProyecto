from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class ReporteGeneradoBase(BaseModel):
    tipo_reporte: str
    nombre: str
    parametros: Optional[Dict[str, Any]] = None
    formato: Optional[str] = None
    archivo_url: Optional[str] = None
    tamanio_bytes: Optional[int] = None
    estado: Optional[str] = "pendiente"
    fecha_expiracion: Optional[datetime] = None


class ReporteGeneradoCreacion(ReporteGeneradoBase):
    pass


class ReporteGeneradoActualizacion(BaseModel):
    tipo_reporte: Optional[str] = None
    nombre: Optional[str] = None
    parametros: Optional[Dict[str, Any]] = None
    formato: Optional[str] = None
    archivo_url: Optional[str] = None
    tamanio_bytes: Optional[int] = None
    estado: Optional[str] = None
    fecha_expiracion: Optional[datetime] = None


class ReporteGeneradoLectura(ReporteGeneradoBase):
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    fecha_generacion: datetime
    descargas: int
    created_at: datetime

    class Config:
        from_attributes = True

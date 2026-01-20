from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class ReporteBase(BaseModel):
    nombre: str
    tipo: str # 'VENTAS', 'GASTOS', etc.
    parametros: Optional[Dict[str, Any]] = None
    url_descarga: Optional[str] = None
    estado: str = 'PENDIENTE'

class ReporteCreacion(ReporteBase):
    empresa_id: Optional[UUID] = None
    usuario_id: Optional[UUID] = None

class ReporteLectura(ReporteBase):
    id: UUID
    empresa_id: UUID
    usuario_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

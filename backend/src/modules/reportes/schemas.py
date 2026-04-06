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
    empresa_id: Optional[UUID] = None
    usuario_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MetricasVendedorLectura(BaseModel):
    total_empresas: int
    empresas_activas: int
    total_usuarios: int
    usuarios_activos: int
    total_vencidas: int = 0
    total_proximas: int = 0
    monto_comisiones: float = 0.0
    comisiones_mes: float = 0.0
    empresas_inactivas: int = 0
    tendencia_crecimiento: List[Dict[str, Any]] = []





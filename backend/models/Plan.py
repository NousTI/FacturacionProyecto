from uuid import UUID
from typing import Optional, Dict, Any
from pydantic import BaseModel

class PlanBase(BaseModel):
    codigo: str
    nombre: str
    precio_mensual: float
    max_usuarios: Optional[int] = None
    max_facturas_mes: Optional[int] = None
    max_establecimientos: Optional[int] = None
    facturacion_programada: bool = False
    caracteristicas: Optional[Dict[str, Any]] = None
    visible_publico: bool = True
    activo: bool = True

class PlanCreate(PlanBase):
    pass

class PlanRead(PlanBase):
    id: UUID

    class Config:
        from_attributes = True

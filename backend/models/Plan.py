from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class PlanBase(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = ""
    precio_mensual: float
    max_usuarios: int
    max_facturas_mes: int
    max_establecimientos: int
    max_programaciones: int
    caracteristicas: Optional[List[Dict[str, str]]] = []
    bloqueo_automatico: bool = False
    visible_publico: bool = True
    activo: bool = True
    orden: int = 0

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_mensual: Optional[float] = None
    max_usuarios: Optional[int] = None
    max_facturas_mes: Optional[int] = None
    max_establecimientos: Optional[int] = None
    max_programaciones: Optional[int] = None
    caracteristicas: Optional[List[Dict[str, str]]] = None
    bloqueo_automatico: Optional[bool] = None
    visible_publico: Optional[bool] = None
    activo: Optional[bool] = None
    orden: Optional[int] = None

class PlanRead(PlanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

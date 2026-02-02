from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional, List

class ClienteBase(BaseModel):
    nombres: str
    apellidos: str
    email: EmailStr
    telefono: str
    empresa_id: UUID
    empresa_rol_id: Optional[UUID] = None
    avatar_url: Optional[str] = None
    activo: bool = True

class ClienteCreacion(ClienteBase):
    pass

class ClienteLectura(ClienteBase):
    id: UUID
    user_id: UUID
    empresa_nombre: Optional[str] = None
    rol_nombre: Optional[str] = None
    ultimo_acceso: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ClienteActualizacion(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    empresa_rol_id: Optional[UUID] = None
    avatar_url: Optional[str] = None
    activo: Optional[bool] = None

class ClienteStats(BaseModel):
    total: int
    activos: int
    inactivos: int

class ClienteConTrazabilidad(ClienteLectura):
    """Cliente con información de trazabilidad de creación"""
    creado_por_nombre: Optional[str] = None
    creado_por_email: Optional[str] = None
    creado_por_rol: Optional[str] = None
    origen_creacion: Optional[str] = None  # 'superadmin', 'vendedor', 'sistema'
    fecha_creacion_log: Optional[datetime] = None

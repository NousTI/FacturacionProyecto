from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr

class UsuarioBase(BaseModel):
    empresa_id: UUID
    empresa_rol_id: UUID
    nombres: str
    apellidos: str
    telefono: str
    avatar_url: Optional[str] = None
    activo: bool = True

class UsuarioCreacion(BaseModel):
    email: EmailStr
    password: str
    empresa_id: UUID
    empresa_rol_id: UUID
    nombres: str
    apellidos: str
    telefono: str
    avatar_url: Optional[str] = None

class UsuarioActualizacion(BaseModel):
    empresa_rol_id: Optional[UUID] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    avatar_url: Optional[str] = None
    activo: Optional[bool] = None

class UsuarioLectura(UsuarioBase):
    id: UUID
    user_id: UUID
    email: Optional[str] = None
    rol_nombre: Optional[str] = None
    rol_codigo: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

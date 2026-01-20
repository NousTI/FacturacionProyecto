from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    correo: EmailStr
    telefono: Optional[str] = None
    empresa_id: Optional[UUID] = None
    rol_id: Optional[UUID] = None
    # Otros campos según modelo DB

class UsuarioCreacion(UsuarioBase):
    clave: str # password

class UsuarioActualizacion(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    # correo: Optional[EmailStr] = None # Permitir cambio de correo? Logic dice que si.
    telefono: Optional[str] = None
    # empresa_id, rol_id? Depende de reglas. El service legacy lo permitía.

class CambioClave(BaseModel):
    clave_nueva: str

class UsuarioLectura(UsuarioBase):
    id: UUID
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    # Ocultar clave hash

    class Config:
        from_attributes = True

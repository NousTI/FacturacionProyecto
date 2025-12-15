from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    fk_suscripcion: int
    fk_rol: int
    correo: EmailStr
    usuario: str
    activo: bool = True

class UserCreate(UserBase):
    contrasena: str

class UserRegister(UserBase):
    contrasena: str

class UserRead(UserBase):
    id: int
    ultimo_acceso: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    correo: EmailStr
    contrasena: str

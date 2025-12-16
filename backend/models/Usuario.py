from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    empresa_id: UUID
    rol_id: UUID
    email: EmailStr
    nombres: str
    apellidos: str
    activo: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    empresa_id: Optional[UUID] = None
    rol_id: Optional[UUID] = None
    email: Optional[EmailStr] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = None

class UserRead(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class PasswordReset(BaseModel):
    new_password: str

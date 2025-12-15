from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class SuperadminBase(BaseModel):
    email: EmailStr
    nombres: str
    apellidos: str
    activo: bool = True

class SuperadminCreate(SuperadminBase):
    password: str

class SuperadminRead(SuperadminBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

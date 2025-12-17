from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class ClienteBase(BaseModel):
    identificacion: str
    tipo_identificacion: str  # SQL is NOT NULL
    razon_social: str
    email: Optional[EmailStr] = None
    activo: bool = True

class ClienteCreate(ClienteBase):
    empresa_id: UUID

class ClienteUpdate(BaseModel):
    identificacion: Optional[str] = None
    tipo_identificacion: Optional[str] = None
    razon_social: Optional[str] = None
    email: Optional[EmailStr] = None
    activo: Optional[bool] = None

class ClienteRead(ClienteBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

from typing import Optional
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class ProveedorBase(BaseModel):
    nombre: str
    ruc: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    activo: Optional[bool] = True

class ProveedorCreate(ProveedorBase):
    empresa_id: Optional[UUID] = None # Injected by Service

class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    ruc: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    activo: Optional[bool] = None

class ProveedorResponse(ProveedorBase):
    id: UUID
    empresa_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

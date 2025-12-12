from typing import Optional
from pydantic import BaseModel

class ProveedorBase(BaseModel):
    nombre: str
    ruc: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorResponse(ProveedorBase):
    id: int

    model_config = {
        "from_attributes": True
    }

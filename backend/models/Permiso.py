from pydantic import BaseModel

class PermisoBase(BaseModel):
    nombre: str
    codigo: str = None  # Optional initially, as DB migration might not have it populated yet

class PermisoRead(PermisoBase):
    id: int

    class Config:
        from_attributes = True

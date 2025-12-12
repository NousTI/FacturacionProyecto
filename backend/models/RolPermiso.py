from pydantic import BaseModel

class RolPermisoBase(BaseModel):
    fk_rol: int
    fk_permiso: int

class RolPermisoRead(RolPermisoBase):
    class Config:
        from_attributes = True

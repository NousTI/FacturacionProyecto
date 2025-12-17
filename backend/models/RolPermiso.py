from pydantic import BaseModel
from uuid import UUID

class RolPermisoBase(BaseModel):
    rol_id: UUID
    permiso_id: UUID
    activo: bool = True

class RolPermisoRead(RolPermisoBase):
    pass

from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional

class AsignacionRolRequest(BaseModel):
    user_id: UUID = Field(..., description="ID del usuario al que se le asigna/remueve el rol")
    role_id: UUID = Field(..., description="ID del rol a gestionar")
    motivo: Optional[str] = Field(None, description="Motivo del cambio")

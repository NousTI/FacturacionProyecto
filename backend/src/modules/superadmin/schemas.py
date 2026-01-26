from pydantic import BaseModel, Field
from typing import Optional

class PerfilUpdate(BaseModel):
    nombres: Optional[str] = Field(None, min_length=2)
    apellidos: Optional[str] = Field(None, min_length=2)
    activo: Optional[bool] = Field(None)

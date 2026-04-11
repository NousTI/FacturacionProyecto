from pydantic import BaseModel, Field
from typing import Optional

class PerfilUpdate(BaseModel):
    nombres: Optional[str] = Field(None, min_length=2)
    apellidos: Optional[str] = Field(None, min_length=2)
    telefono: Optional[str] = Field(None, min_length=10, max_length=10, pattern=r"^09\d{8}$")
    activo: Optional[bool] = Field(None)

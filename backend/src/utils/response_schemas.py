from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, Any
from datetime import datetime

T = TypeVar("T")

class RespuestaBase(BaseModel, Generic[T]):
    ok: bool = True
    mensaje: str = "Operación exitosa"
    codigo: str = "EXITO"
    detalles: Optional[T] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat() + "Z")

    class Config:
        from_attributes = True

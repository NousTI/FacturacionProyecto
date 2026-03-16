from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID, uuid4

class TestItem(BaseModel):
    id: UUID = uuid4()
    nombre: str
    valor: float
    activo: bool = True

class TestResponse(BaseModel):
    items: List[TestItem]
    total: int
    mensaje: str

from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel

class ConfigLectura(BaseModel):
    id: Optional[str] = None
    clave: str
    valor: str
    descripcion: Optional[str] = None
    categoria: str
    updated_at: Optional[datetime] = None

class ConfigActualizacion(BaseModel):
    valor: str

class FlagLectura(BaseModel):
    id: Optional[str] = None
    codigo: str
    activo: bool
    descripcion: Optional[str] = None

class FlagActualizacion(BaseModel):
    activo: bool

class CatalogoLectura(BaseModel):
    id: Optional[str] = None
    nombre: str
    items: List[Any]

class PlantillaLectura(BaseModel):
    id: Optional[str] = None
    codigo: str
    titulo: str
    contenido_html: str
    variables: List[str]

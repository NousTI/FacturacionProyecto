from pydantic import BaseModel

class RolBase(BaseModel):
    nombre: str

class RolRead(RolBase):
    id: int

    class Config:
        from_attributes = True

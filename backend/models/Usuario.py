# models/user_model.py

from typing import Optional

from pydantic import BaseModel

from schemas.common import Username, Password, NullableEmail


class UserRegister(BaseModel):
    usuario: Username
    contrasena: Password
    fk_rol: int
    fk_suscripcion: int
    correo: Optional[NullableEmail] = None


class UserLogin(BaseModel):
    usuario: Username
    contrasena: Password


class UserRead(BaseModel):
    id: int
    fk_rol: int
    fk_suscripcion: int
    usuario: str
    correo: Optional[NullableEmail] = None

    model_config = {
        "from_attributes": True  # reemplaza orm_mode en Pydantic V2
    }

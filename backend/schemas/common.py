# backend/schemas/common.py
from typing import Optional

from pydantic import EmailStr, constr

# Tipos reutilizables para campos comunes
Username = constr(strip_whitespace=True, min_length=3, max_length=50)
Password = constr(strip_whitespace=True, min_length=8, max_length=128)
Identification = constr(strip_whitespace=True, min_length=6, max_length=20)
Phone = Optional[constr(strip_whitespace=True, min_length=7, max_length=20, pattern=r"^[0-9+\-\s]+$")]
Address = Optional[constr(strip_whitespace=True, min_length=3, max_length=200)]
NullableEmail = Optional[EmailStr]

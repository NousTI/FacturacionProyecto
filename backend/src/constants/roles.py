from enum import Enum

class RolCodigo(str, Enum):
    SUPERADMIN = "SUPERADMIN"
    VENDEDOR = "VENDEDOR"
    USUARIO = "USUARIO"

from enum import Enum

class RolCodigo(str, Enum):
    ADMIN = "ADMIN"
    VENDEDOR = "VENDEDOR"
    SUPERADMIN = "SUPERADMIN"
    USUARIO = "USUARIO"

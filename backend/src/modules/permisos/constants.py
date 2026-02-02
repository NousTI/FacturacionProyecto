from enum import Enum

class PermisosVendedor(str, Enum):
    CREAR_EMPRESAS = "puede_crear_empresas"
    GESTIONAR_PLANES = "puede_gestionar_planes"
    ACCEDER_EMPRESAS = "puede_acceder_empresas"
    VER_REPORTES = "puede_ver_reportes"

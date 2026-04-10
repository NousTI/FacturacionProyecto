from .empresa_permisos.base import ModuloPermisos
from .empresa_permisos.codes import PermissionCodes
from .empresa_permisos.catalog_clientes import CLIENTES_PERMS
from .empresa_permisos.catalog_productos import PRODUCTOS_PERMS
from .empresa_permisos.catalog_facturas import FACTURAS_PERMS
from .empresa_permisos.catalog_inventario import INVENTARIO_PERMS
from .empresa_permisos.catalog_gastos import GASTOS_PERMS
from .empresa_permisos.catalog_config import CONFIG_PERMS
from .empresa_permisos.catalog_usuarios import USUARIOS_PERMS
from .empresa_permisos.catalog_roles import ROLES_PERMS
from .empresa_permisos.catalog_establecimientos import ESTABLECIMIENTO_PERMS
from .empresa_permisos.catalog_reportes import REPORTES_PERMS
from .empresa_permisos.catalog_otros import OTROS_PERMS

# Catálogo de Permisos Base (Agregado de fragmentos)
PERMISOS_BASE = {
    **CLIENTES_PERMS,
    **PRODUCTOS_PERMS,
    **FACTURAS_PERMS,
    **INVENTARIO_PERMS,
    **GASTOS_PERMS,
    **CONFIG_PERMS,
    **USUARIOS_PERMS,
    **ROLES_PERMS,
    **ESTABLECIMIENTO_PERMS,
    **REPORTES_PERMS,
    **OTROS_PERMS
}

# Re-exportamos para mantener compatibilidad total con el resto del sistema
__all__ = [
    'ModuloPermisos',
    'PermissionCodes',
    'PERMISOS_BASE'
]

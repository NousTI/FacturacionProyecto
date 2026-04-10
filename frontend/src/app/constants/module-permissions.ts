/**
 * MAPEO DE MÓDULOS Y PERMISOS REQUERIDOS
 * Define qué módulo requiere qué permiso
 */

export interface ModuleConfig {
  path: string;
  name: string;
  requiredPermissions: string[]; // Al menos uno de estos
  icon?: string;
}

export const USUARIO_MODULES: ModuleConfig[] = [
  {
    path: '/usuario/dashboard',
    name: 'Dashboard',
    requiredPermissions: ['DASHBOARD_VER'],
    icon: 'dashboard'
  },
  {
    path: '/usuario/clientes',
    name: 'Clientes',
    requiredPermissions: ['CLIENTES_VER'],
    icon: 'people'
  },
  {
    path: '/usuario/productos',
    name: 'Productos',
    requiredPermissions: ['PRODUCTOS_VER'],
    icon: 'package'
  },
  {
    path: '/usuario/facturacion',
    name: 'Facturación',
    requiredPermissions: ['FACTURAS_VER_TODAS', 'FACTURAS_VER_PROPIAS'],
    icon: 'receipt'
  },
  {
    path: '/usuario/facturacion-recurrente',
    name: 'Facturación Recurrente',
    requiredPermissions: ['FACTURA_PROGRAMADA_VER'],
    icon: 'schedule'
  },
  {
    path: '/usuario/gastos',
    name: 'Gastos y Egresos',
    requiredPermissions: ['GASTOS_VER'],
    icon: 'money'
  },
  {
    path: '/usuario/inventarios',
    name: 'Inventarios',
    requiredPermissions: ['INVENTARIO_VER'],
    icon: 'warehouse'
  },
  {
    path: '/usuario/proveedores',
    name: 'Proveedores',
    requiredPermissions: ['PROVEEDOR_VER'],
    icon: 'business'
  },
  {
    path: '/usuario/cuentas-cobrar',
    name: 'Cuentas por Cobrar',
    requiredPermissions: ['CUENTA_COBRAR_VER'],
    icon: 'trending_up'
  },
  {
    path: '/usuario/establecimientos',
    name: 'Establecimientos',
    requiredPermissions: ['ESTABLECIMIENTO_VER', 'ESTABLECIMIENTO_GESTIONAR'],
    icon: 'store'
  },
  {
    path: '/usuario/puntos-emision',
    name: 'Puntos de Emisión',
    requiredPermissions: ['PUNTO_EMISION_VER', 'PUNTO_EMISION_GESTIONAR'],
    icon: 'print'
  },
  {
    path: '/usuario/reportes',
    name: 'Reportes',
    requiredPermissions: ['REPORTES_VER'],
    icon: 'bar_chart'
  },
  {
    path: '/usuario/empresa',
    name: 'Empresa',
    requiredPermissions: ['CONFIG_EMPRESA'],
    icon: 'settings'
  },
  {
    path: '/usuario/certificado-sri',
    name: 'Certificado SRI',
    requiredPermissions: ['CONFIG_SRI'],
    icon: 'security'
  },
  {
    path: '/usuario/usuarios',
    name: 'Usuarios',
    requiredPermissions: ['USUARIOS_EMPRESA_VER', 'USUARIOS_GESTIONAR'],
    icon: 'group'
  },
  {
    path: '/usuario/roles',
    name: 'Roles y Permisos',
    requiredPermissions: ['CONFIG_ROLES'],
    icon: 'admin_panel_settings'
  }
];

/**
 * Obtener el primer módulo al que el usuario tiene acceso
 */
export function getFirstAccessibleModule(userPermissions: string[]): ModuleConfig | null {
  for (const module of USUARIO_MODULES) {
    // Si el usuario tiene al menos uno de los permisos requeridos
    if (module.requiredPermissions.some(perm => userPermissions.includes(perm))) {
      return module;
    }
  }
  return null;
}

/**
 * Filtrar módulos que el usuario puede acceder
 */
export function getAccessibleModules(userPermissions: string[]): ModuleConfig[] {
  return USUARIO_MODULES.filter(module =>
    module.requiredPermissions.some(perm => userPermissions.includes(perm))
  );
}

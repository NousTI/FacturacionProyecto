/**
 * PERMISSION CODES - Sistema de Facturación
 * Todos los códigos de permiso disponibles en el sistema
 * Sincronizados con el archivo codigos_permisos.txt (Base de Datos)
 */

// ============================================================================
// MÓDULO: CLIENTES
// ============================================================================
export const CLIENTES_PERMISSIONS = {
  VER: 'CLIENTES_VER',
  CREAR: 'CLIENTES_CREAR',
  EDITAR: 'CLIENTES_EDITAR',
  ELIMINAR: 'CLIENTES_ELIMINAR',
  EXPORTAR: 'CLIENTES_EXPORTAR'
} as const;

// ============================================================================
// MÓDULO: PRODUCTOS
// ============================================================================
export const PRODUCTOS_PERMISSIONS = {
  VER: 'PRODUCTOS_VER',
  CREAR: 'PRODUCTOS_CREAR',
  EDITAR: 'PRODUCTOS_EDITAR',
  ELIMINAR: 'PRODUCTOS_ELIMINAR',
  VER_COSTOS: 'PRODUCTOS_VER_COSTOS'
} as const;

// ============================================================================
// MÓDULO: FACTURAS
// ============================================================================
export const FACTURAS_PERMISSIONS = {
  VER_TODAS: 'FACTURAS_VER_TODAS',
  VER_PROPIAS: 'FACTURAS_VER_PROPIAS',
  CREAR: 'FACTURAS_CREAR',
  EDITAR: 'FACTURAS_EDITAR',
  ANULAR: 'FACTURAS_ANULAR',
  ENVIAR_SRI: 'FACTURAS_ENVIAR_SRI',
  DESCARGAR_PDF: 'FACTURAS_DESCARGAR_PDF',
  ENVIAR_EMAIL: 'FACTURAS_ENVIAR_EMAIL',
  // Pagos de Facturas
  PAGO_VER: 'PAGO_FACTURA_VER',
  PAGO_CREAR: 'PAGO_FACTURA_CREAR',
  PAGO_EDITAR: 'PAGO_FACTURA_EDITAR',
  PAGO_ELIMINAR: 'PAGO_FACTURA_ELIMINAR'
} as const;

// ============================================================================
// MÓDULO: FACTURACIÓN PROGRAMADA / RECURRENTE
// ============================================================================
export const FACTURACION_PROGRAMADA_PERMISSIONS = {
  VER: 'FACTURA_PROGRAMADA_VER',
  VER_PROPIAS: 'FACTURA_PROGRAMADA_VER_PROPIAS',
  CREAR: 'FACTURA_PROGRAMADA_CREAR',
  EDITAR: 'FACTURA_PROGRAMADA_EDITAR',
  ELIMINAR: 'FACTURA_PROGRAMADA_ELIMINAR'
} as const;

// ============================================================================
// MÓDULO: GASTOS
// ============================================================================
export const GASTOS_PERMISSIONS = {
  VER: 'GASTOS_VER',
  CREAR: 'GASTOS_CREAR',
  EDITAR: 'GASTOS_EDITAR',
  ELIMINAR: 'GASTOS_ELIMINAR',
  // Categorías de Gastos
  CATEGORIA_VER: 'CATEGORIA_GASTO_VER',
  CATEGORIA_CREAR: 'CATEGORIA_GASTO_CREAR',
  CATEGORIA_EDITAR: 'CATEGORIA_GASTO_EDITAR',
  CATEGORIA_ELIMINAR: 'CATEGORIA_GASTO_ELIMINAR',
  // Pagos de Gastos
  PAGO_VER: 'PAGO_GASTO_VER',
  PAGO_CREAR: 'PAGO_GASTO_CREAR',
  PAGO_EDITAR: 'PAGO_GASTO_EDITAR',
  PAGO_ELIMINAR: 'PAGO_GASTO_ELIMINAR'
} as const;


// ============================================================================
// MÓDULO: PROVEEDORES
// ============================================================================
export const PROVEEDORES_PERMISSIONS = {
  VER: 'PROVEEDOR_VER',
  CREAR: 'PROVEEDOR_CREAR',
  EDITAR: 'PROVEEDOR_EDITAR',
  ELIMINAR: 'PROVEEDOR_ELIMINAR'
} as const;

// ============================================================================
// MÓDULO: ESTABLECIMIENTOS Y PUNTOS DE EMISIÓN
// ============================================================================
export const ESTABLECIMIENTOS_PERMISSIONS = {
  VER: 'ESTABLECIMIENTO_VER',
  GESTIONAR: 'ESTABLECIMIENTO_GESTIONAR'
} as const;

export const PUNTOS_EMISION_PERMISSIONS = {
  VER: 'PUNTO_EMISION_VER',
  GESTIONAR: 'PUNTO_EMISION_GESTIONAR'
} as const;

// ============================================================================
// MÓDULO: REPORTES
// ============================================================================
export const REPORTES_PERMISSIONS = {
  VER: 'REPORTES_VER',
  GENERAR: 'REPORTES_GENERAR',
  EXPORTAR: 'REPORTES_EXPORTAR'
} as const;

// ============================================================================
// MÓDULO: CONFIGURACIÓN
// ============================================================================
export const CONFIGURACION_PERMISSIONS = {
  EMPRESA: 'CONFIG_EMPRESA',
  SRI: 'CONFIG_SRI',
  ROLES: 'CONFIG_ROLES'
} as const;

// ============================================================================
// MÓDULO: USUARIOS Y ROLES
// ============================================================================
export const USUARIOS_PERMISSIONS = {
  // Usuarios de Empresa
  VER: 'USUARIOS_VER',
  CREAR: 'USUARIOS_CREAR',
  EDITAR: 'USUARIOS_EDITAR',
  ELIMINAR: 'USUARIOS_ELIMINAR',
} as const;

export const ROLES_PERMISSIONS = {
  VER: 'ROLES_VER',
  CREAR: 'ROLES_CREAR',
  EDITAR: 'ROLES_EDITAR',
  ELIMINAR: 'ROLES_ELIMINAR',
  CONFIG: 'CONFIG_ROLES'
} as const;

// ============================================================================
// MÓDULO: OTROS
// ============================================================================
export const OTROS_PERMISSIONS = {
  DASHBOARD_VER: 'DASHBOARD_VER',
  CUENTA_COBRAR_VER: 'CUENTA_COBRAR_VER',
} as const;

// ============================================================================
// EXPORT TODOS LOS PERMISOS EN UN OBJETO CENTRALIZADO
// ============================================================================
export const ALL_PERMISSIONS = {
  CLIENTES: CLIENTES_PERMISSIONS,
  PRODUCTOS: PRODUCTOS_PERMISSIONS,
  FACTURAS: FACTURAS_PERMISSIONS,
  FACTURACION_PROGRAMADA: FACTURACION_PROGRAMADA_PERMISSIONS,
  GASTOS: GASTOS_PERMISSIONS,
  PROVEEDORES: PROVEEDORES_PERMISSIONS,
  ESTABLECIMIENTOS: ESTABLECIMIENTOS_PERMISSIONS,
  PUNTOS_EMISION: PUNTOS_EMISION_PERMISSIONS,
  REPORTES: REPORTES_PERMISSIONS,
  CONFIGURACION: CONFIGURACION_PERMISSIONS,
  USUARIOS: USUARIOS_PERMISSIONS,
  ROLES: ROLES_PERMISSIONS,
  OTROS: OTROS_PERMISSIONS
} as const;

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================
export type ClientesPermission = typeof CLIENTES_PERMISSIONS[keyof typeof CLIENTES_PERMISSIONS];
export type ProductosPermission = typeof PRODUCTOS_PERMISSIONS[keyof typeof PRODUCTOS_PERMISSIONS];
export type FacturasPermission = typeof FACTURAS_PERMISSIONS[keyof typeof FACTURAS_PERMISSIONS];
export type GastosPermission = typeof GASTOS_PERMISSIONS[keyof typeof GASTOS_PERMISSIONS];
export type ProveedoresPermission = typeof PROVEEDORES_PERMISSIONS[keyof typeof PROVEEDORES_PERMISSIONS];
export type EstablecimientosPermission = typeof ESTABLECIMIENTOS_PERMISSIONS[keyof typeof ESTABLECIMIENTOS_PERMISSIONS];
export type PuntosEmisionPermission = typeof PUNTOS_EMISION_PERMISSIONS[keyof typeof PUNTOS_EMISION_PERMISSIONS];
export type ReportesPermission = typeof REPORTES_PERMISSIONS[keyof typeof REPORTES_PERMISSIONS];
export type ConfiguracionPermission = typeof CONFIGURACION_PERMISSIONS[keyof typeof CONFIGURACION_PERMISSIONS];
export type UsuariosPermission = typeof USUARIOS_PERMISSIONS[keyof typeof USUARIOS_PERMISSIONS];
export type RolesPermission = typeof ROLES_PERMISSIONS[keyof typeof ROLES_PERMISSIONS];
export type OtrosPermission = typeof OTROS_PERMISSIONS[keyof typeof OTROS_PERMISSIONS];

// Union de todos los permisos para type safety
export type AnyPermission =
  | ClientesPermission
  | ProductosPermission
  | FacturasPermission
  | GastosPermission
  | ProveedoresPermission
  | EstablecimientosPermission
  | PuntosEmisionPermission
  | ReportesPermission
  | ConfiguracionPermission
  | UsuariosPermission
  | RolesPermission
  | OtrosPermission;

// ============================================================================
// UTILIDAD: Obtener todos los códigos de permiso como string[]
// ============================================================================
export function getAllPermissionCodes(): string[] {
  const codes: string[] = [];

  const addPermissions = (obj: any) => {
    Object.values(obj).forEach((value: any) => {
      if (typeof value === 'string') {
        codes.push(value);
      }
    });
  };

  addPermissions(CLIENTES_PERMISSIONS);
  addPermissions(PRODUCTOS_PERMISSIONS);
  addPermissions(FACTURAS_PERMISSIONS);
  addPermissions(FACTURACION_PROGRAMADA_PERMISSIONS);
  addPermissions(GASTOS_PERMISSIONS);
  addPermissions(PROVEEDORES_PERMISSIONS);
  addPermissions(ESTABLECIMIENTOS_PERMISSIONS);
  addPermissions(PUNTOS_EMISION_PERMISSIONS);
  addPermissions(REPORTES_PERMISSIONS);
  addPermissions(CONFIGURACION_PERMISSIONS);
  addPermissions(USUARIOS_PERMISSIONS);
  addPermissions(ROLES_PERMISSIONS);
  addPermissions(OTROS_PERMISSIONS);

  // Remover duplicados
  return [...new Set(codes)];
}

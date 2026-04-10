# Auditoría de Permisos en Sidebar

## Estado Actual vs Esperado

### ✅ CORRECTOS (usando permisos adecuados)
- Dashboard: `DASHBOARD_VER`
- Usuarios: `CONFIG_USUARIOS` 
- Roles: `CONFIG_ROLES`
- Clientes: `CLIENTES_VER`
- Proveedores: `PROVEEDOR_VER`
- Gastos: `GASTOS_VER`
- Inventarios: `INVENTARIO_VER`
- Productos: `PRODUCTOS_VER`
- Facturación: `['FACTURAS_VER_TODAS', 'FACTURAS_VER_PROPIAS', 'FACTURAS_CREAR']` ✓
- Cuentas por Cobrar: `CUENTA_COBRAR_VER`
- Facturación Recurrente: `['FACTURA_PROGRAMADA_VER', 'FACTURAS_VER_TODAS']`
- Reportes: `['REPORTES_VER', 'REPORTES_EXPORTAR']`
- Establecimientos: `['ESTABLECIMIENTO_VER', 'CONFIG_ESTABLECIMIENTOS']` - Revisar si se puede simplificar
- Puntos Emisión: `['PUNTO_EMISION_VER', 'CONFIG_ESTABLECIMIENTOS']` - Debería ser `PUNTO_EMISION_GESTIONAR`
- Certificado SRI: `CONFIG_SRI`
- Empresa: `CONFIG_EMPRESA`

### ❌ PROBLEMAS ENCONTRADOS

#### 1. **Permiso inconsistente en Vendedor**
```
Ubicación: sidebar.component.ts línea 72
Actual: *appHasPermission="'ver_reportes'"
Debe ser: *appHasPermission="'REPORTES_VER'"
```

#### 2. **Permisos legacy en Vendedor**
```
Ubicación: sidebar.component.ts línea 57
Actual: *appHasPermission="['acceder_empresas', 'crear_empresas']"
Debe ser: *appHasPermission="['ACCEDER_EMPRESAS', 'CREAR_EMPRESAS']"
Nota: Verificar si existen en backend (VendedorPermissions enum)
```

#### 3. **Puntos Emisión - Permiso incorrecto**
```
Ubicación: sidebar.component.ts línea 130
Actual: *appHasPermission="['PUNTO_EMISION_VER', 'CONFIG_ESTABLECIMIENTOS']"
Debe ser: *appHasPermission="['PUNTO_EMISION_VER', 'PUNTO_EMISION_GESTIONAR']"
Razón: El usuario que puede gestionar puntos de emisión debe tener PUNTO_EMISION_GESTIONAR, no CONFIG_ESTABLECIMIENTOS
```

#### 4. **Falta completar en Content (Acciones)**
```
Módulos SIN protección de permisos en botones/acciones internas:
- Productos (crear, editar, eliminar)
- Clientes (crear, editar, eliminar)
- Proveedores (crear, editar, eliminar)
- Establecimientos (crear, editar, eliminar)
- Puntos Emisión (crear, editar, eliminar)
- Roles (crear, editar, eliminar)
- Usuarios (crear, editar, eliminar)
- Gastos (crear, editar, eliminar, categorías, pagos)
- Inventarios (crear, editar, eliminar)
- Dashboard (quick actions)
- Reportes (exportar funciones específicas)
- Empresa (editar)
- Certificado SRI (editar)

Acción requerida: Agregar directivas *appHasPermission en los componentes de acciones
```

## Resumen de Cambios Necesarios

| Módulo | Cambio | Prioridad |
|--------|--------|-----------|
| Vendedor - Reportes | `'ver_reportes'` → `REPORTES_VER` | Alta |
| Vendedor - Empresas | Verificar permisos legacy | Alta |
| Puntos Emisión | `CONFIG_ESTABLECIMIENTOS` → `PUNTO_EMISION_GESTIONAR` | Media |
| Todos los módulos | Agregar protección en acciones (16 módulos) | Alta |

## Pasos a Seguir

1. **Corregir sidebar.component.ts** - Cambios de 3 líneas
2. **Implementar protección en acciones** - Usar `PERMISOS_PERMISSIONS.*` del archivo `permission-codes.ts`
3. **Validar con backend** - Asegurar que permisos legacy de vendedor existan en backend

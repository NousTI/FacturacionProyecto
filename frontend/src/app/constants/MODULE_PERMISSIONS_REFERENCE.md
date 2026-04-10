# Referencia Rápida: Permisos por Módulo

Use esta guía para saber exactamente qué permisos agregar a cada módulo.

## Importar en Componentes

```typescript
import { CLIENTES_PERMISSIONS, PRODUCTOS_PERMISSIONS, ... } from '@app/constants/permission-codes';
```

O en templates:

```html
<button *appHasPermission="'CLIENTES_CREAR'">Crear Cliente</button>
```

---

## 📋 Módulo: CLIENTES

### Sidebar

```html
<a *appHasPermission="'CLIENTES_VER'" routerLink="/usuario/clientes">Clientes</a>
```

### Actions/Botones

| Acción            | Permiso             | Donde                      |
| ----------------- | ------------------- | -------------------------- |
| Ver clientes      | `CLIENTES_VER`      | cliente-table              |
| Crear cliente     | `CLIENTES_CREAR`    | cliente-actions (botón)    |
| Editar cliente    | `CLIENTES_EDITAR`   | cliente-actions (dropdown) |
| Eliminar cliente  | `CLIENTES_ELIMINAR` | cliente-actions (dropdown) |
| Exportar clientes | `CLIENTES_EXPORTAR` | cliente-actions (botón)    |

---

## 📦 Módulo: PRODUCTOS

### Sidebar

```html
<a *appHasPermission="'PRODUCTOS_VER'" routerLink="/usuario/productos">Productos</a>
```

### Actions/Botones

| Acción            | Permiso                | Donde                                 |
| ----------------- | ---------------------- | ------------------------------------- |
| Ver productos     | `PRODUCTOS_VER`        | producto-table                        |
| Crear producto    | `PRODUCTOS_CREAR`      | producto-actions (botón "Nuevo Item") |
| Editar producto   | `PRODUCTOS_EDITAR`     | producto-table (dropdown)             |
| Eliminar producto | `PRODUCTOS_ELIMINAR`   | producto-table (dropdown)             |
| Ver costos        | `PRODUCTOS_VER_COSTOS` | producto-table/producto-detail        |

---

## 📄 Módulo: FACTURAS

### Sidebar

```html
<a
  *appHasPermission="['FACTURAS_VER_TODAS', 'FACTURAS_VER_PROPIAS', 'FACTURAS_CREAR']"
  routerLink="/usuario/facturacion"
  >Facturación</a
>
```

### Actions/Botones

| Acción         | Permiso                  | Donde                                   |
| -------------- | ------------------------ | --------------------------------------- |
| Ver todas      | `FACTURAS_VER_TODAS`     | factura-table                           |
| Ver propias    | `FACTURAS_VER_PROPIAS`   | factura-table (filtro)                  |
| Crear factura  | `FACTURAS_CREAR`         | factura-actions (botón "Nueva Factura") |
| Editar         | `FACTURAS_EDITAR`        | factura-table (dropdown)                |
| Enviar SRI     | `FACTURAS_ENVIAR_SRI`    | factura-table (dropdown)                |
| Descargar PDF  | `FACTURAS_DESCARGAR_PDF` | factura-table (dropdown)                |
| Enviar Email   | `FACTURAS_ENVIAR_EMAIL`  | factura-table (dropdown)                |
| Anular         | `FACTURAS_ANULAR`        | factura-table (dropdown)                |
| Ver pagos      | `PAGO_FACTURA_VER`       | -                                       |
| Registrar pago | `PAGO_FACTURA_CREAR`     | pagos modal                             |

---

## 💰 Módulo: GASTOS

### Sidebar

```html
<a *appHasPermission="'GASTOS_VER'" routerLink="/usuario/gastos">Gastos</a>
```

### Actions/Botones

| Acción             | Permiso                    | Donde                      |
| ------------------ | -------------------------- | -------------------------- |
| Ver gastos         | `GASTOS_VER`               | gasto-table                |
| Crear gasto        | `GASTOS_CREAR`             | gasto-form (botón)         |
| Editar gasto       | `GASTOS_EDITAR`            | gasto-form (dropdown)      |
| Eliminar gasto     | `GASTOS_ELIMINAR`          | gasto-table (dropdown)     |
| Ver categorías     | `CATEGORIA_GASTO_VER`      | categoria-table            |
| Crear categoría    | `CATEGORIA_GASTO_CREAR`    | categoria-form (botón)     |
| Editar categoría   | `CATEGORIA_GASTO_EDITAR`   | categoria-form (dropdown)  |
| Eliminar categoría | `CATEGORIA_GASTO_ELIMINAR` | categoria-table (dropdown) |
| Ver pagos          | `PAGO_GASTO_VER`           | pago-table                 |
| Registrar pago     | `PAGO_GASTO_CREAR`         | pago-form (botón)          |

---

## 📊 Módulo: INVENTARIOS

### Sidebar

```html
<a *appHasPermission="'INVENTARIO_VER'" routerLink="/usuario/inventarios">Inventarios</a>
```

### Actions/Botones

| Acción              | Permiso               | Donde                       |
| ------------------- | --------------------- | --------------------------- |
| Ver inventario      | `INVENTARIO_VER`      | inventario-table            |
| Crear movimiento    | `INVENTARIO_CREAR`    | inventario-form (botón)     |
| Editar movimiento   | `INVENTARIO_EDITAR`   | inventario-table (dropdown) |
| Eliminar movimiento | `INVENTARIO_ELIMINAR` | inventario-table (dropdown) |

---

## 👥 Módulo: PROVEEDORES

### Sidebar

```html
<a *appHasPermission="'PROVEEDOR_VER'" routerLink="/usuario/proveedores">Proveedores</a>
```

### Actions/Botones

| Acción             | Permiso              | Donde                      |
| ------------------ | -------------------- | -------------------------- |
| Ver proveedores    | `PROVEEDOR_VER`      | proveedor-table            |
| Crear proveedor    | `PROVEEDOR_CREAR`    | proveedor-actions (botón)  |
| Editar proveedor   | `PROVEEDOR_EDITAR`   | proveedor-table (dropdown) |
| Eliminar proveedor | `PROVEEDOR_ELIMINAR` | proveedor-table (dropdown) |

---

## 🏢 Módulo: ESTABLECIMIENTOS

### Sidebar

```html
<a
  *appHasPermission="['ESTABLECIMIENTO_VER', 'ESTABLECIMIENTO_GESTIONAR']"
  routerLink="/usuario/establecimientos"
  >Establecimientos</a
>
```

### Actions/Botones

| Acción               | Permiso                     | Donde                            |
| -------------------- | --------------------------- | -------------------------------- |
| Ver establecimientos | `ESTABLECIMIENTO_VER`       | establecimiento-table            |
| Crear                | `ESTABLECIMIENTO_GESTIONAR` | establecimiento-actions (botón)  |
| Editar               | `ESTABLECIMIENTO_GESTIONAR` | establecimiento-table (dropdown) |
| Eliminar             | `ESTABLECIMIENTO_GESTIONAR` | establecimiento-table (dropdown) |

---

## 🖨️ Módulo: PUNTOS DE EMISIÓN

### Sidebar

```html
<a
  *appHasPermission="['PUNTO_EMISION_VER', 'PUNTO_EMISION_GESTIONAR']"
  routerLink="/usuario/puntos-emision"
  >Puntos de Emisión</a
>
```

### Actions/Botones

| Acción     | Permiso                   | Donde                   |
| ---------- | ------------------------- | ----------------------- |
| Ver puntos | `PUNTO_EMISION_VER`       | puntos-table            |
| Crear      | `PUNTO_EMISION_GESTIONAR` | puntos-actions (botón)  |
| Editar     | `PUNTO_EMISION_GESTIONAR` | puntos-table (dropdown) |
| Eliminar   | `PUNTO_EMISION_GESTIONAR` | puntos-table (dropdown) |

---

## 📈 Módulo: REPORTES

### Sidebar

```html
<a *appHasPermission="['REPORTES_VER', 'REPORTES_EXPORTAR']" routerLink="/usuario/reportes"
  >Reportes</a
>
```

### Actions/Botones

| Acción           | Permiso             | Donde                           |
| ---------------- | ------------------- | ------------------------------- |
| Ver reportes     | `REPORTES_VER`      | reportes-page                   |
| Generar reporte  | `REPORTES_GENERAR`  | reporte-actions (botón)         |
| Exportar reporte | `REPORTES_EXPORTAR` | reportes-table (botón descarga) |

---

## ⚙️ Módulo: CONFIGURACIÓN

### Empresa

```html
<a *appHasPermission="'CONFIG_EMPRESA'" routerLink="/usuario/empresa">Empresa</a>
```

**Acciones:** `CONFIG_EMPRESA` en edit-empresa-modal

### Usuarios

```html
<a *appHasPermission="'USUARIOS_EMPRESA_VER'" routerLink="/usuario/usuarios">Usuarios</a>
```

**Acciones:**

- Crear: `USUARIOS_EMPRESA_CREAR`
- Editar: `USUARIOS_EMPRESA_EDITAR`
- Eliminar: `USUARIOS_EMPRESA_ELIMINAR`

### Roles

```html
<a *appHasPermission="'CONFIG_ROLES'" routerLink="/usuario/roles">Roles</a>
```

**Acciones:**

- Crear rol: `ROLES_CREAR`
- Editar rol: `ROLES_EDITAR`
- Eliminar rol: `ROLES_ELIMINAR`

### Certificado SRI

```html
<a *appHasPermission="'CONFIG_SRI'" routerLink="/usuario/certificado-sri">Certificado SRI</a>
```

**Acciones:** `CONFIG_SRI` en edit modal

---

## 📊 Módulo: DASHBOARD

### Sidebar

```html
<a *appHasPermission="'DASHBOARD_VER'" routerLink="/usuario/dashboard">Dashboard</a>
```

### Quick Actions

Considerar proteger acciones rápidas con permisos relevantes del módulo destino.

---

## Otros

### Cuentas por Cobrar

```html
<a *appHasPermission="'CUENTA_COBRAR_VER'" routerLink="/usuario/cuentas-cobrar"
  >Cuentas por Cobrar</a
>
```

### Facturación Recurrente

```html
<a
  *appHasPermission="['FACTURA_PROGRAMADA_VER', 'FACTURAS_VER_TODAS']"
  routerLink="/usuario/facturacion-recurrente"
  >Fac. Recurrente</a
>
```

---

## Template Examples

### Botón con permiso simple

```html
<button *appHasPermission="'CLIENTES_CREAR'" (click)="onCreate()">
  <i class="bi bi-plus-lg"></i> Nuevo Cliente
</button>
```

### Botón con múltiples permisos (OR logic)

```html
<button *appHasPermission="['FACTURAS_VER_TODAS', 'FACTURAS_VER_PROPIAS']" (click)="onView()">
  Ver Facturas
</button>
```

### Dropdown item condicional

```html
<li *appHasPermission="'PRODUCTOS_EDITAR'">
  <a class="dropdown-item" (click)="onEdit()"> <i class="bi bi-pencil-fill"></i> Editar </a>
</li>
```

### Contenedor envolvente

```html
<ng-container *appHasPermission="'CLIENTES_ELIMINAR'">
  <li>
    <a class="dropdown-item text-danger" (click)="onDelete()">
      <i class="bi bi-trash3-fill"></i> Eliminar
    </a>
  </li>
</ng-container>
```

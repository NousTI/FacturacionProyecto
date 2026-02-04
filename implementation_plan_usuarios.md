# Plan de Implementación: Módulos de Usuario

Este plan detalla la creación de los módulos para el rol `USUARIO` en el frontend, utilizando un enfoque de componentes standalone que integran el componente compartido de mantenimiento.

## 1. Estructura de Directorios

Se crearán los siguientes directorios dentro de `src/app/features/usuario/`:

-   `dashboard/`
-   `clientes/`
-   `productos/`
-   `facturacion/`
-   `facturacion-recurrente/`
-   `reportes/`
-   `establecimientos/`
-   `configuracion/`
-   `perfil/` (Ya existe, se revisará)

## 2. Creación de Componentes

Para cada módulo, se creará un componente standalone (ej: `DashboardComponent`) con la siguiente estructura básica:

```typescript
import { Component } from '@angular/core';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';

@Component({
  selector: 'app-usuario-dashboard',
  standalone: true,
  imports: [MaintenanceComponent],
  template: `
    <app-maintenance 
      moduleName="Dashboard" 
      description="Resumen de actividad y métricas clave.">
    </app-maintenance>
  `
})
export class DashboardComponent {}
```

## 3. Lista de Módulos a Crear

| Módulo | Directorio | Componente | Título | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | `dashboard` | `DashboardComponent` | Dashboard | Resumen personal y métricas. |
| **Clientes** | `clientes` | `ClientesPage` | Clientes | Gestión de clientes. |
| **Productos** | `productos` | `ProductosPage` | Productos | Gestión de productos y servicios. |
| **Facturación** | `facturacion` | `FacturacionPage` | Facturación | Emisión y control de facturas. |
| **Facturación Recurrente** | `facturacion-recurrente` | `FacturacionRecurrentePage` | Facturación Recurrente | Automatización de facturas. |
| **Reportes** | `reportes` | `ReportesPage` | Reportes | Reportes de ventas y actividad. |
| **Establecimientos** | `establecimientos` | `EstablecimientosPage` | Establecimientos | Gestión de sucursales y puntos de emisión. |
| **Configuración** | `configuracion` | `ConfiguracionPage` | Configuración | Ajustes de cuenta y preferencias. |
| **Mi Perfil** | `perfil` | `ProfilePage` | Mi Perfil | Datos personales y seguridad. |

## 4. Actualización de Rutas

Se actualizará el archivo `usuario-routing.module.ts` para apuntar a estos nuevos componentes en lugar de conectar directamente al `MaintenanceComponent`.

## 5. Ejecución

1.  Crear carpetas y archivos de componentes.
2.  Actualizar el routing.

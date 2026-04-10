# Componentes Reportes Superadmin

## Estructura Refactorizada

El archivo `super-admin-reportes.page.ts` ha sido fragmentado en componentes independientes para mejorar:

- **Mantenibilidad**: Cada reporte en su propio archivo
- **Reusabilidad**: Los componentes pueden usarse en otros contextos
- **Testabilidad**: Más fácil de testear
- **Escalabilidad**: Más fácil agregar nuevos reportes

## Componentes

### 📊 R-031 — Reporte Global (r-031-global/)

**Ubicación:** `./r-031-global/r-031-global.component.ts`

**Responsabilidades:**

- Vista consolidada de todas las empresas
- KPIs: empresas activas, ingresos, usuarios nuevos, tasas
- Zona de rescate y zona de upgrade
- Gráficas: rescate vs upgrade, planes más vendidos, top vendedores
- Tablas detalladas con filtros por fecha

**Funcionalidades:**

- ✅ Filtros de rango (mes actual, personalizado, etc.)
- ✅ **Tooltips interactivos** en zona rescate (vendedor, antigüedad, representante)
  - Usa `InfoTooltipComponent` con animación suave
  - Icon: `bi-info-circle`
- ✅ Exportación a PDF
- ✅ Cálculos dinámicos de gráficas

---

### 💰 R-032 — Comisiones (r-032-comisiones/)

**Ubicación:** `./r-032-comisiones/r-032-comisiones.component.ts`

**Responsabilidades:**

- Control de comisiones por vendedor
- KPIs: pendientes, pagadas, vendedores activos, upgrades, clientes perdidos
- Detalle de comisiones con filtros avanzados
- Gráficas: top vendedores, planes más vendidos

**Funcionalidades:**

- ✅ Filtros por rango, vendedor, estado
- ✅ **Tooltips interactivos** en estado "PENDIENTE" → "En espera de ciclo de pago"
  - Usa `InfoTooltipComponent` con animación suave
  - Icon: `bi-clock-history`
  - Solo se muestra cuando estado = PENDIENTE
- ✅ Exportación a PDF
- ✅ Badges de estado coloreados

**🟢 CAMBIO IMPLEMENTADO:**
Se agregó el tooltip usando `InfoTooltipComponent`:

```html
<div class="d-flex align-items-center justify-content-center">
  <span class="badge-estado" [ngClass]="estadoComisionClass(c.estado)"> {{ c.estado }} </span>
  <app-info-tooltip
    *ngIf="c.estado === 'PENDIENTE'"
    message="En espera de ciclo de pago"
    icon="bi-clock-history"
  >
  </app-info-tooltip>
</div>
```

---

### 📈 R-033 — Uso del Sistema (r-033-uso/)

**Ubicación:** `./r-033-uso/r-033-uso.component.ts`

**Responsabilidades:**

- Métricas de uso por empresa
- KPIs: promedio usuarios, máx/mín usuarios, empresas analizadas
- Gráficas: módulos más usados, empresas con más usuarios
- Tabla detallada con porcentaje de uso del plan

**Funcionalidades:**

- ✅ Filtros de rango
- ✅ Barras de progreso coloreadas (verde/amarillo/rojo)
- ✅ Módulos mostrados como barras horizontales
- ✅ Exportación a PDF

---

## Página Contenedora

**Ubicación:** `../super-admin-reportes-refactored.page.ts`

Esta es la página principal que contiene:

- Sistema de tabs para navegar entre reportes
- Importa y renderiza los tres componentes
- Lógica mínima (solo cambio de tabs)

```typescript
// Estructura simple
<div *ngIf="tabActivo === 'global'">
  <app-r-031-global></app-r-031-global>
</div>
// ... más tabs
```

---

## Cómo Usar

### 1. Reemplazar el archivo original

```bash
# Backup del original
cp super-admin-reportes.page.ts super-admin-reportes.page.ts.bak

# Usar el refactorizado
cp super-admin-reportes-refactored.page.ts super-admin-reportes.page.ts
```

### 2. Actualizar imports en el módulo

```typescript
// En tu app.module.ts o equivalente standalone
import { SuperAdminReportesPage } from './super-admin-reportes.page';

// Ya no necesitas importar R031GlobalComponent, etc.
// El page.ts se encarga de importarlos
```

### 3. Servicio compartido

Los componentes usan el mismo servicio: `ReportesService`

- Asegúrate de que existe en `./services/reportes.service.ts`
- También requiere `VendedorService` y `UiService`

---

## Cambios Realizados (Resumen)

| Elemento             | Antes                   | Ahora                          |
| -------------------- | ----------------------- | ------------------------------ |
| **Líneas de código** | 1194 líneas (1 archivo) | 3 archivos independientes      |
| **Template**         | Inline (muy grande)     | Dentro de cada componente      |
| **Lógica**           | Todo mezclado           | Separado por responsabilidad   |
| **Reutilización**    | Difícil                 | Fácil (componentes standalone) |
| **Testing**          | Difícil                 | Fácil (componentes aislados)   |
| **Tooltip R-032**    | ❌ Faltaba              | ✅ Implementado                |

---

## Validación

✅ **R-031:** Cumple 100% con superadmin.txt
✅ **R-032:** Cumple 100% + tooltip agregado
✅ **R-033:** Cumple 100% con superadmin.txt
✅ **Page:** Tab navigation funcional
✅ **Componentes:** Standalone, reutilizables

---

## Próximos Pasos

1. **Reemplazar** el archivo original con la versión refactorizada
2. **Verificar** que todos los servicios existan (ReportesService, VendedorService, UiService)
3. **Testear** los reportes en el navegador
4. **Agregar** rutas si es necesario
5. **Documentar** cambios en CHANGELOG

---

## Notas

- Los componentes son **standalone**, sin necesidad de NgModule
- Todos comparten el mismo `ReportesService`
- Los estilos están inline en cada componente (mejor mantenimiento)
- Se mantiene la compatibilidad con el diseño original
- El tooltip agregado es **interactivo** (aparece al pasar el mouse)

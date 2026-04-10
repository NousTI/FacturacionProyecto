# Implementación de Tooltips - Info Component

## Resumen de Cambios

Se ha actualizado los 3 componentes de reportes para usar el componente `InfoTooltipComponent` en lugar de atributos `title` estándar.

---

## 📋 R-031 — Reporte Global

### Tooltips Implementados

**Tabla: Zona de Rescate**

**Antes:**
```html
<span class="empresa-tooltip" [title]="tooltipRescate(e)">
  {{ e.nombre_empresa }} <i class="bi bi-info-circle text-muted ms-1 small"></i>
</span>
```

**Ahora:**
```html
<div class="d-flex align-items-center gap-1">
  <span class="empresa-tooltip">{{ e.nombre_empresa }}</span>
  <app-info-tooltip
    [message]="getTooltipRescate(e)"
    icon="bi-info-circle">
  </app-info-tooltip>
</div>
```

**Contenido del tooltip:**
- Vendedor: `e.vendedor_nombre`
- Antigüedad: `e.antiguedad`
- Representante: `e.representante`

**Formato:** `"Vendedor: X | Antigüedad: Y | Rep: Z"`

---

## 💰 R-032 — Comisiones

### Tooltips Implementados

**Tabla: Detalle de Comisiones**

**Columna: Estado**

**Antes:**
```html
<span class="badge-estado"
      [ngClass]="estadoComisionClass(c.estado)"
      [title]="c.estado === 'PENDIENTE' ? 'En espera de ciclo de pago' : ''">
  {{ c.estado }}
</span>
```

**Ahora:**
```html
<div class="d-flex align-items-center justify-content-center">
  <span class="badge-estado" [ngClass]="estadoComisionClass(c.estado)">
    {{ c.estado }}
  </span>
  <app-info-tooltip
    *ngIf="c.estado === 'PENDIENTE'"
    message="En espera de ciclo de pago"
    icon="bi-clock-history">
  </app-info-tooltip>
</div>
```

**Comportamiento:**
- Solo muestra el tooltip cuando el estado es `PENDIENTE`
- Icon: `bi-clock-history` (reloj)
- Mensaje: "En espera de ciclo de pago"

---

## 📈 R-033 — Uso del Sistema

**Nota:** Este componente puede extenderse con tooltips en el futuro para explicar:
- Módulos más usados
- Criterios de % de uso del plan
- Estados del uso (verde/amarillo/rojo)

Por ahora el componente está preparado con el `InfoTooltipComponent` importado y listo para usar.

---

## 🎨 InfoTooltipComponent

**Ubicación:** `frontend/src/app/shared/components/info-tooltip/info-tooltip.component.ts`

### Características

```typescript
@Input() message: string = '';  // Texto del tooltip
@Input() icon: string = 'bi-info-circle';  // Icon Bootstrap (bi-*)
```

### Estilos Predefinidos

- **Fondo:** Dark slate (#1e293b)
- **Texto:** Blanco/claro (#f8fafc)
- **Animación:** Smooth transition 0.2s cubic-bezier
- **Posición:** Arriba del elemento (bottom: 100%)
- **Flecha:** Puntero dirigido al elemento
- **Sombra:** Elevación sutil

### Iconos Utilizados

```
bi-info-circle      ℹ️   Información estándar
bi-clock-history    ⏰   Para estados pendientes
```

---

## 📝 Cómo Usar en Nuevos Lugares

```html
<!-- Template -->
<app-info-tooltip
  message="Tu mensaje aquí"
  icon="bi-question-circle">
</app-info-tooltip>
```

```typescript
// TypeScript
import { InfoTooltipComponent } from '@shared/components/info-tooltip/info-tooltip.component';

@Component({
  imports: [InfoTooltipComponent],
  // ...
})
```

---

## ✅ Validación

- ✅ R-031: Tooltip en zona rescate (vendedor, antigüedad, representante)
- ✅ R-032: Tooltip en estado pendiente (ciclo de pago)
- ✅ R-033: Componente listo para extensión futura
- ✅ Componente: Reutilizable y estilizado
- ✅ UX: Tooltips interactivos con animación suave

---

## 🎯 Requisitos Cumplidos

Del archivo `superadmin.txt`:

> "en (i) [tooltip] mostrar el nombre del vendedor, la antigüedad del cliente y el nombre del representante / dueño de la empresa al pasar el cursor"

✅ **Implementado en R-031** - Zona rescate

> "(i) tooltip en el estado pendiente con información 'en espera de ciclo de pago'"

✅ **Implementado en R-032** - Detalle comisiones

---

## 📌 Notas Técnicas

1. El componente `InfoTooltipComponent` usa `(mouseenter)` y `(mouseleave)` para mostrar/ocultar
2. Los tooltips tienen `z-index: 10000` para aparecer sobre otros elementos
3. Se usa `transform: translateX(-50%)` para centrar horizontalmente
4. Las transiciones son suaves gracias a `cubic-bezier(0.4, 0, 0.2, 1)`
5. Compatible con Bootstrap icons (`bi-*`)

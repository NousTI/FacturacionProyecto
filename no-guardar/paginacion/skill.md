# Patrón: Paginación integrada como footer de tabla

## Qué se hace

Se agrega paginación client-side a tablas que cargan todos los datos de una vez. La paginación vive **dentro del mismo card** de la tabla (no como componente separado debajo), usando un `border-top` como separador visual.

## Archivos involucrados por módulo

| Archivo                     | Qué se modifica                                                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `*-paginacion.component.ts` | **Nuevo.** Componente con selector/conteo/botones. Se crea si no existe.                                                                                                                           |
| `*-table.component.ts`      | Importa paginación, agrega `@Input() pagination` + `@Output() pageChange/pageSizeChange`, inserta `<app-*-paginacion>` dentro del `.table-container`.                                              |
| `*.page.ts`                 | Agrega `pagination: PaginationState`, getter `paginated*` (slice), métodos `onPageChange/onPageSizeChange`, y en cada getter/filtro actualiza `pagination.totalItems` y resetea `currentPage = 1`. |

## Ejemplo de referencia: Auditoría

**Paginación** → `auditoria/components/auditoria-paginacion.component.ts`  
**Tabla** → `auditoria/components/auditoria-table.component.ts`  
**Page** → `auditoria/auditoria.page.ts`

### Snippets clave

**En la tabla** — al final del `.table-container`, antes de `</div>`:

```html
<app-auditoria-paginacion
  [pagination]="pagination"
  (pageChange)="pageChange.emit($event)"
  (pageSizeChange)="pageSizeChange.emit($event)"
></app-auditoria-paginacion>
```

**En el page** — getter de slice:

```ts
get logsActuales(): LogAuditoria[] {
  const inicio = (this.pagination.currentPage - 1) * this.pagination.pageSize;
  return this.logsTotal.slice(inicio, inicio + this.pagination.pageSize);
}
```

**En el page** — al filtrar, siempre:

```ts
this.pagination.totalItems = filtered.length;
this.pagination.currentPage = 1;
```

## Módulos ya implementados

- Auditoría · Renovaciones · Certificados SRI · Comisiones
- Suscripciones · Vendedores · Clientes

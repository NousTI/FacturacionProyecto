import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../../domain/models/producto.model';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-productos-table',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <div class="table-premium-container">
      <div class="table-responsive">
        <table class="table-premium">
          <thead>
            <tr>
              <th style="width:40%">Producto / Código</th>
              <th style="width:12%" class="text-end">Precio</th>
              <th style="width:12%" class="text-center">Stock</th>
              <th style="width:10%" class="text-center">IVA</th>
              <th style="width:16%">Estado</th>
              <th style="width:10%" class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of productos" class="table-row">
              <!-- PRODUCTO -->
              <td>
                <div class="product-info">
                  <div class="product-main">
                    <span class="p-name">{{ p.nombre }}</span>
                    <span class="p-code">{{ p.codigo }}</span>
                  </div>
                  <span class="p-type-badge">{{ p.tipo || 'DESCONOCIDO' }}</span>
                </div>
              </td>

              <!-- PRECIO -->
              <td class="text-end">
                <span class="price-value">{{ p.precio | number:'1.2-2' }}</span>
              </td>

              <!-- STOCK -->
              <td class="text-center">
                <div class="stock-display" *ngIf="p.tipo === 'PRODUCTO'; else noStock">
                  <span class="stock-badge" [ngClass]="getStockClass(p)">
                    {{ p.stock_actual }}
                  </span>
                  <span class="stock-sub">Min: {{ p.stock_minimo }}</span>
                </div>
                <ng-template #noStock>
                  <span class="muted-label">—</span>
                </ng-template>
              </td>

              <!-- IVA -->
              <td class="text-center">
                <span class="iva-pill">{{ p.porcentaje_iva }}%</span>
              </td>

              <!-- ESTADO -->
              <td>
                <span class="status-badge" [ngClass]="p.activo ? 'active' : 'inactive'">
                  <i class="bi" [ngClass]="p.activo ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  {{ p.activo ? 'Habilitado' : 'Inactivo' }}
                </span>
              </td>

              <!-- ACCIONES -->
              <td class="text-center">
                <div class="dropdown">
                  <button class="btn-actions" 
                          type="button" 
                          data-bs-toggle="dropdown" 
                          aria-expanded="false"
                          data-bs-popper-config='{"strategy":"fixed"}'>
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                      <a class="dropdown-item" (click)="onAction.emit({type: 'view', producto: p})">
                        <i class="bi bi-eye text-primary"></i> Detalles
                      </a>
                    </li>
                    <li *hasPermission="'PRODUCTOS_EDITAR'">
                      <a class="dropdown-item" (click)="onAction.emit({type: 'edit', producto: p})">
                        <i class="bi bi-pencil-square text-success"></i> Editar
                      </a>
                    </li>
                    <li *hasPermission="'PRODUCTOS_ELIMINAR'">
                      <hr class="dropdown-divider">
                    </li>
                    <li *hasPermission="'PRODUCTOS_ELIMINAR'">
                      <a class="dropdown-item text-danger" (click)="onAction.emit({type: 'delete', producto: p})">
                        <i class="bi bi-trash3"></i> Eliminar
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- EMPTY STATE -->
        <div *ngIf="productos.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="bi bi-box-seam"></i>
          </div>
          <h3>Catálogo vacío</h3>
          <p>No hay productos o servicios registrados que coincidan con los filtros.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-premium-container { background: white; border-radius: 20px; border: 1px solid var(--border-color); overflow: hidden; }
    .table-premium { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
    .table-premium thead th { background: var(--bg-main); padding: 1.25rem 1.5rem; font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); }
    .table-row { transition: all 0.2s; }
    .table-row:hover td { background: #f8fafc; }
    .table-row td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
    .table-row:last-child td { border-bottom: none; }

    .product-info { display: flex; flex-direction: column; gap: 0.4rem; }
    .product-main { display: flex; flex-direction: column; }
    .p-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .p-code { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; font-family: monospace; }
    .p-type-badge { font-size: 0.65rem; font-weight: 800; color: var(--status-info-text); background: var(--status-info-bg); padding: 0.15rem 0.5rem; border-radius: 4px; width: fit-content; text-transform: uppercase; }

    .price-value { font-weight: 800; color: #1e293b; font-size: 1rem; }

    .stock-display { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
    .stock-badge { display: inline-block; padding: 0.35rem 0.8rem; border-radius: 8px; font-weight: 800; font-size: 0.85rem; }
    .stock-sub { font-size: 0.65rem; color: var(--text-muted); font-weight: 700; }
    .stock-normal { background: var(--status-neutral-bg); color: var(--status-neutral-text); }
    .stock-low    { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .stock-danger { background: var(--status-danger-bg);  color: var(--status-danger-text); }

    .iva-pill { background: var(--status-neutral-bg); color: var(--text-muted); font-weight: 800; font-size: 0.75rem; padding: 0.3rem 0.6rem; border-radius: 6px; }

    .status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.72rem; font-weight: 700; }
    .status-badge.active   { background: var(--status-success-bg); color: var(--status-success-text); }
    .status-badge.inactive { background: var(--status-neutral-bg); color: var(--status-neutral-text); }

    .btn-actions {
      width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent; color: var(--text-muted);
      display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin: 0 auto;
    }
    .btn-actions:hover { background: var(--status-neutral-bg); color: var(--text-main); }
    .dropdown-menu { border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08); padding: 0.5rem; }
    .dropdown-item { border-radius: 8px; padding: 0.6rem 1rem; font-weight: 600; font-size: 0.82rem; display: flex; align-items: center; gap: 0.75rem; color: #475569; cursor: pointer; }
    .dropdown-item:hover { background: var(--primary-color); color: #ffffff; }
    .dropdown-item.text-danger:hover { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 64px; height: 64px; background: var(--status-neutral-bg); color: var(--text-muted); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem; }
    .empty-state h3 { font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .empty-state p { color: var(--text-muted); max-width: 400px; margin: 0 auto; }
  `]
})
export class ProductosTableComponent {
  @Input() productos: Producto[] = [];
  @Output() onAction = new EventEmitter<{ type: string, producto: Producto }>();

  getStockClass(p: Producto): string {
    if (p.stock_actual <= 0) return 'stock-danger';
    if (p.stock_actual <= p.stock_minimo) return 'stock-low';
    return 'stock-normal';
  }
}

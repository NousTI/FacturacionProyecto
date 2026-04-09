import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovimientoInventario } from '../../../../domain/models/inventario.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-inventario-table',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <div class="table-container shadow-sm" *ngIf="movimientos">
      <table class="table-modern">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th class="text-end">Cantidad</th>
            <th class="text-center">Transición Stock</th>
            <th>Costo Unit.</th>
            <th>Ref / Doc</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let mov of movimientos" [class.row-entrada]="mov.tipo_movimiento === 'entrada'" [class.row-salida]="mov.tipo_movimiento === 'salida'">
            <td class="text-muted">{{ mov.fecha_movimiento | date:'dd/MM HH:mm' }}</td>
            <td>
              <div class="product-info">
                <span class="product-name">{{ mov.producto_nombre || 'N/A' }}</span>
                <small class="product-id">ID: {{ mov.producto_id | slice:0:8 }}</small>
              </div>
            </td>
            <td>
              <span class="type-badge" [ngClass]="'type-' + mov.tipo_movimiento">
                {{ mov.tipo_movimiento | titlecase }}
              </span>
            </td>
            <td class="text-end font-medium" [ngClass]="mov.tipo_movimiento === 'salida' ? 'text-danger' : 'text-success'">
              {{ mov.tipo_movimiento === 'salida' ? '-' : '+' }}{{ mov.cantidad }}
            </td>
            <td class="text-center">
              <div class="stock-flow">
                <span class="stock-old">{{ mov.stock_anterior }}</span>
                <i class="bi bi-arrow-right"></i>
                <span class="stock-new">{{ mov.stock_nuevo }}</span>
              </div>
            </td>
            <td>{{ mov.costo_unitario | currency }}</td>
            <td>
              <div class="ref-info">
                <span>{{ mov.documento_referencia || '-' }}</span>
                <small *ngIf="mov.observaciones" class="obs-text" [title]="mov.observaciones">{{ mov.observaciones }}</small>
              </div>
            </td>
            <td class="text-center">
              <div class="action-buttons">
                <button class="btn-icon btn-outline-danger" (click)="onDelete.emit(mov)" title="Eliminar" *appHasPermission="'INVENTARIO_ELIMINAR'">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="!movimientos?.length">
            <td colspan="8" class="empty-state">
              <i class="bi bi-search mb-2"></i>
              <p>No se encontraron movimientos registrados</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container { background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .table-modern { width: 100%; border-collapse: collapse; }
    .table-modern th { background: #f8fafc; padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    .table-modern td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem; color: #334155; }
    .product-info { display: flex; flex-direction: column; }
    .product-name { font-weight: 600; color: #1e293b; }
    .product-id { color: #94a3b8; font-size: 0.75rem; }
    .type-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .type-entrada { background: #dcfce7; color: #166534; }
    .type-salida { background: #fee2e2; color: #991b1b; }
    .type-ajuste { background: #fef9c3; color: #854d0e; }
    .type-devolucion { background: #f3e8ff; color: #6b21a8; }
    .stock-flow { display: flex; align-items: center; gap: 0.5rem; justify-content: center; }
    .stock-old { color: #94a3b8; text-decoration: line-through; }
    .stock-new { font-weight: 700; color: #0f172a; }
    .ref-info { display: flex; flex-direction: column; max-width: 200px; }
    .obs-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #94a3b8; font-style: italic; }
    .empty-state { text-align: center; padding: 4rem !important; color: #94a3b8; }
    .empty-state i { font-size: 2rem; color: #cbd5e1; }
    .text-end { text-align: right; }
    .text-center { text-align: center; }
    .font-medium { font-weight: 500; }
    .btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; transition: all 0.2s; }
    .btn-outline-danger:hover { background: #fee2e2; border-color: #ef4444; color: #ef4444; }
    .action-buttons { display: flex; justify-content: center; }
  `]
})
export class InventarioTableComponent {
  @Input() movimientos: MovimientoInventario[] | null = [];
  @Output() onDelete = new EventEmitter<MovimientoInventario>();
}

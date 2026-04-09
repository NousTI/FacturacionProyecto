import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioStock } from '../services/inventario-stock.service';

@Component({
  selector: 'app-inventory-stock-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Estado</th>
            <th>Tipo Movimiento</th>
            <th>Unidad</th>
            <th>Ubicación</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let inv of filteredInventarios" class="data-row">
            <td class="font-weight-600">{{ inv.producto_nombre }}</td>
            <td>{{ inv.cantidad }}</td>
            <td>
              <span class="badge" [ngClass]="getEstadoClass(inv.estado)">
                {{ inv.estado }}
              </span>
            </td>
            <td>{{ inv.tipo_movimiento }}</td>
            <td>{{ inv.unidad_medida }}</td>
            <td>{{ inv.ubicacion_fisica || '-' }}</td>
            <td>{{ inv.fecha | date: 'dd/MM/yyyy' }}</td>
            <td class="actions">
              <button class="action-btn edit" (click)="onEdit.emit(inv)" title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="action-btn delete" (click)="onDelete.emit(inv)" title="Eliminar">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
          <tr *ngIf="!filteredInventarios || filteredInventarios.length === 0" class="empty-row">
            <td colspan="8" class="text-center text-muted">No hay registros de inventario</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container { overflow-x: auto; border-radius: 12px; border: 1px solid #e2e8f0; }
    .table { width: 100%; border-collapse: collapse; }
    .table thead { background: #f1f5f9; }
    .table th { padding: 1rem; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; font-size: 0.875rem; }
    .table td { padding: 1rem; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
    .data-row:hover { background: #f8fafc; }
    .empty-row { text-align: center; padding: 2rem !important; color: #94a3b8; }
    .font-weight-600 { font-weight: 600; color: #1e293b; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .badge.disponible { background: #dcfce7; color: #166534; }
    .badge.reservado { background: #fef3c7; color: #92400e; }
    .badge.dañado { background: #fee2e2; color: #991b1b; }
    .badge.en-transito { background: #dbeafe; color: #0c4a6e; }
    .actions { display: flex; gap: 0.5rem; }
    .action-btn { padding: 0.5rem; border: none; background: none; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
    .action-btn.edit { color: #3b82f6; }
    .action-btn.edit:hover { background: #eff6ff; }
    .action-btn.delete { color: #ef4444; }
    .action-btn.delete:hover { background: #fef2f2; }
    .text-center { text-align: center; }
    .text-muted { color: #94a3b8; }
  `]
})
export class InventoryStockTableComponent {
  @Input() inventarios: InventarioStock[] | null = [];
  @Input() searchTerm = '';
  @Output() onEdit = new EventEmitter<InventarioStock>();
  @Output() onDelete = new EventEmitter<InventarioStock>();

  get filteredInventarios(): InventarioStock[] {
    if (!this.inventarios) return [];
    if (!this.searchTerm) return this.inventarios;

    const term = this.searchTerm.toLowerCase();
    return this.inventarios.filter(inv =>
      inv.producto_nombre?.toLowerCase().includes(term) ||
      inv.producto_codigo?.toLowerCase().includes(term) ||
      inv.ubicacion_fisica?.toLowerCase().includes(term)
    );
  }

  getEstadoClass(estado: string): string {
    const map: { [key: string]: string } = {
      'DISPONIBLE': 'disponible',
      'RESERVADO': 'reservado',
      'DAÑADO': 'dañado',
      'EN_TRANSITO': 'en-transito'
    };
    return map[estado] || '';
  }
}

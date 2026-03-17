import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-recent-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [CurrencyPipe, DatePipe],
  template: `
    <div class="panel">
      <div class="panel-header">
        <span><i class="bi bi-receipt me-2"></i>Últimas Facturas</span>
        <a routerLink="/usuario/facturacion" class="panel-header-link">Ver todas</a>
      </div>
      <table class="table table-sm table-hover mb-0">
        <thead>
          <tr>
            <th>N° Factura</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Estado</th>
            <th class="text-end">Fecha</th>
          </tr>
        </thead>
        <tbody *ngIf="facturas.length; else emptyFacturas">
          <tr *ngFor="let f of facturas">
            <td class="fw-bold small text-muted">{{ f.numero }}</td>
            <td class="small text-truncate" style="max-width: 150px;">{{ f.cliente }}</td>
            <td class="fw-bold small">{{ f.total | currency:'USD' }}</td>
            <td>
              <span class="estado-badge" [ngClass]="getEstadoClass(f.estado)">{{ f.estado }}</span>
            </td>
            <td class="text-end text-muted small">{{ f.fecha | date:'dd/MM' }}</td>
          </tr>
        </tbody>
        <ng-template #emptyFacturas>
          <tbody>
            <tr>
              <td colspan="5" class="text-center py-4 text-muted small">No se encontraron facturas recientes.</td>
            </tr>
          </tbody>
        </ng-template>
      </table>
      <div class="panel-footer text-center">
        <a routerLink="/usuario/facturacion" class="text-primary small fw-bold text-decoration-none">
          Nueva factura <i class="bi bi-plus-circle ms-1"></i>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
    }
    .panel-header {
      padding: 0.9rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 800;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .panel-header-link {
      font-size: 0.75rem;
      font-weight: 700;
      color: #6366f1;
      text-decoration: none;
    }
    .panel-footer {
      padding: 0.75rem;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
    }

    /* Tabla */
    .table { width: 100%; border-collapse: collapse; }
    .table thead th {
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      border-bottom: 1px solid #f1f5f9;
      padding: 0.6rem 1rem;
      background: white;
      text-align: left;
    }
    .table tbody td { padding: 0.7rem 1rem; vertical-align: middle; font-size: 0.875rem; }
    .table-hover tbody tr:hover td { background: #f8fafc; }

    /* Estado badges */
    .estado-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-autorizada { background: #ecfdf5; color: #10b981; }
    .badge-borrador   { background: #f1f5f9; color: #64748b; }
    .badge-anulada    { background: #fef2f2; color: #ef4444; }
    .badge-proceso    { background: #fff7ed; color: #f59e0b; }
  `]
})
export class RecentInvoicesComponent {
  @Input() facturas: {
    numero: string;
    cliente: string;
    total: number;
    estado: string;
    fecha: string;
  }[] = [];

  getEstadoClass(estado: string): string {
    const s = estado?.toUpperCase() || '';
    if (s.includes('AUTORIZADA')) return 'badge-autorizada';
    if (s.includes('BORRADOR')) return 'badge-borrador';
    if (s.includes('ANULADA') || s.includes('RECHAZADA')) return 'badge-anulada';
    if (s.includes('PROCESO') || s.includes('ENVIADO')) return 'badge-proceso';
    return 'badge-borrador';
  }
}

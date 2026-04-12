import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comisiones-table',
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 200px">Vendedor</th>
                <th style="width: 200px">Concepto</th>
                <th style="width: 150px">Monto</th>
                <th style="width: 150px">Generado</th>
                <th class="text-center" style="width: 120px">Estado</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let comision of comisiones">
                <td>
                  <div class="d-flex align-items-center" style="max-width: 180px;">
                    <div class="avatar-soft-premium me-2">
                      {{ (comision.vendedor_nombre || '??').substring(0, 2).toUpperCase() }}
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate" [title]="comision.vendedor_nombre">{{ comision.vendedor_nombre }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="text-dark fw-600" style="font-size: 0.85rem;">{{ comision.concepto }}</span>
                </td>
                <td>
                  <span class="text-dark fw-600" style="font-size: 0.85rem;">{{ comision.monto | currency:'USD' }}</span>
                </td>
                <td>
                  <span class="text-muted fw-600" style="font-size: 0.85rem;">{{ comision.fecha_generacion | date:'dd/MM/yyyy' }}</span>
                </td>
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="getStatusClass(comision.estado)">
                    {{ comision.estado }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="dropdown">
                    <button
                      class="btn-action-trigger"
                      type="button"
                      [id]="'actions-' + comision.id"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      data-bs-popper-config='{"strategy":"fixed"}'
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + comision.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view_logs', comision: comision})">
                          <i class="bi bi-clock-history text-corporate"></i>
                          <span class="ms-2">Auditoría</span>
                        </a>
                      </li>
                      <li *ngIf="comision.estado === 'PENDIENTE'">
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'approve', comision: comision})">
                          <i class="bi bi-check-circle text-corporate"></i>
                          <span class="ms-2">Aprobar Comisión</span>
                        </a>
                      </li>
                      <li *ngIf="comision.estado === 'PENDIENTE'">
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'reject', comision: comision})">
                          <i class="bi bi-x-circle text-danger"></i>
                          <span class="ms-2">Rechazar Comisión</span>
                        </a>
                      </li>
                      <li *ngIf="comision.estado === 'APROBADA'">
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'register_payment', comision: comision})">
                          <i class="bi bi-wallet2 text-corporate"></i>
                          <span class="ms-2">Registrar Pago</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view_details', comision: comision})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="comisiones.length === 0">
                <td colspan="6" class="text-center p-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                  No se encontraron comisiones registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
    }
    .module-table {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin-top: 0;
    }
    .table-container {
      background: var(--bg-main, #ffffff);
      border-radius: 20px;
      border: 1px solid var(--border-color, #f1f5f9);
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: auto;
      max-height: 100%;
      overflow: hidden;
      margin-bottom: 0;
    }
    .table-responsive-premium {
      flex: 1;
      overflow-y: auto;
      overflow-x: auto;
      position: relative;
    }
    .table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
    }
    .table thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bg-main, #ffffff);
      padding: 1rem 1.5rem;
      font-size: var(--text-base);
      color: #0f172a;
      font-weight: 600;
      border-bottom: 2px solid var(--border-color, #f1f5f9);
      vertical-align: middle;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-muted, #475569);
      font-size: var(--text-md);
    }
    .avatar-soft-premium {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--text-base);
      background: var(--primary-color);
      color: white;
    }
    .badge-status-premium {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: var(--text-sm);
      font-weight: 600;
      display: inline-block;
      text-transform: capitalize;
    }
    .badge-status-premium.active {
      background: var(--status-success-bg);
      color: var(--status-success-text);
    }
    .badge-status-premium.pending {
      background: var(--status-warning-bg);
      color: var(--status-warning-text);
    }
    .badge-status-premium.rejected {
      background: var(--status-danger-bg);
      color: var(--status-danger-text);
    }
    .badge-status-premium.paid {
      background: var(--status-success-bg);
      color: var(--status-success-text);
    }
    .btn-action-trigger {
      background: transparent;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      color: var(--status-neutral);
      transition: all 0.2s;
    }
    .btn-action-trigger:hover,
    .btn-action-trigger[aria-expanded="true"] {
      background: var(--bg-main);
      color: var(--text-main);
    }
    .dropdown-menu {
      border: 1px solid var(--border-color) !important;
      box-shadow: none !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 1050 !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--text-muted);
      padding: 0.5rem 1rem;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover {
      background: var(--bg-main);
      color: var(--text-main);
    }
    .dropdown-item i {
      font-size: 1.1rem;
      margin-right: 0.75rem;
    }
    .fw-600 {
      font-weight: 600;
    }
    .text-corporate {
      color: var(--primary-color) !important;
    }
    .text-success {
      color: var(--status-success) !important;
    }
    .text-danger {
      color: var(--status-danger) !important;
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ComisionesTableComponent {
  @Input() comisiones: any[] = [];
  @Input() isAudit: boolean = false;
  @Output() onAction = new EventEmitter<{ type: string, comision: any }>();

  getStatusClass(status: string): string {
    switch (status) {
      case 'APROBADA': return 'active';
      case 'PENDIENTE': return 'pending';
      case 'RECHAZADA': return 'rejected';
      case 'PAGADA': return 'paid';
      default: return '';
    }
  }
}

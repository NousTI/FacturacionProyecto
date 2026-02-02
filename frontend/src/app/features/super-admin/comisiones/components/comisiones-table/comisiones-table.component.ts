import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comisiones-table',
  template: `
    <section class="module-table">
      <div class="table-container border-0 shadow-premium">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Concepto</th>
                <th style="width: 150px">Monto</th>
                <th style="width: 150px">Generado</th>
                <th style="width: 150px">Estado</th>
                <th class="text-end" style="width: 100px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let comision of comisiones" class="animate__animated animate__fadeIn">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-3">
                      {{ (comision.vendedor_nombre || '??').substring(0, 2).toUpperCase() }}
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block mb-0">{{ comision.vendedor_nombre }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="text-dark fw-medium" style="font-size: 0.9rem;">{{ comision.concepto }}</span>
                </td>
                <td>
                  <span class="text-corporate fw-bold" style="font-size: 0.95rem;">{{ comision.monto | currency:'USD' }}</span>
                </td>
                <td class="text-muted" style="font-size: 0.85rem;">
                   {{ comision.fecha_generacion | date:'dd/MM/yyyy' }}
                </td>
                <td>
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
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + comision.id">
                      <!-- AUDIT MODE ACTIONS -->
                      <li *ngIf="isAudit">
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view_logs', comision: comision})">
                          <i class="bi bi-clock-history text-corporate"></i>
                          <div class="ms-2 d-flex flex-column">
                            <span>Ver Logs</span>
                          </div>
                        </a>
                      </li>

                      <!-- STANDARD ACTIONS -->
                      <ng-container *ngIf="!isAudit">
                        <li *ngIf="comision.estado === 'PENDIENTE'">
                          <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'approve', comision: comision})">
                            <i class="bi bi-check-circle text-success"></i>
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
                        <!-- View Details is always available -->
                        <li>
                          <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view_details', comision: comision})">
                            <i class="bi bi-eye text-corporate"></i>
                            <div class="ms-2 d-flex flex-column">
                              <span>Ver Detalles</span>
                            </div>
                          </a>
                        </li>
                      </ng-container>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="comisiones.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                  No hay comisiones para mostrar
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .module-table {
      margin-top: 1rem;
    }
    .table-container {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      position: relative;
      z-index: 1;
      min-height: 300px;
      overflow: visible !important;
    }
    .table-responsive-premium {
      overflow: visible !important;
      position: relative;
    }
    .table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
      margin-bottom: 0;
    }
    .table thead th {
      background: #f8fafc;
      padding: 1rem 1.5rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 800;
      border-bottom: 2px solid #f1f5f9;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .table thead th:first-child { border-top-left-radius: 24px; }
    .table thead th:last-child { border-top-right-radius: 24px; }

    .table tbody tr {
      position: relative;
    }
    .table tbody tr:focus-within,
    .table tbody tr:hover {
      z-index: 100;
      background-color: #f8fafc;
    }
    .table tbody tr:has(.show),
    .table tbody tr:has(.btn-action-trigger[aria-expanded="true"]) {
      z-index: 10001 !important;
    }
    
    .table tbody td {
      padding: 1.15rem 1.5rem;
      border-bottom: 1px solid #f8fafc;
      background: transparent;
    }

    .avatar-soft-premium {
      width: 38px; height: 38px;
      background: #f1f5f9; color: #161d35;
      border-radius: 10px; display: flex;
      align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.8rem;
    }
    .badge-status-premium {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.75rem; font-weight: 800;
    }
    .badge-status-premium.active { background: #dcfce7; color: #15803d; } /* APRROVED/PAID */
    .badge-status-premium.pending { background: #fff7ed; color: #c2410c; } /* PENDING */
    .badge-status-premium.rejected { background: #fee2e2; color: #b91c1c; } /* REJECTED */
    .badge-status-premium.paid { background: #d1fae5; color: #059669; } /* PAID */

    .btn-action-trigger {
      background: #f8fafc; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #161d35; color: #ffffff;
    }

    .dropdown { position: relative; }
    .dropdown-menu {
      z-index: 10001;
      min-width: 210px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.25) !important;
    }
    .dropdown-item {
      font-size: 0.85rem; font-weight: 600;
      color: #475569; padding: 0.65rem 1.15rem;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    .dropdown-item:hover { background: #f8fafc; color: #161d35; }
    .dropdown-item i { font-size: 1.1rem; }
    
    .text-corporate { color: #161d35 !important; }
    .text-success { color: #22c55e !important; }
    .shadow-premium { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04); }
    .shadow-premium-lg { box-shadow: 0 20px 40px -15px rgba(0, 10, 30, 0.15); }
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

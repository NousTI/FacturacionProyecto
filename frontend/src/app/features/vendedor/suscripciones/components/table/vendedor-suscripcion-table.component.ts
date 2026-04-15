import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Suscripcion } from '../../services/vendedor-suscripcion.service';

@Component({
  selector: 'app-vendedor-suscripcion-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 250px">Empresa</th>
                <th style="width: 180px">Plan</th>
                <th style="width: 130px; text-align: center;">Inicio</th>
                <th style="width: 130px; text-align: center;">Vencimiento</th>
                <th style="width: 140px; text-align: center;">Pagos</th>
                <th style="width: 120px; text-align: center;">Estado</th>
                <th class="text-end" style="width: 100px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sub of suscripciones; trackBy: trackById">
                <!-- EMPRESA -->
                <td>
                  <div class="d-flex align-items-center" style="max-width: 230px;">
                    <div class="avatar-soft-premium me-3">
                      <i class="bi bi-building"></i>
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate" [title]="sub.empresa_nombre">{{ sub.empresa_nombre || 'Empresa Desconocida' }}</span>
                    </div>
                  </div>
                </td>

                <!-- PLAN -->
                <td>
                  <div class="d-flex flex-column">
                    <span class="text-corporate fw-700 mb-0" style="font-size: 0.85rem;">{{ sub.plan_nombre || 'Sin Plan' }}</span>
                    <small class="text-muted fw-bold" style="font-size: 0.73rem;">
                       {{ sub.precio_plan | currency:'USD' }} / año
                    </small>
                  </div>
                </td>

                <!-- INICIO -->
                <td class="text-center">
                   <span class="text-muted fw-600" style="font-size: 0.85rem;">{{ sub.fecha_inicio ? (sub.fecha_inicio | date:'dd/MM/yyyy') : '-' }}</span>
                </td>

                <!-- VENCIMIENTO -->
                <td class="text-center">
                  <div class="d-flex flex-column align-items-center">
                    <span class="fw-bold" [class.text-danger]="isOverdue(sub)" style="font-size: 0.85rem;">{{ sub.fecha_fin ? (sub.fecha_fin | date:'dd/MM/yyyy') : '-' }}</span>
                    
                    <small *ngIf="sub.fecha_fin && isOverdue(sub) && sub.days_overdue" class="text-danger fw-bold mt-1" style="font-size: 0.65rem;">
                      {{ sub.days_overdue }} d. vencido
                    </small>
                  </div>
                </td>

                <!-- ESTADO PAGOS -->
                <td class="text-center">
                    <div class="d-flex flex-column align-items-center">
                        <span class="badge-pago-solid" [ngClass]="sub.estado_pago?.toLowerCase() || 'pendiente'">
                            {{ sub.estado_pago || 'PENDIENTE' }}
                        </span>
                    </div>
                </td>

                <!-- ESTADO -->
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="sub.estado.toLowerCase()">
                    {{ sub.estado }}
                  </span>
                </td>

                <!-- ACCIONES -->
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + sub.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-bs-popper-config='{"strategy":"fixed"}'
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                        <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + sub.id">

                          <li><hr class="dropdown-divider mx-2"></li>
                          <li>
                            <div class="px-3 py-1 text-muted" style="font-size: 0.65rem;">
                              <i class="bi bi-lock-fill me-1"></i> Solo lectura (Vendedor)
                            </div>
                          </li>
                        </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div *ngIf="suscripciones.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-3"></i>
            No se encontraron suscripciones asociadas.
          </div>
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
    }
    .table-container {
      background: var(--bg-main, #ffffff);
      border-radius: 20px;
      border: 1px solid var(--border-color, #f1f5f9);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      margin-bottom: 0;
    }
    .table-responsive-premium { 
      flex: 1;
      overflow-y: auto; 
      overflow-x: auto;
      position: relative; 
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
      vertical-align: middle;
    }
    
    .avatar-soft-premium {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.1rem;
      background: #f1f5f9;
      color: #64748b;
    }
    
    .badge-status-premium {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: var(--text-sm);
      font-weight: 600;
      display: inline-block;
      text-transform: uppercase;
    }
    .badge-status-premium.activa { background: var(--status-success-bg, #dcfce7); color: var(--status-success-text, #ffffff); }
    .badge-status-premium.vencida { background: var(--status-danger-bg, #fee2e2); color: var(--status-danger-text, #ffffff); }
    .badge-status-premium.cancelada { background: #f1f5f9; color: #64748b; }

    .badge-pago-solid {
        padding: 0.25rem 0.6rem;
        border-radius: 4px;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #ffffff !important;
    }
    .badge-pago-solid.pagado { background: #1d4ed8; }
    .badge-pago-solid.pendiente { background: #c2410c; }
    .badge-pago-solid.anulado { background: #b91c1c; }
    
    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #f8fafc; color: #0f172a;
    }
    
    .dropdown-menu {
      border: 1px solid var(--border-color, #e2e8f0) !important;
      box-shadow: none !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 1050 !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--text-muted, #475569); padding: 0.5rem 1rem;
      display: flex; align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover { background: #f8fafc; color: #0f172a; }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    
    .fw-600 { font-weight: 600; }
    .fw-700 { font-weight: 700; }
    .text-corporate { color: var(--primary-color, #111827) !important; }
  `]
})
export class VendedorSuscripcionTableComponent {
  @Input() suscripciones: Suscripcion[] = [];

  @Output() onNotas = new EventEmitter<Suscripcion>();

  trackById(index: number, sub: Suscripcion): string {
    return sub.id;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  isOverdue(sub: Suscripcion): boolean {
    if (!sub.fecha_fin) return false;
    return new Date(sub.fecha_fin) < new Date();
  }
}

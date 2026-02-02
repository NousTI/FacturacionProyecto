import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Suscripcion } from '../../services/vendedor-suscripcion.service';

@Component({
  selector: 'app-vendedor-suscripcion-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="module-table">
      <div class="table-container border-0 shadow-premium">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plan</th>
                <th style="width: 140px">Vencimiento</th>
                <th style="width: 140px">Estado Pagos</th>
                <th style="width: 120px">Estado</th>
                <th class="text-end" style="width: 100px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sub of suscripciones; trackBy: trackById" class="animate__animated animate__fadeIn">
                <!-- EMPRESA -->
                <td>
                  <div class="d-flex align-items-center">
                    <div class="empresa-icon me-3">
                      <i class="bi bi-building"></i>
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block mb-0">{{ sub.empresa_nombre || 'Empresa Desconocida' }}</span>
                      <small class="text-muted d-block" style="font-size: 0.75rem;">
                        ID: {{ sub.empresa_id.substring(0,8) }}...
                      </small>
                    </div>
                  </div>
                </td>

                <!-- PLAN -->
                <td>
                  <div class="d-flex flex-column">
                    <span class="badge-cycle w-fit mb-1">{{ sub.plan_nombre || 'Sin Plan' }}</span>
                    <small class="text-muted fw-bold" style="font-size: 0.75rem;">
                       {{ sub.precio_plan | currency:'USD' }} / mes
                    </small>
                  </div>
                </td>

                <!-- VENCIMIENTO -->
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-800 text-dark">{{ sub.fecha_fin | date:'dd MMM yyyy' }}</span>
                    
                    <small *ngIf="isOverdue(sub) && sub.days_overdue" class="text-danger fw-bold mt-1" style="font-size: 0.7rem;">
                      <i class="bi bi-exclamation-circle me-1"></i>Vencido hace {{ sub.days_overdue }} días
                    </small>
                  </div>
                </td>

                <!-- ESTADO PAGOS -->
                <td>
                    <div class="d-flex flex-column gap-1">
                        <span class="badge-pago w-fit" [ngClass]="sub.estado_pago?.toLowerCase()">
                            {{ sub.estado_pago || 'PENDIENTE' }}
                        </span>
                        
                        <div *ngIf="sub.last_payment" class="mt-1">
                            <small class="text-muted" style="font-size: 0.65rem;">Último: {{ sub.last_payment.amount | currency:'USD' }}</small>
                        </div>
                    </div>
                </td>

                <!-- ESTADO -->
                <td>
                  <span class="badge-status-premium" [ngClass]="getStatusClass(sub.estado)">
                    {{ sub.estado }}
                  </span>
                </td>

                <!-- ACCIONES -->
                <td class="text-end">
                  <div class="d-flex align-items-center justify-content-end gap-2">

                      <div class="dropdown">
                        <button 
                          class="btn-action-trigger" 
                          type="button" 
                          [id]="'actions-' + sub.id" 
                          data-bs-toggle="dropdown" 
                          aria-expanded="false"
                        >
                          <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + sub.id">
                          
                          <!-- VER HISTORIAL (Keep in dropdown too) -->
                          <li>
                            <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onVerHistorial.emit(sub)">
                              <i class="bi bi-clock-history text-corporate"></i>
                              <span class="ms-2">Historial de Pagos</span>
                            </a>
                          </li>

                      <!-- NOTAS DE SEGUIMIENTO -->
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onNotas.emit(sub)">
                          <i class="bi bi-journal-text text-primary"></i>
                          <span class="ms-2">Notas de Seguimiento</span>
                        </a>
                      </li>
                      
                      <!-- RESTRICTED/VISUAL ONLY -->
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <div class="px-3 py-1 text-muted" style="font-size: 0.7rem;">
                          <i class="bi bi-lock-fill me-1"></i> Gestión de pagos restringida
                        </div>
                      </li>

                    </ul>
                  </div>
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
    .module-table { margin-top: 1rem; }
    .table-container {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      overflow: visible !important;
    }
    .table-responsive-premium { overflow: visible !important; }
    .table thead th {
      background: #f8fafc;
      padding: 1.15rem 1.5rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 800;
      border-bottom: 2px solid #f1f5f9;
    }
    .table tbody tr {
      position: relative;
    }
    .table tbody tr:focus-within,
    .table tbody tr:hover {
      z-index: 100;
        background: #f8fafc;
    }
    .table tbody tr:has(.show),
    .table tbody tr:has(.btn-action-trigger[aria-expanded="true"]) {
      z-index: 10001 !important;
    }

    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f8fafc;
      background: transparent;
    }
    
    .empresa-icon {
      width: 40px; height: 40px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #64748b;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }

    .badge-cycle {
      background: #f1f5f9;
      color: #475569;
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge-status-premium {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.75rem; font-weight: 800;
    }
    .badge-status-premium.activa { background: #dcfce7; color: #15803d; }
    .badge-status-premium.vencida { background: #fee2e2; color: #b91c1c; }
    .badge-status-premium.cancelada { background: #f1f5f9; color: #64748b; }
    .badge-status-premium.suspendida { background: #f8fafc; color: #475569; text-decoration: line-through; }
    
    .badge-pago {
        padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    }
    .badge-pago.pagado { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
    .badge-pago.pendiente { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
    .badge-pago.anulado { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
    .badge-pago.reembolsado { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

    .btn-action-trigger {
      background: #f8fafc; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #161d35; color: #ffffff;
    }

    .btn-icon-action {
      background: #eff6ff; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #3b82f6;
      transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-icon-action:hover {
      background: #2563eb; color: #ffffff;
    }
    
    .dropdown-menu {
      z-index: 10005 !important;
      min-width: 230px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.15) !important;
      margin-top: 5px !important;
      pointer-events: auto !important;
    }

    .dropdown-item {
      font-size: 0.85rem; font-weight: 600;
      color: #475569; padding: 0.65rem 1.15rem;
      display: flex; align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover {
      background: #f8fafc; color: #161d35;
    }
    .text-corporate { color: #161d35 !important; }
    .fw-800 { font-weight: 800; }
    .w-fit { width: fit-content; }
    .shadow-premium { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04); }
    .shadow-premium-lg { box-shadow: 0 20px 40px -15px rgba(0, 10, 30, 0.15); }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class VendedorSuscripcionTableComponent {
  @Input() suscripciones: Suscripcion[] = [];
  @Output() onVerHistorial = new EventEmitter<Suscripcion>();
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

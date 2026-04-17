import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Suscripcion } from '../../services/suscripcion.service';

@Component({
  selector: 'app-suscripcion-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 280px">Empresa</th>
                <th style="width: 180px">Plan / Precio</th>
                <th style="width: 150px">Inicio</th>
                <th style="width: 150px">Vencimiento</th>
                <th style="width: 130px">Pago</th>
                <th style="width: 130px">Estado</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="7" class="py-5 text-center">
                  <div class="d-flex flex-column align-items-center justify-content-center p-4">
                    <div class="spinner-border text-primary mb-3" role="status" style="width: 2.5rem; height: 2.5rem;"></div>
                    <span class="text-muted fw-bold">Cargando suscripciones...</span>
                  </div>
                </td>
              </tr>
              <tr *ngFor="let sub of suscripciones; trackBy: trackById">
                <!-- Empresa -->
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-2">
                       <i class="bi bi-building"></i>
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate" [title]="sub.empresa_nombre || 'Empresa Desconocida'">
                        {{ sub.empresa_nombre || 'Empresa Desconocida' }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Plan -->
                <td>
                  <div class="d-flex flex-column">
                    <span class="text-dark fw-600" style="font-size: 0.85rem;">{{ sub.plan_nombre || 'Sin Plan' }}</span>
                    <small class="text-muted" *ngIf="sub.precio_plan">{{ sub.precio_plan | currency:'USD' }} / año</small>
                  </div>
                </td>

                <!-- Inicio -->
                <td>
                   <span class="text-muted fw-600" style="font-size: 0.85rem;">{{ sub.fecha_inicio ? (sub.fecha_inicio | date:'dd MMM, yyyy') : '-' }}</span>
                </td>

                <!-- Vencimiento -->
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-bold" [class.text-danger]="sub.fecha_fin && isOverdue(sub.fecha_fin)" style="font-size: 0.85rem;">
                       {{ sub.fecha_fin ? (sub.fecha_fin | date:'dd MMM, yyyy') : '-' }}
                    </span>
                    <small class="text-danger fw-700" *ngIf="sub.fecha_fin && isOverdue(sub.fecha_fin)" style="font-size: 0.65rem;">
                       VENCIDO
                    </small>
                  </div>
                </td>

                <!-- Pago -->
                <td>
                    <span class="badge-pago" [ngClass]="sub.estado_pago?.toLowerCase()">
                        {{ sub.estado_pago || 'PENDIENTE' }}
                    </span>
                </td>

                <!-- Estado -->
                <td>
                  <span class="badge-status-premium" [ngClass]="getStatusClass(sub.estado)">
                    {{ sub.estado }}
                  </span>
                </td>

                <!-- Acciones -->
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
                      <li *ngIf="sub.estado_pago === 'PENDIENTE' || sub.estado_pago === 'ATRASADO'">
                        <button class="dropdown-item rounded-3 py-2 fw-bold text-danger bg-danger bg-opacity-10" (click)="onConfirmarPago.emit(sub)">
                          <i class="bi bi-check-all text-danger"></i>
                          <span class="ms-2">Confirmar Cobro</span>
                        </button>
                      </li>
                      <li>
                        <button *ngIf="sub.estado_pago === 'PAGADO' || sub.estado === 'VENCIDA'" class="dropdown-item rounded-3 py-2" (click)="onRegistrarPago.emit(sub)">
                          <i class="bi bi-currency-dollar text-success"></i>
                          <span class="ms-2">Renovar / Extender</span>
                        </button>
                        <button *ngIf="sub.estado_pago === 'PENDIENTE' || sub.estado_pago === 'ATRASADO'" class="dropdown-item rounded-3 py-2" (click)="onRegistrarPago.emit(sub)" disabled>
                          <i class="bi bi-currency-dollar text-muted"></i>
                          <span class="ms-2">Pago Pendiente...</span>
                        </button>
                      </li>

                      <li><hr class="dropdown-divider mx-2"></li>
                      
                      <!-- Botones de Ciclo de Vida Dinámicos -->
                      <li *ngIf="sub.estado === 'ACTIVA' || sub.estado === 'VENCIDA'">
                        <button class="dropdown-item rounded-3 py-2" (click)="onSuspender.emit(sub)">
                          <i class="bi bi-pause-circle-fill text-warning"></i>
                          <span class="ms-3">Suspender Servicio</span>
                        </button>
                      </li>
                      <li *ngIf="sub.estado === 'SUSPENDIDA'">
                        <button class="dropdown-item rounded-3 py-2" (click)="onActivar.emit(sub)">
                          <i class="bi bi-play-circle-fill text-success"></i>
                          <span class="ms-3">Activar Servicio</span>
                        </button>
                      </li>
                      <li>
                         <button *ngIf="sub.estado !== 'CANCELADA'" class="dropdown-item rounded-3 py-2" (click)="onCancelar.emit(sub)">
                          <i class="bi bi-x-circle-fill text-danger"></i>
                          <span class="ms-3">Cancelar Definitivamente</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div *ngIf="!loading && suscripciones.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-3"></i>
            No se encontraron suscripciones registradas.
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
      color: var(--text-main, #0f172a);
      font-weight: 800;
      border-bottom: 2px solid var(--border-color, #f1f5f9);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-muted, #475569);
      font-size: var(--text-md);
    }
    
    .avatar-soft-premium {
      width: 38px; height: 38px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1rem;
      background: var(--primary-color);
      color: #ffffff;
    }

    .badge-status-premium {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: var(--text-sm);
      font-weight: 600;
      display: inline-block;
      text-transform: uppercase;
    }
    .badge-status-premium.activa { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-premium.vencida { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .badge-status-premium.cancelada { background: var(--status-neutral-bg); color: var(--status-neutral-text); }
    .badge-status-premium.suspendida { background: var(--status-warning-bg); color: var(--status-warning-text); }
    
    .badge-pago {
        padding: 0.35rem 0.75rem; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
        border: none;
    }
    .badge-pago.pagado { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-pago.pendiente { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .badge-pago.atrasado { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #f8fafc; color: #0f172a;
    }

    .dropdown-item {
      display: flex; align-items: center; padding: 0.5rem 1rem;
      font-size: var(--text-base); font-weight: 500;
      color: var(--text-muted); cursor: pointer; border: none; background: transparent; width: 100%; text-align: left;
    }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    .dropdown-item:hover { background: #f8fafc; color: #0f172a; }

    .fw-600 { font-weight: 600; }
    .fw-700 { font-weight: 700; }
    .text-corporate { color: var(--status-info-text) !important; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class SuscripcionTableComponent {
  @Input() loading: boolean = false;
  @Input() suscripciones: Suscripcion[] = [];
  @Output() onRegistrarPago = new EventEmitter<Suscripcion>();

  @Output() onActivar = new EventEmitter<Suscripcion>();
  @Output() onCancelar = new EventEmitter<Suscripcion>();
  @Output() onSuspender = new EventEmitter<Suscripcion>();
  @Output() onConfirmarPago = new EventEmitter<Suscripcion>();

  trackById(index: number, sub: Suscripcion): string {
    return sub.id;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  isOverdue(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }
}

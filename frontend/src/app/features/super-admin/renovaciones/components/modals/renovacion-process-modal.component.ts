import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudRenovacion } from '../../../../../domain/models/renovacion.model';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-renovacion-process-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-premium-lg rounded-4 overflow-hidden animate__animated animate__zoomIn animate__faster">
          <div class="modal-header border-0 p-4 pb-0">
             <h5 class="fw-800 text-dark mb-0" style="color: var(--text-main) !important;">
               {{ seleccionada?.tipo === 'RENOVACION' ? 'Aprobar Renovación' : 'Aprobar Cambio de Plan (Upgrade)' }}
             </h5>
             <button type="button" class="btn-close shadow-none" (click)="onClose.emit()"></button>
          </div>
          <div class="modal-body p-4" *ngIf="seleccionada">
            <p class="text-muted">
              ¿Estás seguro de que deseas aprobar {{ seleccionada.tipo === 'RENOVACION' ? 'la renovación' : 'el cambio de plan' }} al plan 
              <strong class="text-dark">{{ seleccionada.plan_nombre }}</strong> para 
              <strong class="text-dark">{{ seleccionada.empresa_nombre }}</strong>?
            </p>
            
            <div class="benefit-box p-3 mb-4">
              <ul class="list-unstyled mb-0">
                <li class="d-flex align-items-center mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  <span class="small fw-600">
                    {{ seleccionada.tipo === 'RENOVACION' ? 'Extensión automática de 365 días' : 'Activación inmediata del nuevo plan (365 días)' }}
                  </span>
                </li>
                <li class="d-flex align-items-center mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  <span class="small fw-600">Registro de pago anual en el sistema</span>
                </li>
                <li class="d-flex align-items-center">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  <span class="small fw-600">Cálculo de comisión para el vendedor</span>
                </li>
              </ul>
            </div>

            <!-- Toggle Pago Recibido -->
            <div class="pago-toggle-box p-3 mb-3" [class.pagado]="pagoRecibido" [class.pendiente]="!pagoRecibido">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <div class="fw-800 text-dark" style="font-size: 0.85rem;">
                    {{ pagoRecibido ? 'Pago Recibido' : 'Pago Pendiente' }}
                  </div>
                  <div class="text-muted" style="font-size: 0.75rem;">
                    {{ pagoRecibido ? 'El plan se activará como pagado.' : 'Se activará el servicio, el pago se confirmará después.' }}
                  </div>
                </div>
                <div class="form-check form-switch ms-3 mb-0">
                  <input class="form-check-input" type="checkbox" role="switch" [(ngModel)]="pagoRecibido" style="width: 2.5rem; height: 1.25rem; cursor: pointer;">
                </div>
              </div>
            </div>

            <div class="payment-fields" *ngIf="pagoRecibido">
              <div class="mb-3">
                <label class="smallest text-uppercase fw-800 text-muted d-block mb-2">Método de Pago</label>
                <select [(ngModel)]="metodo_pago" class="form-select lux-input">
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="TARJETA">TARJETA</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              <div class="mb-3" *ngIf="requiereComprobante">
                <label class="smallest text-uppercase fw-800 text-muted d-block mb-2">Número de Comprobante / Referencia *</label>
                <input type="text" [(ngModel)]="numero_comprobante" class="form-control lux-input" placeholder="Ej: TR-000123">
                <div class="text-danger smallest fw-bold mt-1" *ngIf="!numero_comprobante.trim()">
                  * Este campo es obligatorio para aprobar
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <div class="d-flex w-100 gap-2">
              <button class="btn-lux-secondary flex-grow-1" (click)="onClose.emit()">Cerrar</button>
              <ng-container *ngIf="seleccionada?.estado === 'PENDIENTE'">
                <button class="btn btn-outline-danger px-4 border-0 fw-bold" (click)="onRejectAction.emit()">Rechazar</button>
                <button
                  class="btn-lux-primary px-4 fw-bold"
                  [disabled]="cargando || (pagoRecibido && requiereComprobante && !numero_comprobante.trim())"
                  (click)="confirmar()"
                >
                  <span *ngIf="cargando" class="spinner-border spinner-border-sm me-2"></span>
                  Confirmar Aprobación
                </button>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); }
    .shadow-premium-lg { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    
    .benefit-box {
      background: var(--status-success-bg); border: 1px solid var(--status-success); border-radius: 16px;
    }

    .btn-attachment {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 0.75rem 1rem; display: flex; align-items: center;
      text-decoration: none; color: #475569; font-weight: 600; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-attachment:hover { background: var(--bg-main); color: var(--status-info-text); }

    .btn-lux-primary {
      background: var(--status-success); color: #ffffff;
      border: none; padding: 0.75rem 1.5rem; border-radius: 12px;
      transition: all 0.2s;
    }
    .btn-lux-primary:hover:not(:disabled) { opacity: 0.85; filter: brightness(1.1); transform: translateY(-1px); }
    
    .btn-lux-secondary {
      background: #ffffff; color: var(--text-muted); border: 1px solid var(--border-color);
      padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600;
      transition: all 0.2s;
    }
    .btn-lux-secondary:hover { background: var(--bg-main); }

    .pago-toggle-box {
      border-radius: 12px; border: 1px solid;
      transition: all 0.2s;
    }
    .pago-toggle-box.pagado { background: var(--status-success-bg); border-color: var(--status-success); }
    .pago-toggle-box.pendiente { background: var(--status-warning-bg); border-color: var(--status-warning); }

    .smallest { font-size: 0.65rem; }
    .fw-800 { font-weight: 800; }
    .fw-600 { font-weight: 600; }
  `]
})
export class RenovacionProcessModalComponent {
  @Input() seleccionada: SolicitudRenovacion | null = null;
  @Input() cargando: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<any>();
  @Output() onRejectAction = new EventEmitter<void>();

  metodo_pago: string = 'TRANSFERENCIA';
  numero_comprobante: string = '';
  pagoRecibido: boolean = true;

  get requiereComprobante(): boolean {
    return !['EFECTIVO', 'OTRO'].includes(this.metodo_pago);
  }

  confirmar() {
    this.onConfirm.emit({
      metodo_pago: this.pagoRecibido ? this.metodo_pago : null,
      numero_comprobante: this.pagoRecibido ? this.numero_comprobante : null,
      estado_pago: this.pagoRecibido ? 'PAGADO' : 'PENDIENTE'
    });
  }
}

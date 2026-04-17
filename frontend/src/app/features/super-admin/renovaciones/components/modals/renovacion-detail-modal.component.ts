import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudRenovacion } from '../../../../../domain/models/renovacion.model';

@Component({
  selector: 'app-renovacion-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-premium-lg rounded-4 overflow-hidden animate__animated animate__zoomIn animate__faster">
          <div class="modal-header border-0 p-4 pb-0">
             <h5 class="fw-800 mb-0" style="color: var(--text-main) !important;">Detalle de Solicitud</h5>
             <button type="button" class="btn-close shadow-none" (click)="onClose.emit()"></button>
          </div>
          <div class="modal-body p-4" *ngIf="seleccionada">
            <div class="row g-4">
              <!-- Info Principal -->
              <div class="col-md-7">
                <div class="info-card h-100">
                  <h6 class="text-uppercase smallest fw-800 text-muted mb-3 letter-spacing-1">Información de la Empresa</h6>
                  <div class="d-flex align-items-center mb-4">
                    <div class="avatar-soft-lg me-3">
                      {{ (seleccionada.empresa_nombre?.charAt(0) || 'E') }}
                    </div>
                    <div>
                      <h5 class="mb-0 fw-800 text-dark">{{ seleccionada.empresa_nombre }}</h5>
                    </div>
                  </div>
                  
                  <div class="grid-details">
                    <div class="detail-item">
                      <label>Plan Solicitado</label>
                      <span>{{ seleccionada.plan_nombre }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Estado Actual</label>
                      <span class="badge-status-premium" [ngClass]="seleccionada.estado.toLowerCase()">{{ seleccionada.estado }}</span>
                    </div>
                    <div class="detail-item">
                      <label>Fecha Solicitud</label>
                      <span>{{ seleccionada.fecha_solicitud | date:'medium' }}</span>
                    </div>
                    <div class="detail-item" *ngIf="seleccionada.fecha_procesamiento">
                      <label>Fecha Proceso</label>
                      <span>{{ seleccionada.fecha_procesamiento | date:'medium' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Info Secundaria -->
              <div class="col-md-5">
                <div class="h-100 d-flex flex-column gap-3">
                  <div class="side-info-card">
                    <label>Vendedor</label>
                    <div class="d-flex align-items-center mt-1">
                      <i class="bi bi-person-badge text-primary me-2"></i>
                      <span class="fw-700 text-dark">{{ seleccionada.vendedor_nombre || 'Gestión Directa' }}</span>
                    </div>
                  </div>

                  <!-- Comprobante (Oculto temporalmente) -->
                  <div class="side-info-card" *ngIf="false">
                    <label>Comprobante de Pago</label>
                    <a [href]="seleccionada?.comprobante_url" target="_blank" class="btn-attachment mt-2">
                       <i class="bi bi-file-earmark-image me-2 text-primary"></i>
                       <span class="text-truncate">Ver Adjunto</span>
                       <i class="bi bi-box-arrow-up-right ms-auto smallest opacity-50"></i>
                    </a>
                  </div>

                  <div class="side-info-card danger" *ngIf="seleccionada.motivo_rechazo">
                    <label>Motivo de Rechazo</label>
                    <p class="mb-0 mt-1 small text-danger fw-600">{{ seleccionada.motivo_rechazo }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
             <button class="btn-lux-secondary px-4" (click)="onClose.emit()">Cerrar</button>
             <button *ngIf="seleccionada?.estado === 'PENDIENTE' && !isVendedor" 
                     class="btn-lux-primary px-4 fw-bold" 
                     (click)="onProcess.emit()">
               Procesar Solicitud
             </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); }
    .shadow-premium-lg { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    
    .avatar-soft-lg {
      width: 56px; height: 56px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.4rem;
      background: var(--status-info-bg); color: var(--status-info-text);
    }

    .info-card {
      background: var(--bg-main); padding: 1.5rem; border-radius: 20px;
      border: 1px solid var(--border-color);
    }
    .side-info-card {
      background: var(--bg-main); padding: 1rem; border-radius: 16px;
      border: 1px solid var(--border-color);
    }
    .side-info-card.danger { background: var(--status-danger-bg); border-color: var(--status-danger); }
    
    .grid-details {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;
      padding-top: 1.5rem; border-top: 1px solid #e2e8f0;
    }
    .detail-item label {
      display: block; font-size: 0.65rem; font-weight: 800;
      color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;
    }
    .detail-item span { font-weight: 700; color: var(--text-main); font-size: 0.9rem; }
    
    .side-info-card label {
       font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;
    }

    .btn-attachment {
      background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 0.75rem 1rem; display: flex; align-items: center;
      text-decoration: none; color: #475569; font-weight: 600; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-attachment:hover { background: #f1f5f9; color: var(--primary-color); border-color: #cbd5e1; }

    .btn-lux-primary {
      background: var(--status-success); color: #ffffff;
      border: none; padding: 0.75rem 1.5rem; border-radius: 12px;
      transition: all 0.2s;
    }
    .btn-lux-primary:hover { opacity: 0.85; filter: brightness(1.1); transform: translateY(-1px); }
    
    .btn-lux-secondary {
      background: #ffffff; color: var(--text-muted); border: 1px solid var(--border-color);
      padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600;
      transition: all 0.2s;
    }
    .btn-lux-secondary:hover { background: var(--bg-main); }

    .badge-status-premium {
      padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.7rem;
      font-weight: 700; text-transform: uppercase;
    }
    .badge-status-premium.pendiente { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .badge-status-premium.aceptada { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-premium.rechazada { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .fw-800 { font-weight: 800; }
    .fw-700 { font-weight: 700; }
    .fw-600 { font-weight: 600; }
    .letter-spacing-1 { letter-spacing: 1px; }
  `]
})
export class RenovacionDetailModalComponent {
  @Input() seleccionada: SolicitudRenovacion | null = null;
  @Input() isVendedor: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onProcess = new EventEmitter<void>();
}

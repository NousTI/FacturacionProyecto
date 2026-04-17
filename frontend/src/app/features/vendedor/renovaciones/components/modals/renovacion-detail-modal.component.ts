import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudRenovacion } from '../../../../../domain/models/renovacion.model';

@Component({
  selector: 'app-renovacion-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-container-premium" (click)="$event.stopPropagation()">
        
        <div class="modal-header-premium">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-large">
              {{ (seleccionada.empresa_nombre?.charAt(0) || 'E') }}
            </div>
            <div>
              <h2 class="modal-title">{{ seleccionada.empresa_nombre }}</h2>
              <span class="badge-status-premium" [ngClass]="getEstadoClass(seleccionada.estado)">
                {{ seleccionada.estado }}
              </span>
            </div>
          </div>
          <button (click)="onClose.emit()" class="btn-close-circle">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-premium scroll-custom">
          
          <div class="row g-4">
            <!-- Info Gestión -->
            <div class="col-md-7">
              <div class="section-card h-100">
                <h3 class="section-title"><i class="bi bi-info-circle me-2"></i>Información de la Gestión</h3>
                
                <div class="info-grid">
                  <div class="info-item">
                    <label>Plan Solicitado</label>
                    <span class="fw-bold">{{ seleccionada.plan_nombre }}</span>
                  </div>
                  
                  <div class="info-item">
                    <label>Fecha Solicitud</label>
                    <span>{{ seleccionada.fecha_solicitud | date:'medium' }}</span>
                  </div>

                  <div class="info-item" *ngIf="seleccionada.fecha_procesamiento">
                    <label>Fecha Proceso</label>
                    <span>{{ seleccionada.fecha_procesamiento | date:'medium' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Adjuntos y Notas -->
            <div class="col-md-5">
              <div class="d-flex flex-column gap-3 h-100">
                <!-- Comprobante (Oculto temporalmente) -->
                <div class="section-card py-3" *ngIf="false">
                  <label class="editorial-label mb-2">Comprobante Cargado</label>
                  <a [href]="seleccionada.comprobante_url" target="_blank" class="btn-adjunto">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-file-earmark-image fs-5 text-primary"></i>
                      <div class="text-truncate">
                        <span class="d-block small fw-bold">Ver Adjunto</span>
                        <small class="text-muted smallest">Click para abrir</small>
                      </div>
                    </div>
                    <i class="bi bi-box-arrow-up-right smallest text-muted"></i>
                  </a>
                </div>

                <!-- Motivo Rechazo -->
                <div class="section-card bg-danger-subtle border-danger-subtle py-3" *ngIf="seleccionada.estado === 'RECHAZADA' && seleccionada.motivo_rechazo">
                  <label class="smallest text-danger text-uppercase d-block fw-bold mb-1">Motivo de Rechazo</label>
                  <p class="mb-0 small text-danger fw-medium">{{ seleccionada.motivo_rechazo }}</p>
                </div>

                <!-- Nota Informativa -->
                <div class="section-card bg-info-subtle border-info-subtle flex-grow-1">
                  <h6 class="smallest fw-bold text-info-dark text-uppercase mb-2">Nota Informativa</h6>
                  <p class="smallest text-muted mb-0">{{ getNotaInformativa(seleccionada.estado) }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="modal-footer-premium">
          <button (click)="onClose.emit()" class="btn-secondary-premium w-100">Cerrar Detalle</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
    }
    .modal-container-premium {
      background: var(--bg-main); width: 750px; max-width: 95vw;
      border-radius: 28px; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
      border: 1px solid var(--border-color);
    }
    .modal-header-premium {
      padding: 1.5rem 2rem; background: var(--bg-main); border-bottom: 1px solid var(--border-color);
      display: flex; justify-content: space-between; align-items: center;
    }
    .avatar-large {
      width: 52px; height: 52px; background: var(--primary-color); color: white;
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 800;
    }
    .modal-title { font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin: 0; }
    .btn-close-circle {
      width: 32px; height: 32px; border-radius: 50%; border: none;
      background: var(--bg-main); color: var(--text-muted); display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.2s;
    }
    .btn-close-circle:hover { background: var(--status-danger-bg); color: var(--status-danger-text); }
    
    .modal-body-premium { padding: 2rem; max-height: 70vh; overflow-y: auto; }
    .section-card {
      background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 20px; padding: 1.5rem;
    }
    .section-title { font-size: 0.8rem; font-weight: 800; color: var(--text-muted); margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .info-item { display: flex; flex-direction: column; }
    .info-item label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
    .info-item span { font-size: 1rem; font-weight: 600; color: var(--text-main); }
    
    .btn-adjunto {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem; background: var(--status-info-bg); border: 1px solid var(--border-color);
      border-radius: 12px; text-decoration: none; transition: all 0.2s;
      color: var(--status-info-text);
    }
    .btn-adjunto:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

    .modal-footer-premium { padding: 1.5rem 2rem; border-top: 1px solid var(--border-color); }
    .btn-secondary-premium {
      background: var(--status-natural-bg); border: 1px solid var(--border-color); color: var(--text-main);
      padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s;
    }
    .btn-secondary-premium:hover { background: var(--status-info-bg); color: var(--status-info-text); }
    
    .badge-status-premium { padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
    .badge-pending { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .badge-accepted { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-rejected { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .bg-danger-soft { background-color: var(--status-danger-bg) !important; color: var(--status-danger-text) !important; border: 1px solid var(--status-danger-bg) !important; }
    .bg-info-soft { background-color: var(--status-info-bg) !important; color: var(--status-info-text) !important; border: 1px solid var(--status-info-bg) !important; }
    .text-info-dark { color: var(--status-info-text) !important; }
    .smallest { font-size: 0.7rem; }
    .editorial-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); }
  `]
})
export class RenovacionDetailModalComponent {
  @Input() seleccionada!: SolicitudRenovacion;
  @Output() onClose = new EventEmitter<void>();

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'badge-pending';
      case 'ACEPTADA': return 'badge-accepted';
      case 'RECHAZADA': return 'badge-rejected';
      default: return '';
    }
  }

  getNotaInformativa(estado?: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'Esta solicitud está siendo revisada por el departamento administrativo. Una vez aprobada, el plan del cliente se actualizará automáticamente.';
      case 'ACEPTADA':
        return 'Esta solicitud ha sido aprobada con éxito. El plan del cliente ha sido actualizado y la comisión ha sido registrada en tu historial.';
      case 'RECHAZADA':
        return 'Esta solicitud ha sido rechazada. Por favor, revisa el motivo indicado arriba y contacta con el cliente.';
      default:
        return 'Solicitud en proceso de gestión administrativa.';
    }
  }
}

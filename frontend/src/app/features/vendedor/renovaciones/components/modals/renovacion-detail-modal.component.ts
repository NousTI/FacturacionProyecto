import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudRenovacion } from '../../../../../domain/models/renovacion.model';

@Component({
  selector: 'app-renovacion-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-container-premium animate__animated animate__slideInUp animate__faster" (click)="$event.stopPropagation()">
        
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
                  <a [href]="seleccionada?.comprobante_url" target="_blank" class="btn-adjunto">
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
      background: #ffffff; width: 750px; max-width: 95vw;
      border-radius: 28px; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-premium {
      padding: 1.5rem 2rem; background: #f8fafc; border-bottom: 1px solid #f1f5f9;
      display: flex; justify-content: space-between; align-items: center;
    }
    .avatar-large {
      width: 52px; height: 52px; background: var(--primary-color, #161d35); color: white;
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 800;
    }
    .modal-title { font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 0; }
    .btn-close-circle {
      width: 32px; height: 32px; border-radius: 50%; border: none;
      background: #ffffff; color: #94a3b8; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05); cursor: pointer;
    }
    
    .modal-body-premium { padding: 2rem; max-height: 70vh; overflow-y: auto; }
    .section-card {
      background: #ffffff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 1.25rem;
    }
    .section-title { font-size: 0.8rem; font-weight: 800; color: #475569; margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .info-item { display: flex; flex-direction: column; }
    .info-item.full-width { grid-column: span 2; }
    .info-item label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
    .info-item span { font-size: 0.9rem; font-weight: 600; color: #1e293b; }
    .text-monospace { font-family: monospace; color: #64748b; font-size: 0.75rem !important; }
    
    .btn-adjunto {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1rem; background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 12px; text-decoration: none; transition: all 0.2s;
    }
    .btn-adjunto:hover { background: #f1f5f9; border-color: #cbd5e1; }

    .modal-footer-premium { padding: 1.5rem 2rem; }
    .btn-secondary-premium {
      background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;
      padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer;
    }
    
    .badge-status-premium { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.7rem; font-weight: 800; }
    .badge-pending { background: #fff9db; color: #f08c00; }
    .badge-accepted { background: #ebfbee; color: #2b8a3e; }
    .badge-rejected { background: #fff5f5; color: #c92a2a; }

    .bg-danger-subtle { background-color: #fff5f5 !important; }
    .border-danger-subtle { border-color: #ffc9c9 !important; }
    .bg-info-subtle { background-color: #e7f5ff !important; }
    .border-info-subtle { border-color: #a5d8ff !important; }
    .text-info-dark { color: #1971c2 !important; }
    .smallest { font-size: 0.7rem; }
    .editorial-label { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
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

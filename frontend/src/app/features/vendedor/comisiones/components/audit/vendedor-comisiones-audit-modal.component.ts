import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-vendedor-comisiones-audit-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-container-audit" (click)="$event.stopPropagation()">
        
        <div class="modal-header">
          <div>
            <h5 class="modal-title">Historial de Cambios</h5>
            <p class="modal-subtitle">Registro de actividad de tu comisión</p>
          </div>
          <button class="btn-close-modal" (click)="onClose.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body-audit">
            <div *ngIf="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>

            <div *ngIf="!loading && logs.length === 0" class="text-center py-5 text-muted">
                <i class="bi bi-clock-history fs-1 mb-2 d-block"></i>
                No hay registros de cambios para esta comisión.
            </div>

            <div *ngIf="!loading && logs.length > 0" class="timeline">
                <div class="timeline-item" *ngFor="let log of logs">
                    <div class="timeline-icon" [ngClass]="getStatusColor(log.estado_nuevo)">
                        <i class="bi" [ngClass]="getStatusIcon(log.estado_nuevo)"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="badge" [ngClass]="getBadgeClass(log.estado_nuevo)">
                                {{ log.estado_nuevo }}
                            </span>
                            <span class="timestamp">{{ log.created_at | date:'medium' }}</span>
                        </div>
                        <p class="mb-1">
                             <span class="text-muted small">Cambiado por:</span> 
                             <span class="fw-bold">{{ log.responsable_email || 'Sistema' }}</span>
                        </p>
                        <div *ngIf="log.observaciones" class="mt-2 p-2 bg-light rounded small">
                            <em>"{{ log.observaciones }}"</em>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 10010;
    }
    .modal-container-audit {
      background: white; width: 600px; max-width: 95vw; height: 80vh;
      border-radius: 20px; overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 20px 60px -10px rgba(22, 29, 53, 0.2);
    }
    .modal-header {
      padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9;
      display: flex; justify-content: space-between; align-items: flex-start;
      background: #fff;
    }
    .modal-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0; }
    .modal-subtitle { font-size: 0.9rem; color: #64748b; margin: 0; }
    
    .btn-close-modal {
      background: #f1f5f9; border: none; color: #64748b;
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-close-modal:hover { background: #e2e8f0; color: #ef4444; transform: rotate(90deg); }

    .modal-body-audit {
        padding: 2rem; overflow-y: auto; flex: 1; background: #f8fafc;
    }

    /* Timeline */
    .timeline { position: relative; padding-left: 2rem; }
    .timeline::before {
        content: ''; position: absolute; left: 0.9rem; top: 0.5rem; bottom: 0;
        width: 2px; background: #e2e8f0;
    }
    .timeline-item { position: relative; margin-bottom: 2rem; }
    .timeline-icon {
        position: absolute; left: -2.1rem; top: 0;
        width: 36px; height: 36px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        border: 3px solid #f8fafc; z-index: 2;
    }
    .timeline-content {
        background: white; padding: 1rem; border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;
    }
    .timestamp { font-size: 0.8rem; color: #94a3b8; }

    /* Colors */
    .timeline-icon.success { background: #dcfce7; color: #16a34a; }
    .timeline-icon.warning { background: #fef9c3; color: #ca8a04; }
    .timeline-icon.danger { background: #fee2e2; color: #ef4444; }
    .timeline-icon.primary { background: #e0e7ff; color: #4f46e5; }
    .timeline-icon.secondary { background: #f1f5f9; color: #64748b; }

    .badge { padding: 0.4em 0.8em; border-radius: 6px; font-weight: 600; font-size: 0.75rem; letter-spacing: 0.5px; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-primary { background: #dbeafe; color: #1e40af; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-secondary { background: #f1f5f9; color: #475569; }
  `]
})
export class VendedorComisionesAuditModalComponent {
    @Input() logs: any[] = [];
    @Input() loading: boolean = false;
    @Output() onClose = new EventEmitter<void>();

    getStatusIcon(status: string): string {
        switch (status) {
            case 'APROBADA': return 'bi-check-lg';
            case 'PAGADA': return 'bi-wallet2';
            case 'RECHAZADA': return 'bi-x-lg';
            case 'PENDIENTE': return 'bi-hourglass-split';
            default: return 'bi-circle';
        }
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'APROBADA': return 'success';
            case 'PAGADA': return 'primary';
            case 'RECHAZADA': return 'danger';
            case 'PENDIENTE': return 'warning';
            default: return 'secondary';
        }
    }

    getBadgeClass(status: string): string {
        switch (status) {
            case 'APROBADA': return 'badge-success';
            case 'PAGADA': return 'badge-primary';
            case 'RECHAZADA': return 'badge-danger';
            case 'PENDIENTE': return 'bg-warning text-dark';
            default: return 'badge-secondary';
        }
    }
}

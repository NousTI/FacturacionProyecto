import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudRenovacion } from '../../../../../domain/models/renovacion.model';

@Component({
  selector: 'app-renovacion-process-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-premium-lg rounded-4 overflow-hidden animate__animated animate__zoomIn animate__faster">
          <div class="modal-header border-0 p-4 pb-0">
             <h5 class="fw-800 text-dark mb-0">Aprobar Renovación</h5>
             <button type="button" class="btn-close shadow-none" (click)="onClose.emit()"></button>
          </div>
          <div class="modal-body p-4" *ngIf="seleccionada">
            <p class="text-muted">¿Estás seguro de que deseas aprobar la renovación para <strong class="text-dark">{{ seleccionada.empresa_nombre }}</strong>?</p>
            
            <div class="benefit-box p-3 mb-4">
              <ul class="list-unstyled mb-0">
                <li class="d-flex align-items-center mb-2">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  <span class="small fw-600">Extensión automática de 365 días</span>
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

            <div *ngIf="seleccionada.comprobante_url" class="mb-2">
               <label class="smallest text-uppercase fw-800 text-muted d-block mb-2">Documento Recibido</label>
               <a [href]="seleccionada.comprobante_url" target="_blank" class="btn-attachment">
                 <i class="bi bi-file-earmark-image me-2 text-primary"></i>
                 <span class="text-truncate">Ver comprobante adjunto</span>
                 <i class="bi bi-box-arrow-up-right ms-auto smallest opacity-50"></i>
               </a>
            </div>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <div class="d-flex w-100 gap-2">
              <button class="btn-lux-secondary flex-grow-1" (click)="onClose.emit()">Cerrar</button>
              <ng-container *ngIf="seleccionada?.estado === 'PENDIENTE'">
                <button class="btn btn-outline-danger px-4 border-0 fw-bold" (click)="onRejectAction.emit()">Rechazar</button>
                <button class="btn-lux-primary px-4 fw-bold" [disabled]="cargando" (click)="onConfirm.emit()">
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
    .modal-backdrop { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); }
    .shadow-premium-lg { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    
    .benefit-box {
      background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 16px;
    }

    .btn-attachment {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 0.75rem 1rem; display: flex; align-items: center;
      text-decoration: none; color: #475569; font-weight: 600; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-attachment:hover { background: #f1f5f9; color: var(--primary-color); }

    .btn-lux-primary {
      background: var(--primary-color, #161d35); color: #ffffff;
      border: none; padding: 0.75rem 1.5rem; border-radius: 12px;
      transition: all 0.2s;
    }
    .btn-lux-primary:hover:not(:disabled) { background: #0f172a; transform: translateY(-1px); }
    
    .btn-lux-secondary {
      background: #f1f5f9; color: #475569; border: none;
      padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600;
      transition: all 0.2s;
    }
    .btn-lux-secondary:hover { background: #e2e8f0; }

    .smallest { font-size: 0.65rem; }
    .fw-800 { font-weight: 800; }
    .fw-600 { font-weight: 600; }
  `]
})
export class RenovacionProcessModalComponent {
  @Input() seleccionada: SolicitudRenovacion | null = null;
  @Input() cargando: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onRejectAction = new EventEmitter<void>();
}

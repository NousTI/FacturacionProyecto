import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-renovacion-reject-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-premium-lg rounded-4 overflow-hidden animate__animated animate__zoomIn animate__faster">
          <div class="modal-header border-0 p-4 pb-0">
             <h5 class="fw-800 mb-0" style="color: var(--status-danger-text) !important;">Rechazar Solicitud</h5>
             <button type="button" class="btn-close shadow-none" (click)="onClose.emit()"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-muted small mb-3">Indique la razón del rechazo. El usuario será notificado automáticamente de esta decisión.</p>
            
            <label class="form-label smallest fw-800 text-muted text-uppercase mb-2">Motivo del rechazo</label>
            <textarea class="form-control-premium" 
                      rows="4" 
                      placeholder="Ej: El comprobante adjunto no es válido o está incompleto..."
                      [(ngModel)]="motivo"
                      (ngModelChange)="onMotivoChange($event)"></textarea>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <div class="d-flex w-100 gap-2">
                <button class="btn-lux-secondary flex-grow-1" (click)="onClose.emit()">Cancelar</button>
                <button 
                    class="btn btn-danger px-4 py-2 fw-bold rounded-3" 
                    [disabled]="!motivo || cargando" 
                    (click)="onConfirm.emit()"
                >
                    <span *ngIf="cargando" class="spinner-border spinner-border-sm me-2"></span>
                    Confirmar Rechazo
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); }
    .shadow-premium-lg { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
    
    .form-control-premium {
      width: 100%; padding: 1rem; border-radius: 12px;
      border: 1px solid var(--border-color); background: var(--bg-main);
      font-size: 0.9rem; font-weight: 500; transition: all 0.2s; color: var(--text-main);
    }
    .form-control-premium:focus {
        outline: none; border-color: var(--status-danger); background: var(--bg-main);
        box-shadow: 0 0 0 4px var(--status-danger-bg);
    }

    .btn-lux-secondary {
      background: var(--bg-main); color: var(--text-muted); border: 1px solid var(--border-color);
      padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600;
      transition: all 0.2s;
    }
    .btn-lux-secondary:hover:not(:disabled) { background: var(--status-neutral-bg); color: var(--text-main); }

    .smallest { font-size: 0.65rem; }
    .fw-800 { font-weight: 800; }
  `]
})
export class RenovacionRejectModalComponent {
  @Input() motivo: string = '';
  @Input() cargando: boolean = false;
  @Output() motivoChange = new EventEmitter<string>();
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  onMotivoChange(val: string) {
    this.motivoChange.emit(val);
  }
}

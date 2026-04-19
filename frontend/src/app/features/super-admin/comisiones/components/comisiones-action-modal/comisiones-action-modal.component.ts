import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Comision } from '../../services/comisiones.service';



@Component({
  selector: 'app-comisiones-action-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-container-action" (click)="$event.stopPropagation()">
        
        <div class="modal-content-action">
          <div class="icon-wrapper" [ngClass]="getIconClass()">
            <i class="bi" [ngClass]="getIcon()"></i>
          </div>

          <h3 class="action-title">{{ getTitle() }}</h3>
          
          <p class="action-message">{{ getMessage() }}</p>

          <div class="comision-preview">
            <div class="preview-row">
              <span class="label">Vendedor:</span>
              <span class="value">{{ comision?.vendedor_nombre }}</span>
            </div>
            <div class="preview-row">
              <span class="label">Monto:</span>
              <span class="value fw-bold">{{ comision?.monto | currency:'USD' }}</span>
            </div>
          </div>

          <!-- INPUTS -->
          <div class="w-100 mb-4 text-start">
            
            <!-- Payment Method (Only for PAY) -->
            <div class="mb-3" *ngIf="type === 'PAY'">
              <label class="form-label small fw-bold text-muted">Método de Pago</label>
              <select class="form-select" [(ngModel)]="metodoPago">
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="CHEQUE">Cheque</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>

            <!-- Observations (Always Visible) -->
            <div>
              <label class="form-label small fw-bold text-muted">Observaciones (Opcional)</label>
              <textarea 
                class="form-control" 
                rows="3" 
                placeholder="Añadir notas adicionales..."
                [(ngModel)]="observaciones"
              ></textarea>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="onClose.emit()" [disabled]="loading">Cancelar</button>
            <button class="btn-confirm" [ngClass]="getBtnClass()" (click)="confirm()" [disabled]="loading">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ getConfirmLabel() }}
            </button>
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
    .modal-container-action {
      background: var(--bg-main); width: 450px; max-width: 90vw;
      border-radius: 24px; overflow: hidden;
      box-shadow: 0 20px 60px -10px rgba(22, 29, 53, 0.2);
    }
    .modal-content-action {
      padding: 2.5rem 2rem;
      display: flex; flex-direction: column; align-items: center; text-align: center;
    }
    
    .icon-wrapper {
      width: 64px; height: 64px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem; margin-bottom: 1.5rem;
    }
    .icon-wrapper.approve { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .icon-wrapper.pay { background: var(--status-success-bg); color: var(--status-success-text); }
    .icon-wrapper.reject { background: var(--status-danger-bg); color: var(--status-danger-text); }
    
    .action-title { font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.75rem; }
    .action-message { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5; }
    
    .comision-preview {
      background: var(--status-neutral-bg); width: 100%; border-radius: 16px;
      padding: 1rem; margin-bottom: 1.5rem;
      border: 1px solid var(--border-color);
    }
    .preview-row {
      display: flex; justify-content: space-between; margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .preview-row:last-child { margin-bottom: 0; }
    .preview-row .label { color: var(--text-muted); font-weight: 600; }
    .preview-row .value { color: var(--text-main); font-weight: 600; }
    
    .form-control, .form-select {
        background: var(--bg-main); border: 1px solid var(--border-color);
        border-radius: 12px; font-size: 0.9rem; padding: 0.75rem; color: var(--text-main);
    }
    .form-control:focus, .form-select:focus {
        border-color: var(--primary-color); box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }

    .modal-actions {
      display: flex; gap: 1rem; width: 100%;
    }
    .modal-actions button {
      flex: 1; padding: 0.85rem; border-radius: 12px;
      font-weight: 700; font-size: 0.95rem; border: none;
      transition: all 0.2s;
    }
    .btn-cancel { background: var(--status-neutral-bg); color: var(--text-muted); border: 1px solid var(--border-color); }
    .btn-cancel:hover { background: var(--border-color); color: var(--text-main); }
    
    .btn-confirm.approve { background: var(--status-warning-text); color: white; }
    .btn-confirm.approve:hover { opacity: 0.9; box-shadow: 0 4px 12px var(--status-warning-bg); }
    
    .btn-confirm.pay { background: var(--status-success-text); color: white; }
    .btn-confirm.pay:hover { opacity: 0.9; box-shadow: 0 4px 12px var(--status-success-bg); }

    .btn-confirm.reject { background: var(--status-danger-text); color: white; }
    .btn-confirm.reject:hover { opacity: 0.9; box-shadow: 0 4px 12px var(--status-danger-bg); }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ComisionesActionModalComponent {
  @Input() type: ActionType = 'APPROVE';
  @Input() comision: Comision | null = null;
  @Input() loading: boolean = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<any>();

  metodoPago: string = 'TRANSFERENCIA';
  observaciones: string = '';

  getTitle(): string {
    switch (this.type) {
      case 'APPROVE': return '¿Aprobar Comisión?';
      case 'PAY': return '¿Registrar Pago?';
      case 'REJECT': return '¿Rechazar Comisión?';
      default: return '';
    }
  }

  getMessage(): string {
    switch (this.type) {
      case 'APPROVE': return 'La comisión pasará a estado APROBADA y estará lista para el pago.';
      case 'PAY': return 'Se registrará el pago de esta comisión. Esta acción no se puede deshacer.';
      case 'REJECT': return 'La comisión será marcada como RECHAZADA. ¿Estás seguro?';
      default: return '';
    }
  }

  getIcon(): string {
    switch (this.type) {
      case 'APPROVE': return 'bi-check-lg';
      case 'PAY': return 'bi-wallet2';
      case 'REJECT': return 'bi-x-lg';
      default: return '';
    }
  }

  getIconClass(): string {
    switch (this.type) {
      case 'APPROVE': return 'approve';
      case 'PAY': return 'pay';
      case 'REJECT': return 'reject';
      default: return '';
    }
  }

  getBtnClass(): string {
    switch (this.type) {
      case 'APPROVE': return 'approve';
      case 'PAY': return 'pay';
      case 'REJECT': return 'reject';
      default: return '';
    }
  }

  getConfirmLabel(): string {
    if (this.loading) return 'Procesando...';
    switch (this.type) {
      case 'APPROVE': return 'Sí, Aprobar';
      case 'PAY': return 'Sí, Pagar';
      case 'REJECT': return 'Sí, Rechazar';
      default: return '';
    }
  }

  confirm() {
    if (this.loading) return;
    this.onConfirm.emit({
      observaciones: this.observaciones,
      metodoPago: this.type === 'PAY' ? this.metodoPago : undefined
    });
  }
}

export type ActionType = 'APPROVE' | 'PAY' | 'REJECT';

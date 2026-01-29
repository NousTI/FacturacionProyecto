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
      background: white; width: 450px; max-width: 90vw;
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
    .icon-wrapper.approve { background: #dcfce7; color: #16a34a; }
    .icon-wrapper.pay { background: #e0e7ff; color: #4f46e5; }
    .icon-wrapper.reject { background: #fee2e2; color: #ef4444; }
    
    .action-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.75rem; }
    .action-message { font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; line-height: 1.5; }
    
    .comision-preview {
      background: #f8fafc; width: 100%; border-radius: 16px;
      padding: 1rem; margin-bottom: 1.5rem;
      border: 1px solid #f1f5f9;
    }
    .preview-row {
      display: flex; justify-content: space-between; margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .preview-row:last-child { margin-bottom: 0; }
    .preview-row .label { color: #94a3b8; font-weight: 600; }
    .preview-row .value { color: #1e293b; font-weight: 600; }
    
    .form-control, .form-select {
        background: #f8fafc; border: 1px solid #e2e8f0;
        border-radius: 12px; font-size: 0.9rem; padding: 0.75rem;
    }
    .form-control:focus, .form-select:focus {
        border-color: #161d35; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }

    .modal-actions {
      display: flex; gap: 1rem; width: 100%;
    }
    .modal-actions button {
      flex: 1; padding: 0.85rem; border-radius: 12px;
      font-weight: 700; font-size: 0.95rem; border: none;
      transition: all 0.2s;
    }
    .btn-cancel { background: #f1f5f9; color: #64748b; }
    .btn-cancel:hover { background: #e2e8f0; }
    
    .btn-confirm.approve { background: #16a34a; color: white; }
    .btn-confirm.approve:hover { background: #15803d; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); }
    
    .btn-confirm.pay { background: #4f46e5; color: white; }
    .btn-confirm.pay:hover { background: #4338ca; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }

    .btn-confirm.reject { background: #ef4444; color: white; }
    .btn-confirm.reject:hover { background: #b91c1c; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
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

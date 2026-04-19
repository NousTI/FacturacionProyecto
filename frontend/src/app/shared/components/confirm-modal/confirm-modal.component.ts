import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (mousedown)="$event.target === $event.currentTarget && !loading && onCancel.emit()">
      <div class="modal-container-confirm shadow-premium">
        
        <div class="modal-body-confirm text-center">
          <!-- Icon Context -->
          <div class="icon-warning-container mb-4" [ngClass]="type">
            <i class="bi" [ngClass]="icon"></i>
          </div>

          <h3 class="confirm-title mb-2">{{ title }}</h3>
          <p class="confirm-message mb-0">{{ message }}</p>
          
          <div class="empresa-pill mt-3 mb-4" *ngIf="empresaName">
            <i class="bi bi-building me-2"></i>
            {{ empresaName }}
          </div>
        </div>

        <div class="modal-footer-confirm">
          <button (click)="onCancel.emit()" [disabled]="loading" class="btn-confirm-secondary">Cancelar</button>
          <button (click)="onConfirm.emit()" [disabled]="loading" class="btn-confirm-primary d-flex align-items-center justify-content-center gap-2" [ngClass]="type">
            <span *ngIf="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ loading ? 'Procesando...' : confirmText }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 53, 0.4);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
    }
    .modal-container-confirm {
      background: #ffffff;
      width: 100%;
      max-width: 420px;
      border-radius: 24px;
      overflow: hidden;
      padding: 2.5rem;
    }
    .icon-warning-container {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      font-size: 2rem;
    }
    .icon-warning-container.danger { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .icon-warning-container.success { background: var(--status-success-bg); color: var(--status-success-text); }
    .icon-warning-container.primary { background: var(--status-info-bg); color: var(--status-info-text); }
    .icon-warning-container.warning { background: var(--status-warning-bg); color: var(--status-warning-text); }

    .confirm-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .confirm-message {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .empresa-pill {
      display: inline-flex;
      align-items: center;
      background: var(--bg-main);
      padding: 0.5rem 1.25rem;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--status-info-text);
      border: 1px solid var(--border-color);
    }
    .modal-footer-confirm {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    .btn-confirm-primary {
      flex: 1;
      border: none;
      padding: 0.75rem;
      border-radius: 12px;
      font-weight: 700;
      color: white;
      transition: all 0.2s;
    }
    .btn-confirm-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .btn-confirm-primary.danger { background: var(--status-danger); }
    .btn-confirm-primary.danger:hover { background: var(--status-danger-text); opacity: 0.9; }
    
    .btn-confirm-primary.success { background: var(--status-success); }
    .btn-confirm-primary.success:hover { opacity: 0.85; filter: brightness(1.1); } /* Softer/Lighter green on hover */
    
    .btn-confirm-primary.primary { background: var(--secondary-color, var(--primary-color)); }
    .btn-confirm-primary.primary:hover { background: var(--status-info-text); }
    
    .btn-confirm-primary.warning { background: var(--status-warning); color: #ffffff; }
    .btn-confirm-primary.warning:hover { background: var(--status-warning-text); opacity: 0.9; }

    .btn-confirm-secondary {
      flex: 1;
      background: #ffffff;
      border: 1px solid var(--border-color);
      padding: 0.75rem;
      border-radius: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }
    .shadow-premium {
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ConfirmModalComponent {
  @Input() title: string = '¿Estás seguro?';
  @Input() message: string = 'Esta acción no se puede deshacer.';
  @Input() confirmText: string = 'Confirmar';
  @Input() type: 'danger' | 'success' | 'primary' | 'warning' = 'primary';
  @Input() icon: string = 'bi-exclamation-circle';
  @Input() empresaName: string = '';
  @Input() loading: boolean = false;

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirm-modal',
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onCancel.emit()">
      <div class="modal-container-confirm shadow-premium" (click)="$event.stopPropagation()">
        
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
          <button (click)="onCancel.emit()" class="btn-confirm-secondary">Cancelar</button>
          <button (click)="onConfirm.emit()" class="btn-confirm-primary" [ngClass]="type">
            {{ confirmText }}
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
    .icon-warning-container.danger { background: #fef2f2; color: #ef4444; }
    .icon-warning-container.success { background: #ecfdf5; color: #10b981; }
    .icon-warning-container.primary { background: #f8fafc; color: #161d35; }

    .confirm-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #1e293b;
    }
    .confirm-message {
      font-size: 0.95rem;
      color: #64748b;
      line-height: 1.5;
    }
    .empresa-pill {
      display: inline-flex;
      align-items: center;
      background: #f1f5f9;
      padding: 0.5rem 1.25rem;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #161d35;
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
    .btn-confirm-primary.danger { background: #ef4444; }
    .btn-confirm-primary.danger:hover { background: #dc2626; }
    .btn-confirm-primary.success { background: #10b981; }
    .btn-confirm-primary.success:hover { background: #059669; }
    .btn-confirm-primary.primary { background: #161d35; }
    .btn-confirm-primary.primary:hover { background: #232d4d; }

    .btn-confirm-secondary {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 0.75rem;
      border-radius: 12px;
      font-weight: 600;
      color: #64748b;
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
    @Input() type: 'danger' | 'success' | 'primary' = 'primary';
    @Input() icon: string = 'bi-exclamation-circle';
    @Input() empresaName: string = '';

    @Output() onConfirm = new EventEmitter<void>();
    @Output() onCancel = new EventEmitter<void>();
}

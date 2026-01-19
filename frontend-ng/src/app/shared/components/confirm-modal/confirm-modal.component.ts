import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-backdrop-custom px-3">
      <div class="card border-0 shadow-lg overflow-hidden animate-pop-in" style="width: 100%; max-width: 450px; border-radius: 24px;">
        <div class="card-body p-4 p-md-5 text-center">
            <!-- Icon Based on Type -->
            <div class="icon-wrapper mb-4" [ngClass]="type()">
                @if (type() === 'danger') { <i class="bi bi-exclamation-triangle-fill fs-1"></i> }
                @else if (type() === 'warning') { <i class="bi bi-question-circle-fill fs-1"></i> }
                @else { <i class="bi bi-info-circle-fill fs-1"></i> }
            </div>

            <h3 class="fw-bold text-dark mb-2">{{ title() }}</h3>
            <p class="text-secondary mb-5 px-md-3">{{ message() }}</p>

            <div class="d-grid gap-2">
                <button type="button" class="btn btn-confirm py-3 fw-bold rounded-pill shadow-sm" [ngClass]="getBtnClass()" (click)="confirm.emit()">
                    {{ confirmText() }}
                </button>
                <button type="button" class="btn btn-link text-decoration-none text-muted fw-bold py-2" (click)="cancel.emit()">
                    {{ cancelText() }}
                </button>
            </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-backdrop-custom {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }

    .animate-pop-in {
      animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }

    .icon-wrapper {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
    }

    .icon-wrapper.danger { background: #fff1f0; color: #ff4d4f; }
    .icon-wrapper.warning { background: #fffbe6; color: #faad14; }
    .icon-wrapper.info { background: #e6f7ff; color: #1890ff; }

    .btn-confirm.danger { background: #ff4d4f; color: white; border: none; }
    .btn-confirm.danger:hover { background: #ff7875; }

    .btn-confirm.warning { background: #faad14; color: white; border: none; }
    .btn-confirm.warning:hover { background: #ffc53d; }

    .btn-confirm.info { background: #000; color: white; border: none; }
    .btn-confirm.info:hover { background: #222; }
  `]
})
export class ConfirmModalComponent {
    title = input<string>('Confirmar acción');
    message = input<string>('¿Estás seguro de que deseas realizar esta acción?');
    confirmText = input<string>('Confirmar');
    cancelText = input<string>('Cancelar');
    type = input<'danger' | 'warning' | 'info'>('info');

    confirm = output<void>();
    cancel = output<void>();

    getBtnClass() {
        return this.type();
    }
}

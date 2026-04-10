import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Rol } from '../../../../shared/services/roles.service';

@Component({
  selector: 'app-role-delete-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onCancel.emit()">
      <div class="modal-content-minimal border-danger-soft" (click)="$event.stopPropagation()">
        <div class="modal-body-minimal p-5 text-center">
          <div class="delete-icon-animated mb-4">
            <i class="bi bi-exclamation-triangle-fill"></i>
          </div>
          <h4 class="fw-bold text-dark mb-2">¿Eliminar este rol?</h4>
          <p class="text-muted small mb-0">
            Estás a punto de eliminar el rol <strong>"{{ role?.nombre }}"</strong>.
          </p>
          <p class="text-danger extra-small fw-bold mt-2 tracking-tight">
            ESTA ACCIÓN ES IRREVERSIBLE Y AFECTARÁ A LOS USUARIOS ASIGNADOS.
          </p>

          <div class="d-flex flex-column gap-2 mt-4">
            <button class="btn btn-delete-confirm py-3" (click)="onConfirm.emit()" [disabled]="saving">
              <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
              ELIMINAR DEFINITIVAMENTE
            </button>
            <button class="btn btn-minimal-link py-2" (click)="onCancel.emit()" [disabled]="saving">
              Mantenlo por ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 99999;
    }
    .modal-content-minimal {
      background: white; border-radius: 24px; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.25);
      width: 400px;
    }
    .border-danger-soft { border: 1px solid #fee2e2; }
    .delete-icon-animated {
      width: 80px; height: 80px; background: #fff1f2; color: #e11d48;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; margin: 0 auto;
      animation: pulse-danger 2s infinite;
    }
    @keyframes pulse-danger {
      0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); }
      70% { box-shadow: 0 0 0 15px rgba(225, 29, 72, 0); }
      100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
    }
    .btn-delete-confirm {
      background: #e11d48; color: white; border: none; border-radius: 14px;
      font-weight: 800; font-size: 0.8rem; letter-spacing: 0.5px;
      transition: all 0.2s;
    }
    .btn-delete-confirm:hover { background: #be123c; transform: translateY(-1px); }
    .btn-minimal-link { background: transparent; border: none; color: #64748b; font-weight: 700; font-size: 0.8rem; }
  `]
})
export class RoleDeleteModalComponent {
  @Input() role: Rol | null = null;
  @Input() saving: boolean = false;
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
}

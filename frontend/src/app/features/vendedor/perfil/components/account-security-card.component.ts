import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-account-security-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="editorial-card p-0" style="overflow: hidden;">
      <div class="card-header-minimal px-4 d-flex justify-content-between align-items-center">
         <div><i class="bi bi-shield-lock me-2"></i> Seguridad de la Cuenta</div>
         <button *ngIf="!isChangingPassword" class="btn btn-sm btn-link text-primary fw-bold text-decoration-none" (click)="toggleChangePassword()">
            Cambiar Contraseña
         </button>
      </div>
      <div class="card-body-minimal p-4">
          <div *ngIf="!isChangingPassword" class="text-muted small">
              Tu contraseña protege tu cuenta. Recomendamos cambiarla periódicamente para mantener la seguridad de tus datos.
          </div>

          <div *ngIf="isChangingPassword">
              <div class="info-row mb-3">
                  <label class="editorial-label">Nueva Contraseña</label>
                  <div class="input-group">
                      <input [type]="showPassword ? 'text' : 'password'" 
                             class="editorial-input" 
                             [(ngModel)]="nuevaPassword" 
                             placeholder="Mínimo 6 caracteres"
                             style="border-top-right-radius: 0; border-bottom-right-radius: 0; flex: 1;">
                      <button class="btn btn-outline-secondary" type="button" 
                              (click)="showPassword = !showPassword"
                              style="border: 1px solid var(--border-color); border-left: 0; border-radius: 0 12px 12px 0; background: #f8fafc;">
                          <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                      </button>
                  </div>
              </div>
              <div class="d-flex gap-2">
                  <button class="btn-editorial btn-sm px-3" 
                          [disabled]="nuevaPassword.length < 6 || isSaving"
                          (click)="savePassword()"
                          style="font-size: 0.75rem; border-radius: 8px; padding: 0.4rem 1.2rem;">Confirmar Cambio</button>
                  <button class="btn btn-light rounded-3 btn-sm px-3" (click)="toggleChangePassword()">Cancelar</button>
              </div>
          </div>
      </div>
    </div>
  `,
  styles: [`
    .editorial-card { max-width: none !important; margin: 0 !important; padding: 0 !important; }
    .card-header-minimal {
      padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color);
      font-weight: 800; font-size: 0.9rem; color: #000000; background: #f8fafc;
    }
    .editorial-label { font-size: 0.65rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; display: block; }
  `]
})
export class AccountSecurityCardComponent {
  @Input() isSaving: boolean = false;
  @Output() onChangePassword = new EventEmitter<string>();

  isChangingPassword = false;
  showPassword = false;
  nuevaPassword = '';

  toggleChangePassword() {
    this.isChangingPassword = !this.isChangingPassword;
    this.nuevaPassword = '';
    this.showPassword = false;
  }

  // Permite al padre cerrar el formulario después de un guardado exitoso
  reset() {
    this.isChangingPassword = false;
    this.nuevaPassword = '';
    this.showPassword = false;
  }

  savePassword() {
    this.onChangePassword.emit(this.nuevaPassword);
  }
}

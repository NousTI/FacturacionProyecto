import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-security-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="editorial-card p-0 shadow-sm" style="overflow: hidden;">
      <div class="card-header-minimal-editorial px-4 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-shield-lock text-dark"></i>
          <span>Seguridad de la Cuenta</span>
        </div>
        <button *ngIf="!isChanging" class="btn-text-action-editorial" (click)="toggleChange()">
           Cambiar Clave
        </button>
      </div>
      
      <div class="card-body-minimal-editorial p-4">
        <div *ngIf="!isChanging" class="security-intro-text">
           Tu contraseña actual protege el acceso a tus herramientas de administración. Recomendamos actualizarla periódicamente para mantener la integridad de tu cuenta.
        </div>

        <div *ngIf="isChanging" class="animate-fade-in">
          <div class="info-block-editorial mb-3">
            <label>Nueva Contraseña</label>
            <div class="editorial-input-group">
              <input [type]="showPassword ? 'text' : 'password'" 
                     class="editorial-input-premium" 
                     [(ngModel)]="nuevaPassword" 
                     placeholder="Mínimo 6 caracteres"
                     minlength="6">
              <button class="btn-eye-toggle-editorial" type="button" (click)="showPassword = !showPassword">
                <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
              </button>
            </div>
            <div class="hint-text-editorial mt-3">
               Asegúrate de usar al menos una letra mayúscula y números para mayor seguridad.
            </div>
          </div>
          
          <div class="d-flex gap-2 mt-4 pt-3 border-top">
            <button type="button" class="btn-minimal-editorial primary px-4" 
                    [disabled]="nuevaPassword.length < 6 || isSaving"
                    (click)="save()">
              <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
              Confirmar Cambio
            </button>
            <button type="button" class="btn-minimal-editorial secondary" (click)="toggleChange()" [disabled]="isSaving">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editorial-card { background: white; border: 1px solid #f1f5f9; border-radius: 24px; }
    
    .card-header-minimal-editorial {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9;
      font-weight: 900; font-size: 0.85rem; color: black;
      background: #f8fafc; text-transform: uppercase; letter-spacing: 0.05em;
    }
    
    .btn-text-action-editorial {
      border: none; background: transparent; color: black; font-weight: 850;
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.02em; padding: 0.5rem;
      border-radius: 8px; transition: all 0.2s;
      &:hover { background: #eff6ff; }
    }
    
    .security-intro-text { font-size: 0.85rem; color: #64748b; font-weight: 500; line-height: 1.6; }
    
    .info-block-editorial label {
      display: block; font-size: 0.65rem; font-weight: 900;
      color: #94a3b8; text-transform: uppercase; margin-bottom: 0.35rem;
      letter-spacing: 0.05em;
    }
    
    .editorial-input-group { position: relative; }
    .editorial-input-premium {
      width: 100%; padding: 0.75rem 1rem; border-radius: 14px;
      border: 1.5px solid #e2e8f0; background: #f8fafc;
      font-size: 1rem; font-weight: 700; color: black; transition: all 0.2s;
      padding-right: 3rem;
      &:focus { outline: none; border-color: black; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    }
    
    .btn-eye-toggle-editorial {
      position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
      background: transparent; border: none; color: #94a3b8; font-size: 1.2rem;
    }
    
    .btn-minimal-editorial {
      padding: 0.75rem 1.75rem; border-radius: 14px; font-weight: 850; font-size: 0.85rem;
      border: none; transition: all 0.2s;
      &.primary { background: var(--primary-color); color: white; &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px -6px rgba(0,0,0,0.2); } }
      &.secondary { background: #f1f5f9; color: #64748b; &:hover { background: #e2e8f0; } }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .hint-text-editorial { font-size: 0.65rem; color: #94a3b8; font-weight: 700; }
    .animate-fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProfileSecurityCardComponent {
  @Input() isSaving: boolean = false;
  @Output() onChangePassword = new EventEmitter<string>();

  isChanging = false;
  showPassword = false;
  nuevaPassword = '';

  constructor(private cdr: ChangeDetectorRef) {}

  toggleChange() {
    this.isChanging = !this.isChanging;
    this.nuevaPassword = '';
    this.showPassword = false;
    this.cdr.markForCheck();
  }

  save() {
    if (this.nuevaPassword.length >= 6) {
      this.onChangePassword.emit(this.nuevaPassword);
    }
  }

  // Permite cerrar el editor tras éxito
  closeChange() {
    this.isChanging = false;
    this.nuevaPassword = '';
    this.showPassword = false;
    this.cdr.markForCheck();
  }
}




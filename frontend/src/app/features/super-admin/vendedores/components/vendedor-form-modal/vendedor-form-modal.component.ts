import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SriValidators } from '../../../../../shared/utils/sri-validators';

@Component({
  selector: 'app-vendedor-form-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-content-premium shadow-premium" (click)="$event.stopPropagation()">
        
        <div class="modal-header-premium">
          <div>
            <h2 class="modal-title-premium text-dark fw-bold mb-0">
                <i class="bi bi-person-plus me-2 text-primary"></i>
                {{ editing ? 'Editar Vendedor' : 'Registrar Vendedor' }}
            </h2>
            <p class="text-muted small mb-0">Completa la información para la gestión comercial.</p>
          </div>
          <button (click)="onClose.emit()" [disabled]="saving" class="btn-close-premium">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-premium scroll-custom">
          <form [formGroup]="vendedorForm" class="row g-4">
            
            <!-- Nombre Completo -->
            <div class="col-12">
              <label class="form-label-premium">Nombre Completo *</label>
              <div class="input-premium-group">
                <i class="bi bi-person input-icon"></i>
                <input type="text" formControlName="nombre" class="form-control-premium" 
                  [class.is-invalid]="vendedorForm.get('nombre')?.invalid && vendedorForm.get('nombre')?.touched && vendedorForm.get('nombre')?.value"
                  placeholder="Ej: Juan Pérez" [disabled]="saving">
              </div>
              <div class="error-feedback" *ngIf="vendedorForm.get('nombre')?.invalid && vendedorForm.get('nombre')?.touched && vendedorForm.get('nombre')?.value">
                El nombre es obligatorio (mín. 3 caracteres)
              </div>
            </div>

            <!-- Identificación (DNI/RUC) -->
            <div class="col-md-6">
              <label class="form-label-premium">Identificación (Cédula/RUC) *</label>
              <div class="input-premium-group">
                <i class="bi bi-card-text input-icon"></i>
                <input type="text" formControlName="dni" class="form-control-premium" 
                  [class.is-invalid]="vendedorForm.get('dni')?.invalid && vendedorForm.get('dni')?.touched && vendedorForm.get('dni')?.value"
                  placeholder="0000000000" [disabled]="saving" maxlength="13"
                  (keypress)="onlyNumbers($event)">
              </div>
              <div class="error-feedback" *ngIf="vendedorForm.get('dni')?.invalid && vendedorForm.get('dni')?.touched && vendedorForm.get('dni')?.value">
                {{ vendedorForm.get('dni')?.errors?.['message'] || 'Identificación inválida' }}
              </div>
            </div>

            <!-- Email Corporativo -->
            <div class="col-md-6">
              <label class="form-label-premium">Email Corporativo *</label>
              <div class="input-premium-group">
                <i class="bi bi-envelope input-icon"></i>
                <input type="email" formControlName="email" class="form-control-premium" 
                  [class.is-invalid]="vendedorForm.get('email')?.invalid && vendedorForm.get('email')?.touched && vendedorForm.get('email')?.value"
                  placeholder="juan@nousti.com" [disabled]="saving">
              </div>
              <div class="error-feedback" *ngIf="vendedorForm.get('email')?.invalid && vendedorForm.get('email')?.touched && vendedorForm.get('email')?.value">
                Email inválido
              </div>
            </div>

            <!-- Teléfono -->
            <div class="col-md-6">
              <label class="form-label-premium">Teléfono *</label>
              <div class="input-premium-group">
                <i class="bi bi-phone input-icon"></i>
                <input type="text" formControlName="telefono" class="form-control-premium" 
                  [class.is-invalid]="vendedorForm.get('telefono')?.invalid && vendedorForm.get('telefono')?.touched && vendedorForm.get('telefono')?.value"
                  placeholder="0999999999" [disabled]="saving" maxlength="10"
                  (keypress)="onlyNumbers($event)">
              </div>
              <div class="error-feedback" *ngIf="vendedorForm.get('telefono')?.invalid && vendedorForm.get('telefono')?.touched && vendedorForm.get('telefono')?.value">
                Debe tener 10 dígitos
              </div>
            </div>

            <!-- Password (only if not editing) -->
            <div class="col-md-6" *ngIf="!editing">
              <label class="form-label-premium">Contraseña Inicial *</label>
              <div class="input-premium-group">
                <i class="bi bi-key input-icon"></i>
                <input type="password" formControlName="password" class="form-control-premium" 
                  [class.is-invalid]="vendedorForm.get('password')?.invalid && vendedorForm.get('password')?.touched && vendedorForm.get('password')?.value"
                  placeholder="••••••••" [disabled]="saving" minlength="6">
              </div>
              <div class="error-feedback" *ngIf="vendedorForm.get('password')?.invalid && vendedorForm.get('password')?.touched && vendedorForm.get('password')?.value">
                Mínimo 6 caracteres
              </div>
            </div>

          </form>
        </div>

        <div class="modal-footer-premium">
          <button (click)="onClose.emit()" [disabled]="saving" class="btn-secondary-premium">Cancelar</button>
          <button (click)="submit()" [disabled]="vendedorForm.invalid || saving" class="btn-primary-premium d-flex align-items-center gap-2">
            <span *ngIf="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ saving ? (editing ? 'Guardando...' : 'Registrando...') : (editing ? 'Guardar Cambios' : 'Registrar Ahora') }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; z-index: 10001;
    }
    .modal-content-premium {
      background: #ffffff; width: 100%; max-width: 600px;
      border-radius: 32px; overflow: hidden; display: flex; flex-direction: column;
    }
    .modal-header-premium {
      padding: 2rem; display: flex; justify-content: space-between; align-items: center;
      background: #fff; border-bottom: 1px solid #f8fafc;
    }
    .modal-title-premium { font-size: 1.25rem; letter-spacing: -0.5px; }
    .btn-close-premium {
      background: #f8fafc; border: none; width: 40px; height: 40px;
      border-radius: 12px; color: #94a3b8; font-size: 1.5rem; transition: all 0.2s;
    }
    .btn-close-premium:hover { background: #161d35; color: white; }

    .modal-body-premium { padding: 2rem; }
    
    .form-label-premium {
      font-size: 0.75rem; font-weight: 800; color: #64748b;
      margin-bottom: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .input-premium-group { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 1rem; color: #94a3b8; font-size: 1rem; }
    .form-control-premium {
      padding: 0.85rem 1rem 0.85rem 3.25rem; border-radius: 14px;
      background: #f8fafc; border: 1px solid #e2e8f0;
      font-size: 0.95rem; font-weight: 500; width: 100%; transition: all 0.2s;
    }
    .form-control-premium:focus {
      background: #ffffff; border-color: #161d35; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05); outline: none;
    }

    .modal-footer-premium {
      padding: 1.5rem 2rem; background: #f8fafc; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end; gap: 1rem;
    }
    .btn-primary-premium {
      background: #161d35; color: white; border: none; padding: 0.85rem 2rem;
      border-radius: 14px; font-weight: 700; transition: all 0.2s;
    }
    .btn-primary-premium:disabled { opacity: 0.5; }
    .btn-secondary-premium {
      background: white; border: 1px solid #e2e8f0; padding: 0.85rem 1.5rem;
      border-radius: 14px; font-weight: 600; color: #64748b;
    }
    .shadow-premium { box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25); }
    .form-control-premium.is-invalid {
      border-color: #ef4444;
      background: #fffcfc;
    }
    .error-feedback {
      color: #ef4444;
      font-size: 0.7rem;
      font-weight: 700;
      margin-top: 0.4rem;
      padding-left: 0.5rem;
      text-transform: uppercase;
    }
    .modal-body-premium.scroll-custom {
      max-height: 500px;
      overflow-y: auto;
    }
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class VendedorFormModalComponent {
  @Input() editing: boolean = false;
  @Input() saving: boolean = false;
  @Input() set vendedorData(data: any) {
    if (data) {
      this.vendedorForm.patchValue(data);
    }
  }

  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  vendedorForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.vendedorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      dni: ['', [Validators.required, SriValidators.identificacionEcuador()]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['']
    });
  }

  ngOnInit() {
    if (this.editing) {
      this.vendedorForm.get('password')?.clearValidators();
    } else {
      this.vendedorForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.vendedorForm.get('password')?.updateValueAndValidity();
  }

  onlyNumbers(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  submit() {
    if (this.vendedorForm.valid) {
      this.onSave.emit(this.vendedorForm.value);
    } else {
      this.vendedorForm.markAllAsTouched();
    }
  }
}

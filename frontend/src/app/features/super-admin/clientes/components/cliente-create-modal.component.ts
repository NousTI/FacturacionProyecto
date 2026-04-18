import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cliente-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div>
            <span class="editorial-label mb-1 d-block" style="color: var(--primary-color);">Nuevo Registro</span>
            <h2 class="modal-title">Crear Cliente</h2>
          </div>
          <button class="close-pill" (click)="onClose.emit()">
            <i class="bi bi-x"></i>
          </button>
        </div>
        
        <!-- Body -->
        <div class="modal-body">
          <form [formGroup]="clienteForm" (ngSubmit)="onSubmit()">
            <div class="row g-4">
              <!-- Nombres -->
              <div class="col-md-6">
                <label class="editorial-label">Nombres *</label>
                <input 
                  type="text" 
                  class="editorial-input"
                  formControlName="nombres" 
                  placeholder="Ej: Juan Antonio"
                  [class.is-invalid]="clienteForm.get('nombres')?.invalid && clienteForm.get('nombres')?.touched"
                >
                <div class="invalid-feedback" *ngIf="clienteForm.get('nombres')?.invalid && clienteForm.get('nombres')?.touched">
                  Los nombres son obligatorios (mín. 3 letras)
                </div>
              </div>
              
              <!-- Apellidos -->
              <div class="col-md-6">
                <label class="editorial-label">Apellidos *</label>
                <input 
                  type="text" 
                  class="editorial-input"
                  formControlName="apellidos" 
                  placeholder="Ej: Pérez García"
                  [class.is-invalid]="clienteForm.get('apellidos')?.invalid && clienteForm.get('apellidos')?.touched"
                >
                <div class="invalid-feedback" *ngIf="clienteForm.get('apellidos')?.invalid && clienteForm.get('apellidos')?.touched">
                  Los apellidos son obligatorios (mín. 3 letras)
                </div>
              </div>
              
              <!-- Teléfono -->
              <div class="col-12">
                <label class="editorial-label">Teléfono de contacto *</label>
                <input 
                  type="text"
                  class="editorial-input"
                  formControlName="telefono" 
                  placeholder="Ej: 0987654321"
                  maxlength="10"
                  (keypress)="onlyNumbers($event)"
                  [class.is-invalid]="clienteForm.get('telefono')?.invalid && clienteForm.get('telefono')?.touched"
                >
                <div class="invalid-feedback" *ngIf="clienteForm.get('telefono')?.errors?.['required'] && clienteForm.get('telefono')?.touched">
                  El teléfono es obligatorio
                </div>
                <div class="invalid-feedback" *ngIf="clienteForm.get('telefono')?.errors?.['pattern'] && clienteForm.get('telefono')?.touched">
                  Debe empezar con 09 y tener 10 dígitos
                </div>
              </div>

              <!-- Email -->
              <div class="col-12">
                <label class="editorial-label">Correo Electrónico *</label>
                <input 
                  type="email"
                  class="editorial-input"
                  formControlName="email" 
                  placeholder="Generación automática por el sistema"
                  readonly
                  [class.is-invalid]="clienteForm.get('email')?.invalid && clienteForm.get('email')?.touched"
                >
                <div class="invalid-feedback" *ngIf="clienteForm.get('email')?.invalid && clienteForm.get('email')?.touched">
                  Ingrese un correo electrónico válido
                </div>
                <div class="info-editorial-card mt-2" style="background: var(--status-warning-bg); border-color: var(--status-warning);">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-info-circle-fill" style="color: var(--status-warning-text);"></i>
                    <span style="font-size: 0.75rem; font-weight: 600; color: var(--status-warning-text);">El correo se creará automáticamente basándose en la razón social.</span>
                  </div>
                </div>
              </div>
              
              <!-- Empresa -->
              <div class="col-12">
                <label class="editorial-label">Empresa Asignada *</label>
                <select 
                  class="editorial-input"
                  formControlName="empresa_id"
                  [class.is-invalid]="clienteForm.get('empresa_id')?.invalid && clienteForm.get('empresa_id')?.touched"
                >
                  <option [value]="null" disabled selected>Seleccione una empresa...</option>
                  <option *ngFor="let e of empresas" [value]="e.id">
                    {{ e.nombre_comercial }}
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="clienteForm.get('empresa_id')?.invalid && clienteForm.get('empresa_id')?.touched">
                  Debe seleccionar una empresa
                </div>
              </div>

              <!-- Info Card Premium -->
              <div class="col-12">
                <div class="info-editorial-card">
                  <div class="d-flex align-items-center gap-3">
                    <div class="icon-indicator">
                      <i class="bi bi-shield-check"></i>
                    </div>
                    <div>
                      <span class="editorial-label mb-0" style="color: #0f172a;">Configuración Inicial</span>
                      <p class="m-0 text-muted" style="font-size: 0.8rem;">
                        Rol: <strong>Administrador de Empresa</strong>. Contraseña: <code class="bg-white px-2 py-1 rounded">password</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <!-- Footer -->
        <div class="modal-footer">
          <button (click)="onClose.emit()" [disabled]="loading" class="btn-cancel-final">Descartar</button>
          <button (click)="onSubmit()" 
                  [disabled]="clienteForm.invalid || loading" 
                  class="btn-submit-final d-flex align-items-center gap-2">
            <span *ngIf="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ loading ? 'Procesando...' : 'Confirmar Registro' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1.5rem;
    }

    .modal-card {
      background: white;
      border-radius: 32px;
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 40px 120px -20px rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
    }

    .modal-header {
      padding: 2.5rem 3rem 1.5rem 3rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
      letter-spacing: -0.03em;
    }

    .close-pill {
      background: #f1f5f9;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
      cursor: pointer;
    }
    .close-pill:hover {
      background: var(--primary-color);
      color: white;
      transform: rotate(90deg);
    }

    .modal-body {
      padding: 0.5rem 3rem 2rem 3rem;
      overflow-y: auto;
      flex: 1;
    }

    .info-editorial-card {
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 20px;
      border: 1.5px solid #f1f5f9;
      margin-top: 0.5rem;
    }

    .icon-indicator {
      width: 44px;
      height: 44px;
      background: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: var(--primary-color);
      box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    }

    .modal-footer {
      padding: 1.5rem 3rem 2.5rem 3rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      background: linear-gradient(to top, #ffffff 80%, rgba(255,255,255,0));
    }
    .btn-submit-final {
      background: var(--primary-color); color: #ffffff; border: none; padding: 0.75rem 2.5rem;
      border-radius: 12px; font-weight: 700; transition: all 0.2s;
    }
    .btn-submit-final:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
    .btn-submit-final:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-cancel-final { background: #ffffff; color: #64748b; border: 1px solid #e2e8f0; padding: 0.75rem 2rem; border-radius: 12px; font-weight: 600; transition: all 0.2s; }
    .btn-cancel-final:hover { background: #f8fafc; color: var(--text-main); }

    .invalid-feedback {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--status-danger);
      margin-top: 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .is-invalid {
      border-color: var(--status-danger) !important;
      background-color: #fffafa !important;
    }
  `]
})
export class ClienteCreateModalComponent implements OnInit {
  @Input() empresas: any[] = [];
  @Input() allRoles: any[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  clienteForm: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder) {
    this.clienteForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      email: [null, [Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^09\d{8}$/)]],
      empresa_id: [null, Validators.required],
      avatar_url: [null],
      activo: [true]
    });
  }

  ngOnInit() {
  }

  onlyNumbers(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onSubmit() {
    if (this.clienteForm.valid) {
      this.onSave.emit(this.clienteForm.value);
    } else {
      this.clienteForm.markAllAsTouched();
    }
  }
}

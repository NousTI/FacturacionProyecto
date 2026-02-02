import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cliente-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- HEADER -->
        <div class="modal-header-premium">
          <div>
            <h3 class="modal-title">Nuevo Cliente</h3>
            <p class="modal-subtitle">Crea un nuevo usuario para una empresa</p>
          </div>
          <button class="btn-close-premium" (click)="onClose.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <!-- BODY -->
        <div class="modal-body-premium">
          <form [formGroup]="clienteForm" (ngSubmit)="onSubmit()">
            <div class="row g-3">
              <!-- Nombres -->
              <div class="col-md-6">
                <label class="form-label">Nombres *</label>
                <input 
                  type="text"
                  class="form-control-premium"
                  formControlName="nombres" 
                  placeholder="Ingrese nombres"
                >
                <div class="invalid-feedback" *ngIf="clienteForm.get('nombres')?.invalid && clienteForm.get('nombres')?.touched">
                  Campo requerido
                </div>
              </div>
              
              <!-- Apellidos -->
              <div class="col-md-6">
                <label class="form-label">Apellidos *</label>
                <input 
                  type="text"
                  class="form-control-premium"
                  formControlName="apellidos" 
                  placeholder="Ingrese apellidos"
                >
              </div>
              
              <!-- Email -->
              <div class="col-12">
                <label class="form-label">Correo Electrónico *</label>
                <input 
                  type="email"
                  class="form-control-premium"
                  formControlName="email" 
                  placeholder="correo@ejemplo.com"
                >
                <div class="invalid-feedback" *ngIf="clienteForm.get('email')?.invalid && clienteForm.get('email')?.touched">
                  Ingrese un email válido
                </div>
              </div>
              
              <!-- Teléfono -->
              <div class="col-12">
                <label class="form-label">Teléfono *</label>
                <input 
                  type="text"
                  class="form-control-premium"
                  formControlName="telefono"
                  placeholder="0999999999"
                >
              </div>
              
              <!-- Empresa -->
              <div class="col-12">
                <label class="form-label">Empresa *</label>
                <select 
                  class="form-select-premium"
                  formControlName="empresa_id"
                >
                  <option [value]="null">Seleccione una empresa...</option>
                  <option *ngFor="let e of empresas" [value]="e.id">
                    {{ e.nombre_comercial }}
                  </option>
                </select>
              </div>

              <!-- Info Card -->
              <div class="col-12 mt-3">
                <div class="info-card">
                  <div class="info-icon">
                    <i class="bi bi-shield-check"></i>
                  </div>
                  <div class="info-content">
                    <div class="info-title">Acceso Total Automático</div>
                    <div class="info-text">
                      El nuevo usuario recibirá rol de <strong>Administrador de Empresa</strong> con acceso completo.
                    </div>
                  </div>
                </div>
              </div>

              <!-- Password Info -->
              <div class="col-12">
                <div class="password-info">
                  <i class="bi bi-key-fill"></i>
                  <span>Contraseña por defecto: <strong>password</strong> (el usuario podrá cambiarla después)</span>
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <!-- FOOTER -->
        <div class="modal-footer-premium">
          <button class="btn-secondary-premium" (click)="onClose.emit()">
            Cancelar
          </button>
          <button 
            class="btn-primary-premium" 
            [disabled]="clienteForm.invalid || loading"
            (click)="onSubmit()"
          >
            <i class="bi" [class]="loading ? 'bi-hourglass-split' : 'bi-plus-lg'"></i>
            {{ loading ? 'Creando...' : 'Crear Cliente' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    }

    .modal-container {
      background: white;
      border-radius: 24px;
      width: 100%;
      max-width: 650px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header-premium {
      padding: 2rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #161d35;
      margin: 0;
    }

    .modal-subtitle {
      color: #94a3b8;
      font-size: 0.9rem;
      margin: 0.25rem 0 0 0;
    }

    .btn-close-premium {
      background: #f8fafc;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-close-premium:hover {
      background: #161d35;
      color: white;
    }

    .modal-body-premium {
      padding: 2rem;
      overflow-y: auto;
      flex: 1;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
      display: block;
    }

    .form-control-premium,
    .form-select-premium {
      background: #f8fafc;
      border: 1.5px solid rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: #161d35;
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium:focus,
    .form-select-premium:focus {
      background: #ffffff;
      border-color: #161d35;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
      outline: none;
    }

    .invalid-feedback {
      display: block;
      color: #dc2626;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .info-card {
      background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
      border: 1.5px solid #bae6fd;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .info-icon {
      width: 48px;
      height: 48px;
      background: #161d35;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .info-content {
      flex: 1;
    }

    .info-title {
      font-size: 0.85rem;
      font-weight: 800;
      color: #161d35;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .info-text {
      font-size: 0.9rem;
      color: #475569;
      line-height: 1.5;
    }

    .password-info {
      background: #fef3c7;
      border: 1.5px solid #fde047;
      border-radius: 12px;
      padding: 0.875rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: #854d0e;
    }

    .password-info i {
      font-size: 1.1rem;
    }

    .modal-footer-premium {
      padding: 1.5rem 2rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn-secondary-premium {
      background: #f8fafc;
      color: #475569;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-secondary-premium:hover {
      background: #e2e8f0;
    }

    .btn-primary-premium {
      background: #161d35;
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3);
      cursor: pointer;
    }
    .btn-primary-premium:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 30px -8px rgba(22, 29, 53, 0.4);
      background: #232d4d;
    }
    .btn-primary-premium:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ClienteModalComponent implements OnInit {
  @Input() empresas: any[] = [];
  @Input() allRoles: any[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  clienteForm: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder) {
    this.clienteForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      empresa_id: [null, Validators.required],
      avatar_url: [null],
      activo: [true]
    });
  }

  ngOnInit() {
  }

  onSubmit() {
    if (this.clienteForm.valid) {
      this.onSave.emit(this.clienteForm.value);
    }
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SriValidators } from '../../../../../shared/utils/sri-validators';

@Component({
  selector: 'app-vendedor-form-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-content-premium shadow-premium" (click)="$event.stopPropagation()">
        
        <div class="modal-header-premium flex-column align-items-stretch">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 class="modal-title-premium text-dark fw-bold mb-0">
                  <i class="bi bi-person-plus me-2 text-primary"></i>
                  {{ editing ? 'Editar Vendedor' : 'Registrar Vendedor' }}
              </h2>
              <p class="text-muted small mb-0">Gestiona el perfil, comisiones y permisos de acceso del asesor.</p>
            </div>
            <button (click)="onClose.emit()" [disabled]="saving" class="btn-close-premium">
              <i class="bi bi-x"></i>
            </button>
          </div>
          
          <!-- TABS NAVIGATION -->
          <div class="tabs-premium-nav">
            <button class="btn-tab-premium" [class.active]="activeTab === 'general'" (click)="activeTab = 'general'">
              <i class="bi bi-person me-2"></i>General
            </button>
            <button class="btn-tab-premium" [class.active]="activeTab === 'comisiones'" (click)="activeTab = 'comisiones'">
              <i class="bi bi-currency-dollar me-2"></i>Comisiones
            </button>
            <button class="btn-tab-premium" [class.active]="activeTab === 'permisos'" (click)="activeTab = 'permisos'">
              <i class="bi bi-shield-check me-2"></i>Permisos
            </button>
          </div>
        </div>

        <div class="modal-body-premium scroll-custom">
          <form [formGroup]="vendedorForm">
            
            <!-- SECCIÓN: GENERAL -->
            <div *ngIf="activeTab === 'general'" class="row g-4 animate__animated animate__fadeIn animate__faster">
              <!-- Nombres -->
              <div class="col-md-6">
                <label class="form-label-premium">Nombres *</label>
                <div class="input-premium-group">
                  <i class="bi bi-person input-icon"></i>
                  <input type="text" formControlName="nombres" class="form-control-premium" 
                    [class.is-invalid]="vendedorForm.get('nombres')?.invalid && vendedorForm.get('nombres')?.touched"
                    placeholder="Ej: Juan" [disabled]="saving">
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('nombres')?.invalid && vendedorForm.get('nombres')?.touched">
                  El nombre es obligatorio (mín. 3 caracteres)
                </div>
              </div>

              <!-- Apellidos -->
              <div class="col-md-6">
                <label class="form-label-premium">Apellidos *</label>
                <div class="input-premium-group">
                  <i class="bi bi-person-badge input-icon"></i>
                  <input type="text" formControlName="apellidos" class="form-control-premium" 
                    [class.is-invalid]="vendedorForm.get('apellidos')?.invalid && vendedorForm.get('apellidos')?.touched"
                    placeholder="Ej: Pérez" [disabled]="saving">
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('apellidos')?.invalid && vendedorForm.get('apellidos')?.touched">
                  El apellido es obligatorio (mín. 3 caracteres)
                </div>
              </div>

              <!-- Identificación -->
              <div class="col-md-6">
                <label class="form-label-premium">Identificación *</label>
                <div class="input-premium-group">
                  <i class="bi bi-card-text input-icon"></i>
                  <input type="text" formControlName="documento_identidad" class="form-control-premium" 
                    [class.is-invalid]="vendedorForm.get('documento_identidad')?.invalid && vendedorForm.get('documento_identidad')?.touched"
                    placeholder="0000000000" [disabled]="saving" maxlength="13"
                    (keypress)="onlyNumbers($event)">
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('documento_identidad')?.invalid && vendedorForm.get('documento_identidad')?.touched">
                  Identificación inválida o incompleta
                </div>
              </div>

              <!-- Email -->
              <div class="col-md-6">
                <label class="form-label-premium">Email Corporativo *</label>
                <div class="input-premium-group">
                  <i class="bi bi-envelope input-icon"></i>
                  <input type="email" formControlName="email" class="form-control-premium" 
                    [class.is-invalid]="vendedorForm.get('email')?.invalid && vendedorForm.get('email')?.touched"
                    placeholder="juan@nousti.com" [disabled]="saving">
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('email')?.invalid && vendedorForm.get('email')?.touched">
                  Correo electrónico inválido
                </div>
              </div>

              <!-- Teléfono -->
              <div class="col-md-6">
                <label class="form-label-premium">Teléfono *</label>
                <div class="input-premium-group">
                  <i class="bi bi-phone input-icon"></i>
                  <input type="text" formControlName="telefono" class="form-control-premium" 
                    [class.is-invalid]="vendedorForm.get('telefono')?.invalid && vendedorForm.get('telefono')?.touched"
                    placeholder="0999999999" [disabled]="saving" maxlength="10"
                    (keypress)="onlyNumbers($event)">
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('telefono')?.invalid && vendedorForm.get('telefono')?.touched">
                  Teléfono debe tener 10 dígitos
                </div>
              </div>
            </div>

            <!-- SECCIÓN: COMISIONES -->
            <div *ngIf="activeTab === 'comisiones'" class="row g-4 animate__animated animate__fadeIn animate__faster">
              <div class="col-12">
                <div class="alert-premium-info">
                  <i class="bi bi-info-circle-fill me-2"></i>
                  Define la regla de negocio para los incentivos del asesor.
                </div>
              </div>

              <div class="col-md-12">
                <label class="form-label-premium">Tipo de Comisión</label>
                <div class="input-premium-group">
                  <i class="bi bi-gear input-icon"></i>
                  <select formControlName="tipo_comision" class="form-select-premium" [disabled]="saving">
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="FIJA">Monto Fijo ($)</option>
                  </select>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label-premium">Comisión Inicial (Primer Pago)</label>
                <div class="input-premium-group">
                  <i class="bi bi-star input-icon"></i>
                  <input type="number" formControlName="porcentaje_comision_inicial" class="form-control-premium" 
                    placeholder="0" [disabled]="saving">
                  <span class="input-suffix-premium">{{ vendedorForm.get('tipo_comision')?.value === 'PORCENTAJE' ? '%' : '$' }}</span>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label-premium">Comisión Recurrente (Renovaciones)</label>
                <div class="input-premium-group">
                  <i class="bi bi-arrow-repeat input-icon"></i>
                  <input type="number" formControlName="porcentaje_comision_recurrente" class="form-control-premium" 
                    [class.is-invalid]="vendedorForm.get('porcentaje_comision_recurrente')?.invalid && vendedorForm.get('porcentaje_comision_recurrente')?.touched"
                    placeholder="0" [disabled]="saving">
                  <span class="input-suffix-premium">{{ vendedorForm.get('tipo_comision')?.value === 'PORCENTAJE' ? '%' : '$' }}</span>
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('porcentaje_comision_recurrente')?.invalid && vendedorForm.get('porcentaje_comision_recurrente')?.touched">
                  {{ vendedorForm.get('tipo_comision')?.value === 'PORCENTAJE' ? 'Máximo 100%' : 'Monto inválido' }}
                </div>
              </div>
            </div>

            <!-- SECCIÓN: PERMISOS -->
            <div *ngIf="activeTab === 'permisos'" class="row g-2 animate__animated animate__fadeIn animate__faster">
              <div class="col-12">
                <p class="text-secondary small mb-3">Control de acceso y capacidades operativas del asesor.</p>
                
                <div class="permission-stack">
                  <!-- Registrar Clientes -->
                  <div class="permission-horizontal-card" 
                       [class.active]="vendedorForm.get('puede_crear_empresas')?.value"
                       (click)="togglePermission('puede_crear_empresas')">
                    <div class="d-flex align-items-center gap-3">
                      <div class="perm-icon-wrapper">
                        <i class="bi bi-building-add"></i>
                      </div>
                      <div class="perm-info">
                        <span class="perm-title">Registrar Clientes</span>
                        <span class="perm-desc">Permite crear nuevas empresas en el sistema.</span>
                      </div>
                    </div>
                    <div class="plan-check">
                      <i class="bi" [ngClass]="vendedorForm.get('puede_crear_empresas')?.value ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                    </div>
                  </div>

                  <!-- Ver Expedientes -->
                  <div class="permission-horizontal-card" 
                       [class.active]="vendedorForm.get('puede_acceder_empresas')?.value"
                       (click)="togglePermission('puede_acceder_empresas')">
                    <div class="d-flex align-items-center gap-3">
                      <div class="perm-icon-wrapper">
                        <i class="bi bi-folder2-open"></i>
                      </div>
                      <div class="perm-info">
                        <span class="perm-title">Ver Expedientes</span>
                        <span class="perm-desc">Acceso a la información técnica de sus clientes.</span>
                      </div>
                    </div>
                    <div class="plan-check">
                      <i class="bi" [ngClass]="vendedorForm.get('puede_acceder_empresas')?.value ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                    </div>
                  </div>

                  <!-- Gestionar Suscripciones -->
                  <div class="permission-horizontal-card" 
                       [class.active]="vendedorForm.get('puede_gestionar_planes')?.value"
                       (click)="togglePermission('puede_gestionar_planes')">
                    <div class="d-flex align-items-center gap-3">
                      <div class="perm-icon-wrapper">
                        <i class="bi bi-arrow-left-right"></i>
                      </div>
                      <div class="perm-info">
                        <span class="perm-title">Gestionar Suscripciones</span>
                        <span class="perm-desc">Habilitar cambios de plan y renovaciones manuales.</span>
                      </div>
                    </div>
                    <div class="plan-check">
                      <i class="bi" [ngClass]="vendedorForm.get('puede_gestionar_planes')?.value ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                    </div>
                  </div>

                  <!-- Reportes -->
                  <div class="permission-horizontal-card" 
                       [class.active]="vendedorForm.get('puede_ver_reportes')?.value"
                       (click)="togglePermission('puede_ver_reportes')">
                    <div class="d-flex align-items-center gap-3">
                      <div class="perm-icon-wrapper">
                        <i class="bi bi-bar-chart-line"></i>
                      </div>
                      <div class="perm-info">
                        <span class="perm-title">Reportes de Desempeño</span>
                        <span class="perm-desc">Visualización de estadísticas y comisiones propias.</span>
                      </div>
                    </div>
                    <div class="plan-check">
                      <i class="bi" [ngClass]="vendedorForm.get('puede_ver_reportes')?.value ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                    </div>
                  </div>

                  <!-- Sin permisos warning -->
                  <div *ngIf="!hasAtLeastOnePermission" class="text-danger small mt-3 animate__animated animate__shakeX">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Debes asignar al menos un permiso para registrar al asesor.
                  </div>

                </div>
              </div>
            </div>

          </form>
        </div>

        <div class="modal-footer-premium">
          <button (click)="onClose.emit()" [disabled]="saving" class="btn-secondary-premium">Cancelar</button>
          <button (click)="submit()" 
                  [disabled]="vendedorForm.invalid || !hasAtLeastOnePermission || (editing && !isDirty()) || saving" 
                  class="btn-primary-premium d-flex align-items-center gap-2">
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
      padding: 1.5rem 2rem 0; display: flex; justify-content: space-between; align-items: center;
      background: #fff; border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    .modal-title-premium { font-size: 1.25rem; letter-spacing: -0.5px; }
    
    /* TABS STYLING */
    .tabs-premium-nav {
      display: flex; gap: 0.5rem; margin-top: 0.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    .btn-tab-premium {
      padding: 0.75rem 1.25rem; border: none; background: transparent;
      font-size: 0.85rem; font-weight: 700; color: #94a3b8;
      border-bottom: 2px solid transparent; transition: all 0.2s;
      display: flex; align-items: center;
    }
    .btn-tab-premium:hover { color: #161d35; }
    .btn-tab-premium.active { color: #161d35; border-bottom-color: #161d35; }

    .btn-close-premium {
      background: #f8fafc; border: none; width: 40px; height: 40px;
      border-radius: 12px; color: #94a3b8; font-size: 1.5rem; transition: all 0.2s;
    }
    .btn-close-premium:hover { background: #161d35; color: white; }

    .modal-body-premium { padding: 2rem; background: #ffffff; }
    
    .form-label-premium {
      font-size: 0.75rem; font-weight: 800; color: #64748b;
      margin-bottom: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .input-premium-group { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 1rem; color: #94a3b8; font-size: 1rem; }
    
    .form-control-premium, .form-select-premium {
      padding: 0.85rem 3rem 0.85rem 3.25rem; border-radius: 14px;
      background: #f8fafc; border: 1px solid rgba(0, 0, 0, 0.05);
      font-size: 0.95rem; font-weight: 500; width: 100%; transition: all 0.2s;
      color: #1e293b;
    }
    .form-control-premium:focus, .form-select-premium:focus {
      background: #ffffff; border-color: #161d35; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05); outline: none;
    }
    .input-suffix-premium {
      position: absolute; right: 1.25rem; font-weight: 800; color: #161d35;
      font-size: 0.95rem; pointer-events: none;
    }

    /* COMMISSIONS & PERMISSIONS SPECIFIC */
    .alert-premium-info {
      background: #f0f9ff; border: 1px solid #e0f2fe; color: #0369a1;
      padding: 1rem; border-radius: 16px; font-size: 0.85rem; font-weight: 500;
    }
    
    .permission-stack {
      display: flex; flex-direction: column; gap: 0.75rem;
    }
    .permission-horizontal-card {
      padding: 0.85rem 1.25rem; border-radius: 16px; background: #ffffff;
      border: 1px solid #e2e8f0; transition: all 0.2s;
      display: flex; align-items: center; justify-content: space-between;
      cursor: pointer;
    }
    .permission-horizontal-card:hover { 
      border-color: #161d35; 
      background: #f8fafc; 
    }
    .permission-horizontal-card.active {
      border-color: #161d35;
      background: rgba(22, 29, 53, 0.02);
      box-shadow: 0 4px 15px rgba(22, 29, 53, 0.05);
    }
    
    .perm-icon-wrapper {
      width: 40px; height: 40px; border-radius: 12px;
      background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; font-size: 1.1rem; transition: all 0.2s;
    }
    .permission-horizontal-card.active .perm-icon-wrapper {
      background: #161d35; color: white;
    }
    
    .perm-info { display: flex; flex-direction: column; }
    .perm-title { font-weight: 800; color: #1e293b; font-size: 0.95rem; }
    .perm-desc { font-size: 0.75rem; color: #64748b; }

    .plan-check { font-size: 1.4rem; color: #cbd5e1; transition: all 0.2s; }
    .active .plan-check { color: #161d35; }

    .modal-footer-premium {
      padding: 1.5rem 2rem; background: #f8fafc; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end; gap: 1rem; width: 100%;
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
      max-height: 400px;
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
  private originalData: any = null;

  @Input() set vendedorData(data: any) {
    if (data) {
      this.originalData = { ...data };
      this.vendedorForm.patchValue(data);
    }
  }

  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  vendedorForm: FormGroup;
  activeTab: 'general' | 'comisiones' | 'permisos' = 'general';

  constructor(private fb: FormBuilder) {
    this.vendedorForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      documento_identidad: ['', [Validators.required, SriValidators.identificacionEcuador()]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      // Comisiones
      tipo_comision: ['PORCENTAJE', Validators.required],
      porcentaje_comision_inicial: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      porcentaje_comision_recurrente: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      // Permisos
      puede_crear_empresas: [false],
      puede_gestionar_planes: [false],
      puede_acceder_empresas: [false],
      puede_ver_reportes: [false]
    });
  }

  get hasAtLeastOnePermission(): boolean {
    const controls = this.vendedorForm.controls;
    return (
      controls['puede_crear_empresas'].value ||
      controls['puede_gestionar_planes'].value ||
      controls['puede_acceder_empresas'].value ||
      controls['puede_ver_reportes'].value
    );
  }

  togglePermission(controlName: string) {
    if (this.saving) return;
    const control = this.vendedorForm.get(controlName);
    if (control) {
      control.setValue(!control.value);
    }
  }

  ngOnInit() {
    // Escuchar cambios en tipo_comision para ajustar validadores
    this.vendedorForm.get('tipo_comision')?.valueChanges.subscribe(tipo => {
      this.updateCommissionValidators(tipo);
    });

    // Ejecutar inicialmente
    this.updateCommissionValidators(this.vendedorForm.get('tipo_comision')?.value);
  }

  private updateCommissionValidators(tipo: string) {
    const fields = ['porcentaje_comision_inicial', 'porcentaje_comision_recurrente'];

    fields.forEach(field => {
      const control = this.vendedorForm.get(field);
      if (control) {
        const validators = [Validators.required, Validators.min(0)];
        if (tipo === 'PORCENTAJE') {
          validators.push(Validators.max(100));
        }
        control.setValidators(validators);
        control.updateValueAndValidity();
      }
    });
  }

  onlyNumbers(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  isDirty(): boolean {
    if (!this.editing || !this.originalData) return true;
    const currentValues = this.vendedorForm.value;

    // Comparar cada campo relevante
    return Object.keys(currentValues).some(key => {
      const originalValue = this.originalData[key];
      const currentValue = currentValues[key];

      // Manejar valores nulos o indefinidos como iguales
      if ((originalValue === null || originalValue === undefined) &&
        (currentValue === null || currentValue === undefined)) return false;

      return originalValue !== currentValue;
    });
  }

  submit() {
    if (this.vendedorForm.valid && this.hasAtLeastOnePermission) {
      if (this.editing) {
        // Enviar solo los campos que cambiaron (PATCH style)
        const changedFields: any = {};
        const currentValues = this.vendedorForm.value;

        Object.keys(currentValues).forEach(key => {
          if (currentValues[key] !== this.originalData[key]) {
            changedFields[key] = currentValues[key];
          }
        });

        this.onSave.emit(changedFields);
      } else {
        this.onSave.emit(this.vendedorForm.value);
      }
    } else {
      this.vendedorForm.markAllAsTouched();
    }
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SriValidators } from '../../../../../shared/utils/sri-validators';
import { SRI_TIPOS_IDENTIFICACION } from '../../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-vendedor-form-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster">
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
                    placeholder="Ej: Juan">
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
                    placeholder="Ej: Pérez">
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('apellidos')?.invalid && vendedorForm.get('apellidos')?.touched">
                  El apellido es obligatorio (mín. 3 caracteres)
                </div>
              </div>

              <!-- Identificación -->
              <div class="col-md-6">
                <label class="form-label-premium text-nowrap">Tipo de Identificación *</label>
                <div class="input-premium-group">
                  <select formControlName="tipoIdentificacion" class="form-select-premium" (change)="onTipoIdChange()">
                    <option *ngFor="let tipo of sriTipos" [value]="tipo.code">{{ tipo.label }}</option>
                  </select>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label-premium">Número de Identificación *</label>
                <div class="input-premium-group">
                  <i class="bi bi-card-text input-icon"></i>
                  <input type="text" formControlName="identificacion" class="form-control-premium"
                    [class.is-invalid]="vendedorForm.get('identificacion')?.invalid && vendedorForm.get('identificacion')?.touched"
                    [placeholder]="getIdPlaceholder()"
                    [maxlength]="getIdMaxLength()"
                    (keypress)="vendedorForm.get('tipoIdentificacion')?.value === '06' ? null : onlyNumbers($event)">
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('identificacion')?.invalid && vendedorForm.get('identificacion')?.touched">
                  {{ vendedorForm.get('identificacion')?.errors?.['message'] || 'Identificación inválida o incompleta' }}
                </div>
                <small class="text-muted d-block mt-1" style="font-size: 0.65rem;">
                  {{ getIdHint() }}
                </small>
              </div>

              <!-- Email -->
              <div class="col-md-6" *ngIf="editing">
                <label class="form-label-premium">Email Corporativo</label>
                <div class="input-premium-group" style="opacity: 0.8">
                  <i class="bi bi-envelope input-icon"></i>
                  <input type="email" formControlName="email" class="form-control-premium" 
                    placeholder="juan@nousti.com" [readonly]="true">
                </div>
              </div>

              <!-- Teléfono -->
              <div class="col-md-6">
                <label class="form-label-premium">Teléfono *</label>
                <div class="input-premium-group">
                  <i class="bi bi-phone input-icon"></i>
                  <input type="text" formControlName="telefono" class="form-control-premium" 
                    [class.is-invalid]="vendedorForm.get('telefono')?.invalid && vendedorForm.get('telefono')?.touched"
                    placeholder="0999999999" maxlength="10"
                    (keypress)="onlyNumbers($event)">
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('telefono')?.invalid && vendedorForm.get('telefono')?.touched">
                  Teléfono debe empezar con 09 y tener 10 dígitos
                </div>
              </div>
            </div>

            <!-- SECCIÓN: COMISIONES -->
            <div *ngIf="activeTab === 'comisiones'" class="row g-4 animate__animated animate__fadeIn animate__faster">
              <div class="col-md-12">
                <label class="form-label-premium">Tipo de Comisión</label>
                <div class="input-premium-group">
                  <select formControlName="tipoComision" class="form-select-premium">
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="FIJA">Monto Fijo ($)</option>
                  </select>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label-premium text-nowrap">Comisión Inicial (Primer Pago) *</label>
                <div class="input-premium-group">
                  <i class="bi bi-star input-icon"></i>
                  <input type="number" formControlName="porcentajeComisionInicial" class="form-control-premium"
                    (keypress)="onlyNumbers($event)"
                    (input)="onCommissionInput($event, 'porcentajeComisionInicial')"
                    [class.is-invalid]="vendedorForm.get('porcentajeComisionInicial')?.invalid && vendedorForm.get('porcentajeComisionInicial')?.touched"
                    placeholder="0">
                  <span class="input-suffix-premium">{{ vendedorForm.get('tipoComision')?.value === 'PORCENTAJE' ? '%' : '$' }}</span>
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('porcentajeComisionInicial')?.invalid && vendedorForm.get('porcentajeComisionInicial')?.touched">
                  {{ vendedorForm.get('tipoComision')?.value === 'PORCENTAJE' ? 'Rango 1 - 100%' : 'Rango 1 - 1000$' }}
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label-premium text-nowrap">Comisión Recurrente (Renovaciones) *</label>
                <div class="input-premium-group">
                  <i class="bi bi-arrow-repeat input-icon"></i>
                  <input type="number" formControlName="porcentajeComisionRecurrente" class="form-control-premium"
                    (keypress)="onlyNumbers($event)"
                    (input)="onCommissionInput($event, 'porcentajeComisionRecurrente')"
                    [class.is-invalid]="vendedorForm.get('porcentajeComisionRecurrente')?.invalid && vendedorForm.get('porcentajeComisionRecurrente')?.touched"
                    placeholder="0">
                  <span class="input-suffix-premium">{{ vendedorForm.get('tipoComision')?.value === 'PORCENTAJE' ? '%' : '$' }}</span>
                </div>
                <div class="error-feedback" *ngIf="vendedorForm.get('porcentajeComisionRecurrente')?.invalid && vendedorForm.get('porcentajeComisionRecurrente')?.touched">
                    {{ vendedorForm.get('tipoComision')?.value === 'PORCENTAJE' ? 'Rango 1 - 100%' : 'Rango 1 - 1000$' }}
                </div>
              </div>
            </div>

            <!-- SECCIÓN: PERMISOS -->
            <div *ngIf="activeTab === 'permisos'" class="row g-2 animate__animated animate__fadeIn animate__faster">
              <div class="col-12">
                <p class="text-secondary small mb-3">Control de acceso y capacidades operativas del asesor.</p>
                
                <div class="permission-stack">
                  <!-- Registrar Empresas -->
                  <div class="permission-horizontal-card"
                       [class.active]="vendedorForm.get('puedeCrearEmpresas')?.value"
                       (click)="togglePermission('puedeCrearEmpresas')">
                    <div class="d-flex align-items-center gap-3">
                      <div class="perm-icon-wrapper">
                        <i class="bi bi-building-add"></i>
                      </div>
                      <div class="perm-info">
                        <span class="perm-title">Registrar Empresas</span>
                        <span class="perm-desc">Permite crear nuevas empresas en el sistema.</span>
                      </div>
                    </div>
                    <div class="plan-check">
                      <i class="bi" [ngClass]="vendedorForm.get('puedeCrearEmpresas')?.value ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                    </div>
                  </div>

                  <!-- Gestionar Planes -->
                  <div class="permission-horizontal-card"
                       [class.active]="vendedorForm.get('puedeGestionarPlanes')?.value"
                       (click)="togglePermission('puedeGestionarPlanes')">
                    <div class="d-flex align-items-center gap-3">
                      <div class="perm-icon-wrapper">
                        <i class="bi bi-arrow-left-right"></i>
                      </div>
                      <div class="perm-info">
                        <span class="perm-title">Gestionar Planes</span>
                        <span class="perm-desc">Habilitar cambios de plan y renovaciones manuales.</span>
                      </div>
                    </div>
                    <div class="plan-check">
                      <i class="bi" [ngClass]="vendedorForm.get('puedeGestionarPlanes')?.value ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                    </div>
                  </div>

                  <!-- ACCEDER A EMPRESAS -->
                  <div class="permission-horizontal-card"
                       [class.active]="vendedorForm.get('puedeAccederEmpresas')?.value"
                       (click)="togglePermission('puedeAccederEmpresas')">
                    <div class="d-flex align-items-center gap-3">
                      <div class="perm-icon-wrapper">
                        <i class="bi bi-folder2-open"></i>
                      </div>
                      <div class="perm-info">
                        <span class="perm-title">Acceder a Empresas</span>
                        <span class="perm-desc">Acceso a la información técnica de las empresas de sus clientes.</span>
                      </div>
                    </div>
                    <div class="plan-check">
                      <i class="bi" [ngClass]="vendedorForm.get('puedeAccederEmpresas')?.value ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                    </div>
                  </div>

                  <!-- Reportes -->
                  <div class="permission-horizontal-card"
                       [class.active]="vendedorForm.get('puedeVerReportes')?.value"
                       (click)="togglePermission('puedeVerReportes')">
                    <div class="d-flex align-items-center gap-3">
                      <div class="perm-icon-wrapper">
                        <i class="bi bi-bar-chart-line"></i>
                      </div>
                      <div class="perm-info">
                        <span class="perm-title">Ver Reportes</span>
                        <span class="perm-desc">Visualización de estadísticas y comisiones propias.</span>
                      </div>
                    </div>
                    <div class="plan-check">
                      <i class="bi" [ngClass]="vendedorForm.get('puedeVerReportes')?.value ? 'bi-check-circle-fill' : 'bi-circle'"></i>
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
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(12px);
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
    .btn-tab-premium:hover { color: var(--status-info-text); }
    .btn-tab-premium.active { color: var(--status-info-text); border-bottom-color: var(--status-info-text); }

    .btn-close-premium {
      background: #f8fafc; border: none; width: 40px; height: 40px;
      border-radius: 12px; color: #94a3b8; font-size: 1.5rem; transition: all 0.2s;
    }
    .btn-close-premium:hover { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .modal-body-premium { padding: 2rem; background: #ffffff; }
    
    .form-label-premium {
      font-size: 0.75rem; font-weight: 800; color: #64748b;
      margin-bottom: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .input-premium-group { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 1rem; color: #94a3b8; font-size: 1rem; }
    
    .form-control-premium, .form-select-premium {
      height: 55px;
      padding: 0 1.25rem 0 3.25rem; 
      border-radius: 14px;
      background: #f8fafc; border: 1px solid rgba(0, 0, 0, 0.05);
      font-size: 0.95rem; font-weight: 500; width: 100%; transition: all 0.2s;
      color: #1e293b;
      line-height: 48px;
    }
    
    .form-select-premium {
      padding-left: 1.25rem !important;
      padding-right: 2.5rem !important;
      font-size: 0.85rem !important;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%2364748b' class='bi bi-chevron-down' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 14px;
    }
    /* El padding derecho extra solo es necesario si hay un sufijo (%, $) */
    .form-control-premium:has(+ .input-suffix-premium) {
      padding-right: 3rem;
    }
    .form-control-premium:focus, .form-select-premium:focus {
      background: #ffffff; border-color: var(--status-info); box-shadow: 0 0 0 4px var(--status-info-bg); outline: none;
    }
    .input-suffix-premium {
      position: absolute; right: 1.25rem; font-weight: 800; color: var(--status-info-text);
      font-size: 0.95rem; pointer-events: none;
    }

    /* COMMISSIONS & PERMISSIONS SPECIFIC */
    .alert-premium-info {
      background: var(--status-info-bg); border: 1px solid var(--status-info); color: var(--status-info-text);
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
      border-color: var(--status-info); 
      background: var(--bg-main, #f8fafc); 
    }
    .permission-horizontal-card.active {
      border-color: var(--status-success);
      background: var(--status-success-bg);
      box-shadow: 0 4px 15px var(--status-success-bg);
    }
    
    .perm-icon-wrapper {
      width: 40px; height: 40px; border-radius: 12px;
      background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; font-size: 1.1rem; transition: all 0.2s;
    }
    .permission-horizontal-card.active .perm-icon-wrapper {
      background: var(--status-success); color: white;
    }
    
    .perm-info { display: flex; flex-direction: column; }
    .perm-title { font-weight: 800; color: #1e293b; font-size: 0.95rem; }
    .perm-desc { font-size: 0.75rem; color: #64748b; }

    .plan-check { font-size: 1.4rem; color: #cbd5e1; transition: all 0.2s; }
    .active .plan-check { color: var(--status-success-text); }

    .modal-footer-premium {
      padding: 1.5rem 2rem; background: #f8fafc; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end; gap: 1rem; width: 100%;
    }
    .btn-primary-premium {
      background: var(--secondary-color, #161d35); color: white; border: none; padding: 0.85rem 2rem;
      border-radius: 14px; font-weight: 700; transition: all 0.2s;
    }
    .btn-primary-premium:disabled { opacity: 0.5; }
    .btn-secondary-premium {
      background: white; border: 1px solid #e2e8f0; padding: 0.85rem 1.5rem;
      border-radius: 14px; font-weight: 600; color: #64748b;
    }
    .shadow-premium { box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25); }
    
    .form-control-premium.is-invalid {
      border-color: var(--status-danger);
      background: var(--status-danger-bg);
    }
    .error-feedback {
      color: var(--status-danger-text);
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
  private _saving: boolean = false;
  private originalData: any = null;

  @Input() set saving(value: boolean) {
    this._saving = value;
    if (this.vendedorForm) {
      if (value) {
        this.vendedorForm.disable({ emitEvent: false });
      } else {
        this.vendedorForm.enable({ emitEvent: false });
      }
    }
  }

  get saving(): boolean {
    return this._saving;
  }

  @Input() set vendedorData(data: any) {
    if (data) {
      // Normalización de datos para asegurar consistencia mínima
      const normalizedData = { ...data };
      
      // Solo inferir el tipo de identificación si NO viene definido en la data original
      // Esto permite que el usuario pueda cambiarlo manualmente después sin que el setter lo sobreescriba
      if (!normalizedData.tipoIdentificacion && normalizedData.identificacion) {
        const doc = normalizedData.identificacion.toString();
        if (doc.length === 13) normalizedData.tipoIdentificacion = '04';
        else if (doc.length === 10) normalizedData.tipoIdentificacion = '05';
        else normalizedData.tipoIdentificacion = '05'; // Default
      }

      this.originalData = JSON.parse(JSON.stringify(normalizedData));
      
      setTimeout(() => {
        this.vendedorForm.patchValue(normalizedData);
        this.onTipoIdChange(); // Ajustar validadores al tipo inicial
        this.vendedorForm.markAsPristine();
        this.vendedorForm.markAsUntouched();
      }, 0);
    }
  }

  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  vendedorForm!: FormGroup;
  activeTab: 'general' | 'comisiones' | 'permisos' = 'general';
  sriTipos = SRI_TIPOS_IDENTIFICACION;

  constructor(private fb: FormBuilder) {
    this.vendedorForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      apellidos: ['', [Validators.required, Validators.minLength(3)]],
      tipoIdentificacion: ['05', Validators.required],
      identificacion: ['', [Validators.required, SriValidators.identificacionEcuador()]],
      email: [''],
      telefono: ['', [Validators.required, Validators.pattern(/^09[0-9]{8}$/)]],
      // Comisiones
      tipoComision: ['PORCENTAJE', Validators.required],
      porcentajeComisionInicial: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      porcentajeComisionRecurrente: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      // Permisos
      puedeCrearEmpresas: [false],
      puedeGestionarPlanes: [false],
      puedeAccederEmpresas: [false],
      puedeVerReportes: [false]
    });

    // Suscripción reactiva para cambiar validadores automáticamente
    this.vendedorForm.get('tipoIdentificacion')?.valueChanges.subscribe(() => {
      this.onTipoIdChange();
    });
  }

  get hasAtLeastOnePermission(): boolean {
    const controls = this.vendedorForm.controls;
    return (
      controls['puedeCrearEmpresas'].value ||
      controls['puedeGestionarPlanes'].value ||
      controls['puedeAccederEmpresas'].value ||
      controls['puedeVerReportes'].value
    );
  }
  togglePermission(controlName: string) {
    if (this.saving) return;
    const control = this.vendedorForm.get(controlName);
    if (control) {
      control.setValue(!control.value);
    }
  }

  onTipoIdChange() {
    const tipo = this.vendedorForm.get('tipoIdentificacion')?.value;
    const docControl = this.vendedorForm.get('identificacion');

    if (docControl) {
      const validators = [Validators.required];
      if (tipo === '06') {
        validators.push(SriValidators.pasaporte());
      } else if (tipo === '05') {
        validators.push(Validators.pattern(/^[0-9]{10}$/));
        validators.push(SriValidators.validarCedulaEcuador());
      } else if (tipo === '04') {
        validators.push(Validators.pattern(/^[0-9]{13}$/));
        validators.push(SriValidators.rucEcuador());
      }
      docControl.setValidators(validators);
      docControl.updateValueAndValidity();
    }
  }

  ngOnInit() {
    // Escuchar cambios en tipoComision para ajustar validadores
    this.vendedorForm.get('tipoComision')?.valueChanges.subscribe(tipo => {
      this.updateCommissionValidators(tipo);
    });

    // Ejecutar inicialmente
    this.updateCommissionValidators(this.vendedorForm.get('tipoComision')?.value);
  }

  private updateCommissionValidators(tipo: string) {
    const fields = ['porcentajeComisionInicial', 'porcentajeComisionRecurrente'];

    fields.forEach(field => {
      const control = this.vendedorForm.get(field);
      if (control) {
        const validators = [Validators.required, Validators.min(1)];
        if (tipo === 'PORCENTAJE') {
          validators.push(Validators.max(100));
        } else {
          validators.push(Validators.max(1000));
        }
        control.setValidators(validators);
        control.updateValueAndValidity();
      }
    });
  }

  getIdPlaceholder(): string {
    const tipo = this.vendedorForm.get('tipoIdentificacion')?.value;
    switch (tipo) {
      case '05':
        return 'Ej: 1234567890 (10 dígitos)';
      case '04':
        return 'Ej: 1234567890001 (13 dígitos)';
      case '06':
        return 'Ej: AB123456 (alfanumérico)';
      default:
        return '0000000000';
    }
  }

  getIdMaxLength(): number {
    const tipo = this.vendedorForm.get('tipoIdentificacion')?.value;
    if (tipo === '06') return 20;
    if (tipo === '04') return 13;
    return 10; // 05 - CEDULA
  }

  getIdHint(): string {
    const tipo = this.vendedorForm.get('tipoIdentificacion')?.value;
    switch (tipo) {
      case '05':
        return 'Ingresa 10 dígitos de la cédula ecuatoriana válida';
      case '04':
        return 'Ingresa 13 dígitos del RUC ecuatoriano válido';
      case '06':
        return 'Ingresa el número de pasaporte (máximo 20 caracteres alfanuméricos)';
      default:
        return '';
    }
  }

  onlyNumbers(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

  onCommissionInput(event: any, controlName: string) {
    const input = event.target as HTMLInputElement;
    let value = parseInt(input.value);
    
    if (isNaN(value)) return;

    const tipo = this.vendedorForm.get('tipoComision')?.value;
    const max = tipo === 'PORCENTAJE' ? 100 : 1000;

    if (value > max) {
      input.value = max.toString();
      this.vendedorForm.get(controlName)?.setValue(max, { emitEvent: false });
    } else if (value < 0) {
      input.value = '0';
      this.vendedorForm.get(controlName)?.setValue(0, { emitEvent: false });
    }
  }



  isDirty(): boolean {
    if (!this.editing || !this.originalData) return true;

    const currentValues = this.vendedorForm.getRawValue();
    const keys = Object.keys(this.vendedorForm.controls);

    return keys.some(key => {
      let v1 = this.originalData[key];
      let v2 = currentValues[key];

      // Normalización para booleanos/números del backend (1/0 -> true/false)
      if (typeof v1 === 'number' && typeof v2 === 'boolean') v1 = !!v1;
      if (typeof v2 === 'number' && typeof v1 === 'boolean') v2 = !!v2;

      // Normalización general (null/undefined -> '')
      const s1 = JSON.stringify(v1 ?? '');
      const s2 = JSON.stringify(v2 ?? '');

      return s1 !== s2;
    });
  }

  submit() {
    // Validar que el formulario sea válido y tenga permisos
    if (!this.vendedorForm.valid || !this.hasAtLeastOnePermission) {
      this.vendedorForm.markAllAsTouched();
      return;
    }

    // Si estamos editando, validar que el formulario tenga cambios reales
    if (this.editing && !this.isDirty()) {
      return;
    }

    if (this.editing) {
      // Enviar solo los campos que cambiaron (PATCH style)
      const changedFields: any = {};
      const currentValues = this.vendedorForm.value;

      Object.keys(currentValues).forEach(key => {
        const originalValue = this.originalData[key];
        const currentValue = currentValues[key];
        const origStr = JSON.stringify(originalValue);
        const currStr = JSON.stringify(currentValue);

        if (origStr !== currStr) {
          changedFields[key] = currentValue;
        }
      });

      if (Object.keys(changedFields).length > 0) {
        this.onSave.emit(changedFields);
      }
    } else {
      const formValue = { ...this.vendedorForm.value };
      if (!formValue.email) {
        delete formValue.email;
      }
      this.onSave.emit(formValue);
    }
  }
}

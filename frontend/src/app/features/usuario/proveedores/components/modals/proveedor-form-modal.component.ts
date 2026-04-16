import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Proveedor } from '../../../../../domain/models/proveedor.model';
import { SriValidators } from '../../../../../shared/utils/sri-validators';
import { PROVINCIAS, getCiudadesByProvincia, Provincia, Ciudad } from '../../../../../shared/constants/provincias-ciudades.const';
import { SRI_TIPOS_IDENTIFICACION } from '../../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-proveedor-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content-container shadow-lg" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header">
          <div class="header-icon">
             <i class="bi" [ngClass]="proveedor ? 'bi-pencil-square' : 'bi-shop'"></i>
          </div>
          <div class="header-text">
            <h5>{{ proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h5>
            <span>Complete la información legal y de contacto</span>
          </div>
          <button class="btn-close-custom" (click)="close()" [disabled]="loading">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body scroll-custom">
          <form [formGroup]="proveedorForm" (ngSubmit)="submit()">
            
            <!-- IDENTIFICACIÓN -->
            <div class="form-section">
              <div class="section-title">
                <i class="bi bi-person-badge"></i>
                <span>Identificación Legal</span>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Tipo de documento *</label>
                  <select formControlName="tipo_identificacion" class="form-select-premium" [class.is-invalid]="isFieldInvalid('tipo_identificacion')">
                    <option *ngFor="let tipo of sriTipos" [value]="tipo.code">{{ tipo.label }}</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Número *</label>
                  <input
                    type="text"
                    formControlName="identificacion"
                    class="form-input-premium"
                    [class.is-invalid]="isFieldInvalid('identificacion')"
                    placeholder="Ej: 1712345678001"
                    (keypress)="validateIdentification($event)"
                    [maxlength]="getIdentificacionLimit()"
                  >
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('identificacion')">
                    <span *ngIf="proveedorForm.get('identificacion')?.hasError('required')">Requerido</span>
                    <span *ngIf="proveedorForm.get('identificacion')?.hasError('identificacionInvalid') || proveedorForm.get('identificacion')?.hasError('rucInvalid') || proveedorForm.get('identificacion')?.hasError('cedulaInvalid')">
                        Formato inválido
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- INFORMACIÓN GENERAL -->
            <div class="form-section">
              <div class="section-title">
                <i class="bi bi-building"></i>
                <span>Razón Social</span>
              </div>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Nombres Completos / Razón Social *</label>
                  <input type="text" formControlName="razon_social" class="form-input-premium" [class.is-invalid]="isFieldInvalid('razon_social')" placeholder="Ej: Distribuidora XYZ S.A.">
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('razon_social')">
                    La razón social es obligatoria
                  </div>
                </div>
                <div class="col-md-12">
                  <label class="form-label">Nombre Comercial *</label>
                  <input type="text" formControlName="nombre_comercial" class="form-input-premium" [class.is-invalid]="isFieldInvalid('nombre_comercial')" placeholder="Ej: Distribuidora XYZ">
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('nombre_comercial')">
                    El nombre comercial es obligatorio
                  </div>
                </div>
              </div>
            </div>

            <!-- CONTACTO -->
            <div class="form-section">
              <div class="section-title">
                <i class="bi bi-geo-alt"></i>
                <span>Contacto y Ubicación</span>
              </div>
              <div class="row g-3">
                <div class="col-md-7">
                  <label class="form-label">Correo Electrónico *</label>
                  <input type="email" formControlName="email" class="form-input-premium" [class.is-invalid]="isFieldInvalid('email')" placeholder="proveedor@ejemplo.com">
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('email')">
                    <span *ngIf="proveedorForm.get('email')?.hasError('required')">El correo es obligatorio</span>
                    <span *ngIf="proveedorForm.get('email')?.hasError('pattern')">Formato de correo inválido</span>
                  </div>
                </div>
                <div class="col-md-5">
                  <label class="form-label">Teléfono *</label>
                  <input
                    type="text"
                    formControlName="telefono"
                    class="form-input-premium"
                    [class.is-invalid]="isFieldInvalid('telefono')"
                    placeholder="Ej: 0987654321"
                    (keypress)="validateNumbers($event)"
                    maxlength="10"
                  >
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('telefono')">
                    El teléfono debe empezar con 09 y tener 10 dígitos
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Provincia *</label>
                  <select formControlName="provincia" class="form-select-premium" (change)="onProvinciaChange()" [class.is-invalid]="isFieldInvalid('provincia')">
                    <option value="">Seleccione...</option>
                    <option *ngFor="let prov of provincias" [value]="prov.nombre">{{ prov.nombre }}</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('provincia')">
                    Requerido
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Ciudad *</label>
                  <select formControlName="ciudad" class="form-select-premium" [disabled]="!proveedorForm.get('provincia')?.value" [class.is-invalid]="isFieldInvalid('ciudad')">
                    <option value="">Seleccione...</option>
                    <option *ngFor="let city of ciudadesDisponibles" [value]="city.nombre">{{ city.nombre }}</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('ciudad')">
                    Requerido
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label">Dirección Fiscal *</label>
                  <textarea formControlName="direccion" class="form-input-premium" [class.is-invalid]="isFieldInvalid('direccion')" rows="2" placeholder="Escriba la dirección exacta..."></textarea>
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('direccion')">
                    La dirección es obligatoria
                  </div>
                </div>
              </div>
            </div>

            <!-- CRÉDITO -->
            <div class="form-section last">
               <div class="section-title">
                <i class="bi bi-credit-card-2-front"></i>
                <span>Condiciones de Crédito</span>
              </div>
               <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Días de Crédito Plazo</label>
                    <input
                      type="number"
                      formControlName="dias_credito"
                      class="form-input-premium"
                      (keypress)="validateNoNegative($event)"
                      [class.is-invalid]="isFieldInvalid('dias_credito')"
                      placeholder="0"
                    >
                  </div>
               </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <div class="status-toggle">
            <span [class.active]="proveedorForm.get('activo')?.value">
              {{ proveedorForm.get('activo')?.value ? 'Proveedor Activo' : 'Proveedor Inactivo' }}
            </span>
            <div class="form-check form-switch" [formGroup]="proveedorForm">
              <input class="form-check-input" type="checkbox" formControlName="activo">
            </div>
          </div>
          
          <div class="actions">
            <button (click)="close()" class="btn-cancel" [disabled]="loading">Cancelar</button>
            <button (click)="submit()"
                    [disabled]="getSubmitButtonDisabled()"
                    class="btn-save">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ proveedor ? 'Guardar Cambios' : 'Crear Proveedor' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem; }
    .modal-content-container { background: white; border-radius: 24px; width: 100%; max-width: 680px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #f1f5f9; }
    .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 1.25rem; position: relative; }
    .header-icon { width: 48px; height: 48px; border-radius: 14px; background: #f8fafc; color: #1e293b; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .header-text h5 { margin: 0; font-weight: 800; color: #1e293b; font-size: 1.25rem; }
    .header-text span { font-size: 0.85rem; color: #64748b; font-weight: 500; }
    .btn-close-custom { position: absolute; right: 1.5rem; top: 1.5rem; width: 32px; height: 32px; border-radius: 10px; border: none; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .btn-close-custom:hover { background: #fee2e2; color: #ef4444; }
    .modal-body { padding: 2rem; overflow-y: auto; flex: 1; }
    .form-section { margin-bottom: 2.5rem; }
    .form-section.last { margin-bottom: 0; }
    .section-title { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; color: #1e293b; }
    .section-title i { font-size: 1.1rem; color: #3b82f6; }
    .section-title span { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .form-label { font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem; }
    .form-input-premium, .form-select-premium { width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; }
    .form-input-premium:focus, .form-select-premium:focus { outline: none; background: white; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    .form-input-premium.is-invalid, .form-select-premium.is-invalid {
      border-color: #f43f5e; background: #fff1f2;
    }
    .invalid-feedback { color: #f43f5e; font-size: 0.75rem; font-weight: 600; margin-top: 0.4rem; display: block; }
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; background: #f8fafc; }
    .status-toggle { display: flex; align-items: center; gap: 1rem; }
    .status-toggle span { font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
    .status-toggle span.active { color: #10b981; }
    .actions { display: flex; gap: 1rem; }
    .btn-cancel { padding: 0.75rem 1.5rem; border-radius: 12px; border: none; background: white; color: #64748b; font-weight: 700; transition: all 0.2s; }
    .btn-cancel:hover { background: #f1f5f9; color: #1e293b; }
    .btn-save { padding: 0.75rem 2rem; border-radius: 12px; border: none; background: #1e293b; color: white; font-weight: 700; transition: all 0.2s; }
    .btn-save:hover:not(:disabled) { background: #0f172a; transform: translateY(-2px); }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .form-check-input { width: 3em; height: 1.5em; cursor: pointer; }
    .form-check-input:checked { background-color: #10b981; border-color: #10b981; }
  `]
})
export class ProveedorFormModalComponent implements OnInit, OnDestroy {
  @Input() proveedor: Proveedor | null = null;
  @Input() loading: boolean = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  proveedorForm: FormGroup;
  provincias: Provincia[] = PROVINCIAS;
  ciudadesDisponibles: Ciudad[] = [];
  initialFormValue: any = {};
  sriTipos = SRI_TIPOS_IDENTIFICACION.filter(t => ['04', '05', '06'].includes(t.code));
  submitted = false;

  constructor(private fb: FormBuilder) {
    this.proveedorForm = this.fb.group({
      identificacion: ['', [Validators.required, SriValidators.rucEcuador()]],
      tipo_identificacion: ['04', [Validators.required]],
      razon_social: ['', [Validators.required, Validators.minLength(3)]],
      nombre_comercial: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^09\d{8}$/)]],
      direccion: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      provincia: ['', [Validators.required]],
      dias_credito: [0, [Validators.min(0), Validators.max(999)]],
      activo: [true]
    });

    this.proveedorForm.get('tipo_identificacion')?.valueChanges.subscribe(val => {
      this.applyValidators(val);
    });
  }

  private applyValidators(val: string) {
    const idCont = this.proveedorForm.get('identificacion');
    if (val === '04') {
      idCont?.setValidators([Validators.required, SriValidators.rucEcuador()]);
    } else if (val === '05') {
      idCont?.setValidators([Validators.required, SriValidators.identificacionEcuador()]);
    } else if (val === '06') {
      idCont?.setValidators([Validators.required, SriValidators.pasaporte()]);
    } else {
      idCont?.setValidators([Validators.required]);
    }
    idCont?.updateValueAndValidity();
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    if (this.proveedor) {
      const pData = this.proveedor;
      const prov = this.provincias.find(p => p.nombre === pData.provincia);
      if (prov) this.ciudadesDisponibles = getCiudadesByProvincia(prov.id);

      setTimeout(() => {
        this.proveedorForm.patchValue({
          identificacion: pData.identificacion,
          tipo_identificacion: pData.tipo_identificacion,
          razon_social: pData.razon_social,
          nombre_comercial: pData.nombre_comercial,
          email: pData.email,
          telefono: pData.telefono,
          direccion: pData.direccion,
          provincia: pData.provincia,
          ciudad: pData.ciudad,
          dias_credito: pData.dias_credito,
          activo: pData.activo
        });
        this.initialFormValue = JSON.parse(JSON.stringify(this.proveedorForm.value));
      }, 50);
    } else {
      this.initialFormValue = JSON.parse(JSON.stringify(this.proveedorForm.value));
    }
  }

  ngOnDestroy() { document.body.style.overflow = 'auto'; }

  onProvinciaChange() {
    const provNom = this.proveedorForm.get('provincia')?.value;
    if (provNom) {
      const prov = this.provincias.find(p => p.nombre === provNom);
      if (prov) this.ciudadesDisponibles = getCiudadesByProvincia(prov.id);
      this.proveedorForm.get('ciudad')?.setValue('');
    } else {
      this.ciudadesDisponibles = [];
    }
  }

  submit() {
    this.submitted = true;
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      return;
    }
    if (this.proveedorForm.valid) this.onSave.emit(this.proveedorForm.getRawValue());
  }

  getIdentificacionLimit(): number {
    const tipo = this.proveedorForm.get('tipo_identificacion')?.value;
    if (tipo === '05') return 10;
    if (tipo === '04') return 13;
    return 20;
  }

  validateNoNegative(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 45) event.preventDefault();
  }

  validateIdentification(event: any) {
    const tipoId = this.proveedorForm.get('tipo_identificacion')?.value;
    if (tipoId === '06') return;
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) event.preventDefault();
  }

  validateNumbers(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) event.preventDefault();
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.proveedorForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  getSubmitButtonDisabled(): boolean {
    if (this.loading) return true;
    if (this.proveedorForm.invalid) return true;
    if (this.proveedor && !this.hasChanges) return true;
    return false;
  }

  get hasChanges(): boolean {
    return JSON.stringify(this.initialFormValue) !== JSON.stringify(this.proveedorForm.value);
  }

  close() { if (!this.loading) this.onClose.emit(); }
}

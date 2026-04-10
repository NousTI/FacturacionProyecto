import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Proveedor } from '../../../../../domain/models/proveedor.model';
import { SriValidators } from '../../../../../shared/utils/sri-validators';
import { PROVINCIAS, CIUDADES, getCiudadesByProvincia, Provincia, Ciudad } from '../../../../../shared/constants/provincias-ciudades.const';

@Component({
    selector: 'app-create-proveedor-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-lux-container" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-lux-header">
          <div>
            <h2 class="modal-lux-title">{{ proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h2>
            <p class="modal-lux-subtitle">Completa la información legal y de contacto del proveedor</p>
          </div>
          <button (click)="close()" class="btn-close-lux" [disabled]="loading">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-lux-body scroll-custom">
          <form [formGroup]="proveedorForm" (ngSubmit)="submit()">

            <!-- IDENTIFICACIÓN -->
            <div class="lux-form-section">
              <h3 class="lux-section-header">Identificación Legal</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="lux-label">Tipo de documento *</label>
                  <select formControlName="tipo_identificacion" class="lux-select" [class.is-invalid]="proveedorForm.get('tipo_identificacion')?.invalid && proveedorForm.get('tipo_identificacion')?.touched">
                    <option value="CEDULA">Cédula</option>
                    <option value="RUC">RUC</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                  <div class="error-feedback" *ngIf="proveedorForm.get('tipo_identificacion')?.invalid && proveedorForm.get('tipo_identificacion')?.touched">
                    <small>El tipo de documento es requerido</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="lux-label">Número de identificación *</label>
                  <input
                    type="text"
                    formControlName="identificacion"
                    class="lux-input"
                    [class.is-invalid]="proveedorForm.get('identificacion')?.invalid && proveedorForm.get('identificacion')?.touched"
                    placeholder="Ej: 1712345678001"
                    (keypress)="validateIdentification($event)"
                    [maxlength]="proveedorForm.get('tipo_identificacion')?.value === 'CEDULA' ? 10 : (proveedorForm.get('tipo_identificacion')?.value === 'RUC' ? 13 : 20)"
                  >
                  <div class="error-feedback" *ngIf="proveedorForm.get('identificacion')?.invalid && proveedorForm.get('identificacion')?.touched">
                    <small *ngIf="proveedorForm.get('identificacion')?.hasError('required')">La identificación es obligatoria</small>
                    <small *ngIf="proveedorForm.get('identificacion')?.hasError('identificacionInvalid') ||
                                 proveedorForm.get('identificacion')?.hasError('rucInvalid') ||
                                 proveedorForm.get('identificacion')?.hasError('cedulaInvalid') ||
                                 proveedorForm.get('identificacion')?.hasError('passportInvalid')">
                        {{ proveedorForm.get('identificacion')?.getError('rucInvalid')?.message || 
                           proveedorForm.get('identificacion')?.getError('cedulaInvalid')?.message ||
                           proveedorForm.get('identificacion')?.getError('passportInvalid')?.message ||
                           'Número de documento inválido' }}
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <!-- RAZÓN SOCIAL -->
            <div class="lux-form-section">
              <h3 class="lux-section-header">Razón Social y Comercial</h3>
              <div class="row g-3">
                <div class="col-12">
                  <label class="lux-label">Razón Social *</label>
                  <input type="text" formControlName="razon_social" class="lux-input" [class.is-invalid]="proveedorForm.get('razon_social')?.invalid && proveedorForm.get('razon_social')?.touched" placeholder="Ej: Distribuidora XYZ S.A.">
                  <div class="error-feedback" *ngIf="proveedorForm.get('razon_social')?.invalid && proveedorForm.get('razon_social')?.touched">
                    <small *ngIf="proveedorForm.get('razon_social')?.hasError('required')">La razón social es requerida</small>
                    <small *ngIf="proveedorForm.get('razon_social')?.hasError('minlength')">Debe tener al menos 3 caracteres</small>
                  </div>
                </div>
                <div class="col-12">
                  <label class="lux-label">Nombre Comercial *</label>
                  <input type="text" formControlName="nombre_comercial" class="lux-input" [class.is-invalid]="proveedorForm.get('nombre_comercial')?.invalid && proveedorForm.get('nombre_comercial')?.touched" placeholder="Ej: Distribuidora XYZ">
                  <div class="error-feedback" *ngIf="proveedorForm.get('nombre_comercial')?.invalid && proveedorForm.get('nombre_comercial')?.touched">
                    <small>El nombre comercial es requerido</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- CONTACTO -->
            <div class="lux-form-section">
              <h3 class="lux-section-header">Información de Contacto</h3>
              <div class="row g-3">
                <div class="col-md-7">
                  <label class="lux-label">Correo Electrónico *</label>
                  <input type="email" formControlName="email" class="lux-input" [class.is-invalid]="proveedorForm.get('email')?.invalid && proveedorForm.get('email')?.touched" placeholder="proveedor@ejemplo.com">
                  <div class="error-feedback" *ngIf="proveedorForm.get('email')?.invalid && proveedorForm.get('email')?.touched">
                    <small *ngIf="proveedorForm.get('email')?.hasError('required')">El correo es requerido</small>
                    <small *ngIf="proveedorForm.get('email')?.hasError('pattern')">Ingrese un correo válido (ej: usuario@dominio.com)</small>
                  </div>
                </div>
                <div class="col-md-5">
                  <label class="lux-label">Teléfono</label>
                  <input
                    type="text"
                    formControlName="telefono"
                    class="lux-input"
                    [class.is-invalid]="proveedorForm.get('telefono')?.invalid && proveedorForm.get('telefono')?.touched"
                    placeholder="Ej: 0987654321"
                    (keypress)="validateNumbers($event)"
                    maxlength="10"
                  >
                  <div class="error-feedback" *ngIf="proveedorForm.get('telefono')?.invalid && proveedorForm.get('telefono')?.touched">
                    <small *ngIf="proveedorForm.get('telefono')?.hasError('pattern')">Debe empezar con 09 y tener 10 dígitos</small>
                  </div>
                </div>
                <div class="col-12">
                  <label class="lux-label">Dirección *</label>
                  <input type="text" formControlName="direccion" class="lux-input" [class.is-invalid]="proveedorForm.get('direccion')?.invalid && proveedorForm.get('direccion')?.touched" placeholder="Av. Principal N23 y Calle B">
                  <div class="error-feedback" *ngIf="proveedorForm.get('direccion')?.invalid && proveedorForm.get('direccion')?.touched">
                    <small>La dirección es requerida</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="lux-label">Provincia *</label>
                  <select formControlName="provincia" class="lux-select" (change)="onProvinciaChange()" [class.is-invalid]="proveedorForm.get('provincia')?.invalid && proveedorForm.get('provincia')?.touched">
                    <option value="">Selecciona una provincia</option>
                    <option *ngFor="let prov of provincias" [value]="prov.nombre">{{ prov.nombre }}</option>
                  </select>
                  <div class="error-feedback" *ngIf="proveedorForm.get('provincia')?.invalid && proveedorForm.get('provincia')?.touched">
                    <small>La provincia es requerida</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="lux-label">Ciudad *</label>
                  <select formControlName="ciudad" class="lux-select" [class.is-invalid]="proveedorForm.get('ciudad')?.invalid && proveedorForm.get('ciudad')?.touched">
                    <option value="">Selecciona una ciudad</option>
                    <option *ngFor="let ciudad of ciudadesDisponibles" [value]="ciudad.nombre">{{ ciudad.nombre }}</option>
                  </select>
                  <div class="error-feedback" *ngIf="proveedorForm.get('ciudad')?.invalid && proveedorForm.get('ciudad')?.touched">
                    <small>La ciudad es requerida</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- CRÉDITO -->
            <div class="lux-form-section border-0 mb-0 pb-0">
              <h3 class="lux-section-header">Condiciones de Crédito</h3>
              <div class="row g-3 align-items-center">
                <div class="col-md-6">
                  <label class="lux-label">Días de Crédito Plazo</label>
                  <input type="text" formControlName="dias_credito" class="lux-input" placeholder="0" (keypress)="validateDiasCredito($event)" (input)="onDiasInput($event)" [class.is-invalid]="proveedorForm.get('dias_credito')?.invalid && proveedorForm.get('dias_credito')?.touched">
                  <div class="error-feedback" *ngIf="proveedorForm.get('dias_credito')?.invalid && proveedorForm.get('dias_credito')?.touched">
                    <small *ngIf="proveedorForm.get('dias_credito')?.hasError('min')">No puede ser negativo</small>
                    <small *ngIf="proveedorForm.get('dias_credito')?.hasError('max')">Máximo 999 días</small>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="modal-lux-footer">
          <div class="d-flex align-items-center gap-3 w-100">
            <div class="form-check form-switch lux-switch mb-0" [formGroup]="proveedorForm">
              <input class="form-check-input" type="checkbox" formControlName="activo" id="activoCheckProv">
              <label class="form-check-label ms-2" for="activoCheckProv">Proveedor Habilitado</label>
            </div>
            <div class="ms-auto d-flex gap-3">
              <button (click)="close()" class="btn-lux-outline" [disabled]="loading">Cancelar</button>
              <button (click)="submit()"
                      [disabled]="getSubmitButtonDisabled()"
                      class="btn-lux-submit">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Guardando...' : (proveedor ? 'Guardar Cambios' : 'Crear Proveedor') }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.3); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 1rem;
    }
    .modal-lux-container {
      background: white; width: 720px; max-width: 95vw; max-height: 90vh;
      border-radius: 32px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 100px -20px rgba(15, 23, 42, 0.2);
    }
    .modal-lux-header {
      padding: 2rem 2.5rem; display: flex; justify-content: space-between;
      align-items: flex-start; border-bottom: 1px solid #f1f5f9;
    }
    .modal-lux-title { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
    .modal-lux-subtitle { font-size: 0.85rem; color: #94a3b8; margin: 0.25rem 0 0 0; font-weight: 500; }
    .btn-close-lux {
      background: #f8fafc; border: none; width: 36px; height: 36px;
      border-radius: 10px; color: #94a3b8; display: flex; align-items: center;
      justify-content: center; transition: all 0.2s;
    }
    .btn-close-lux:hover { background: #f1f5f9; color: #1e293b; }
    .modal-lux-body { padding: 2rem 2.5rem; overflow-y: auto; flex: 1; }
    .lux-form-section { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #f1f5f9; }
    .lux-section-header {
      font-size: 0.85rem; font-weight: 800; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1.5rem;
    }
    .lux-label { font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 0.6rem; display: block; }
    .lux-input, .lux-select {
      width: 100%; background: #f8fafc; border: 1px solid #f1f5f9;
      border-radius: 14px; padding: 0.75rem 1.25rem; font-size: 0.95rem;
      font-weight: 600; color: #1e293b; transition: all 0.2s;
    }
    .lux-input:focus, .lux-select:focus {
      background: white; border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05); outline: none;
    }
    .lux-input.is-invalid { border-color: #ef4444 !important; background: #fef2f2; }
    .error-feedback { font-size: 0.75rem; color: #ef4444; font-weight: 700; margin-top: 0.4rem; display: block; text-transform: uppercase; }
    .modal-lux-footer { padding: 1.5rem 2.5rem; background: white; border-top: 1px solid #f1f5f9; }
    .btn-lux-submit {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.85rem 2rem;
      border-radius: 16px;
      font-weight: 800;
      font-size: 0.9rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-lux-submit:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.3); }
    .btn-lux-submit:disabled { 
      background: #e2e8f0; 
      color: #94a3b8; 
      cursor: not-allowed; 
      opacity: 1;
      transform: none;
      box-shadow: none;
    }
    .btn-lux-outline {
      background: white; color: #64748b; border: 1px solid #f1f5f9;
      padding: 0.85rem 1.75rem; border-radius: 16px; font-weight: 700; font-size: 0.9rem; transition: all 0.2s;
    }
    .btn-lux-outline:hover:not(:disabled) { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
    .lux-switch .form-check-input { width: 3.2rem; height: 1.6rem; cursor: pointer; }
    .lux-switch .form-check-input:checked { background-color: #111827; border-color: #111827; }
    .lux-switch .form-check-label { font-size: 0.9rem; font-weight: 700; color: #475569; cursor: pointer; line-height: 1.6rem; }
    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class CreateProveedorModalComponent implements OnInit, OnDestroy {
    @Input() proveedor: Proveedor | null = null;
    @Input() loading: boolean = false;
    @Output() onSave = new EventEmitter<any>();
    @Output() onClose = new EventEmitter<void>();

    proveedorForm: FormGroup;
    provincias: Provincia[] = PROVINCIAS;
    ciudadesDisponibles: Ciudad[] = [];
    initialFormValue: any;

    constructor(private fb: FormBuilder) {
        this.proveedorForm = this.fb.group({
            identificacion: ['', [Validators.required, SriValidators.rucEcuador()]],
            tipo_identificacion: ['RUC', [Validators.required]],
            razon_social: ['', [Validators.required, Validators.minLength(3)]],
            nombre_comercial: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
            telefono: ['', [Validators.pattern(/^09\d{8}$/)]],
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
        if (val === 'RUC') {
            idCont?.setValidators([Validators.required, SriValidators.rucEcuador()]);
        } else if (val === 'CEDULA') {
            idCont?.setValidators([Validators.required, SriValidators.identificacionEcuador()]);
        } else if (val === 'PASAPORTE') {
            idCont?.setValidators([Validators.required, SriValidators.pasaporte()]);
        } else {
            idCont?.setValidators([Validators.required]);
        }
        idCont?.updateValueAndValidity();
    }

    ngOnInit() {
        document.body.style.overflow = 'hidden';
        if (this.proveedor) {
            const proveedorData = this.proveedor;

            // Load ciudades FIRST based on provincia
            const provinciaNombre = proveedorData.provincia;
            if (provinciaNombre) {
                const provincia = this.provincias.find(p => p.nombre === provinciaNombre);
                if (provincia) {
                    this.ciudadesDisponibles = getCiudadesByProvincia(provincia.id);
                }
            }

            // Load form data with setTimeout to ensure DOM updates
            setTimeout(() => {
                this.proveedorForm.get('provincia')?.setValue(proveedorData.provincia, { emitEvent: false });
                this.proveedorForm.get('ciudad')?.setValue(proveedorData.ciudad, { emitEvent: false });
                this.proveedorForm.patchValue({
                    identificacion: proveedorData.identificacion,
                    tipo_identificacion: proveedorData.tipo_identificacion,
                    razon_social: proveedorData.razon_social,
                    nombre_comercial: proveedorData.nombre_comercial,
                    email: proveedorData.email,
                    telefono: proveedorData.telefono,
                    direccion: proveedorData.direccion,
                    dias_credito: proveedorData.dias_credito,
                    activo: proveedorData.activo
                }, { emitEvent: false });
                this.applyValidators(proveedorData.tipo_identificacion);
                this.initialFormValue = JSON.parse(JSON.stringify(this.proveedorForm.value));
            }, 50);
        } else {
            this.initialFormValue = JSON.parse(JSON.stringify(this.proveedorForm.value));
        }
    }

    ngOnDestroy() {
        document.body.style.overflow = 'auto';
    }

    submit() {
        if (this.proveedorForm.valid) {
            this.onSave.emit(this.proveedorForm.value);
        }
    }

    validateNoNegative(event: KeyboardEvent) {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode === 45) {
            event.preventDefault();
        }
    }

    validateIdentification(event: KeyboardEvent) {
        const tipoId = this.proveedorForm.get('tipo_identificacion')?.value;
        if (tipoId === 'PASAPORTE') return;
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
        }
    }

    validateNumbers(event: KeyboardEvent) {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
        }
    }

    onProvinciaChange() {
        const provinciaControl = this.proveedorForm.get('provincia');
        const provinciaNombre = provinciaControl?.value;

        if (provinciaNombre) {
            const provincia = this.provincias.find(p => p.nombre === provinciaNombre);
            if (provincia) {
                this.ciudadesDisponibles = getCiudadesByProvincia(provincia.id);
                this.proveedorForm.get('ciudad')?.reset('', { emitEvent: false });
            }
        } else {
            this.ciudadesDisponibles = [];
            this.proveedorForm.get('ciudad')?.reset('', { emitEvent: false });
        }
    }

    validateDiasCredito(event: KeyboardEvent) {
        const charCode = event.which ? event.which : event.keyCode;
        // Allow only numbers
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
        }
    }

    onDiasInput(event: any) {
        const input = event.target as HTMLInputElement;
        // Limit to 3 digits
        if (input.value.length > 3) {
            input.value = input.value.slice(0, 3);
            this.proveedorForm.get('dias_credito')?.setValue(input.value, { emitEvent: false });
        }
    }

    get hasChanges(): boolean {
        const formValue = this.proveedorForm.value;
        const fields = Object.keys(this.proveedorForm.controls);

        for (const field of fields) {
            const initialValue = this.initialFormValue[field];
            const currentValue = formValue[field];

            // Normalize for comparison
            const normInitial = (initialValue === null || initialValue === undefined) ? '' : initialValue;
            const normCurrent = (currentValue === null || currentValue === undefined) ? '' : currentValue;

            if (String(normInitial) !== String(normCurrent)) {
                return true;
            }
        }
        return false;
    }

    getSubmitButtonDisabled(): boolean {
        if (this.loading) return true;
        if (!this.proveedor) {
            // Create mode: require form validity
            return this.proveedorForm.invalid;
        } else {
            // Edit mode: require changes to be made
            return !this.hasChanges;
        }
    }

    close() {
        if (!this.loading) { this.onClose.emit(); }
    }
}

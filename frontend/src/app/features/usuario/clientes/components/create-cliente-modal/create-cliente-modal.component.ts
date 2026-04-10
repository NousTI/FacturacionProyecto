import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Cliente } from '../../../../../domain/models/cliente.model';
import { SriValidators } from '../../../../../shared/utils/sri-validators';
import { PROVINCIAS, getCiudadesByProvincia, Provincia, Ciudad } from '../../../../../shared/constants/provincias-ciudades.const';

@Component({
    selector: 'app-create-cliente-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content-container glass-modal shadow-lg" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header border-0 pb-0">
          <div>
            <h5 class="fw-bold mb-0">{{ cliente ? 'Editar Cliente' : 'Nuevo Cliente' }}</h5>
            <small class="text-muted">Información legal y datos de contacto</small>
          </div>
          <button class="btn-close" (click)="close()" [disabled]="loading"></button>
        </div>

        <div class="modal-body py-4 scroll-custom">
          <form [formGroup]="clienteForm" (ngSubmit)="submit()">
            
            <!-- IDENTIFICACIÓN -->
            <div class="form-section mb-4">
              <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.75rem; letter-spacing: 1px;">Identificación Legal</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Tipo de documento *</label>
                  <select formControlName="tipo_identificacion" class="form-select" [class.is-invalid]="clienteForm.get('tipo_identificacion')?.invalid && clienteForm.get('tipo_identificacion')?.touched">
                    <option value="CEDULA">Cédula</option>
                    <option value="RUC">RUC</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                  <div class="invalid-feedback d-block" *ngIf="clienteForm.get('tipo_identificacion')?.hasError('required') && clienteForm.get('tipo_identificacion')?.touched">
                    <small>El tipo de documento es requerido</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Número *</label>
                  <input
                    type="text"
                    formControlName="identificacion"
                    class="form-control"
                    [class.is-invalid]="clienteForm.get('identificacion')?.invalid && clienteForm.get('identificacion')?.touched"
                    placeholder="Ej: 1712345678001"
                    (keypress)="validateIdentification($event)"
                    [maxlength]="clienteForm.get('tipo_identificacion')?.value === 'CEDULA' ? 10 : (clienteForm.get('tipo_identificacion')?.value === 'RUC' ? 13 : 20)"
                  >
                  <div class="invalid-feedback d-block" *ngIf="clienteForm.get('identificacion')?.invalid && clienteForm.get('identificacion')?.touched">
                    <small *ngIf="clienteForm.get('identificacion')?.hasError('required')">El número de identificación es requerido</small>
                    <small *ngIf="clienteForm.get('identificacion')?.hasError('identificacionInvalid')">{{ getIdentificationErrorMessage() }}</small>
                    <small *ngIf="clienteForm.get('identificacion')?.hasError('rucInvalid')">{{ clienteForm.get('identificacion')?.getError('rucInvalid')?.message || 'El RUC no es válido' }}</small>
                    <small *ngIf="clienteForm.get('identificacion')?.hasError('cedulaInvalid')">{{ clienteForm.get('identificacion')?.getError('cedulaInvalid')?.message || 'La cédula no es válida' }}</small>
                    <small *ngIf="clienteForm.get('identificacion')?.hasError('passportInvalid')">{{ clienteForm.get('identificacion')?.getError('passportInvalid')?.message || 'El pasaporte no es válido' }}</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- INFORMACIÓN GENERAL -->
            <div class="form-section mb-4">
              <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.75rem; letter-spacing: 1px;">Razón Social</h6>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Nombres Completos / Razón Social *</label>
                  <input type="text" formControlName="razon_social" class="form-control" [class.is-invalid]="clienteForm.get('razon_social')?.invalid && clienteForm.get('razon_social')?.touched" placeholder="Ej: Importadora Global S.A.">
                  <div class="invalid-feedback d-block" *ngIf="clienteForm.get('razon_social')?.invalid && clienteForm.get('razon_social')?.touched">
                    <small *ngIf="clienteForm.get('razon_social')?.hasError('required')">La razón social es requerida</small>
                    <small *ngIf="clienteForm.get('razon_social')?.hasError('minlength')">Debe tener al menos 3 caracteres</small>
                  </div>
                </div>
                <div class="col-md-12">
                  <label class="form-label">Nombre Comercial *</label>
                  <input type="text" formControlName="nombre_comercial" class="form-control" [class.is-invalid]="clienteForm.get('nombre_comercial')?.invalid && clienteForm.get('nombre_comercial')?.touched" placeholder="Ej: Tienda Virtual">
                  <div class="invalid-feedback d-block" *ngIf="clienteForm.get('nombre_comercial')?.invalid && clienteForm.get('nombre_comercial')?.touched">
                    <small>El nombre comercial es requerido</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- CONTACTO -->
            <div class="form-section mb-4">
              <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.75rem; letter-spacing: 1px;">Contacto y Ubicación</h6>
              <div class="row g-3">
                <div class="col-md-7">
                  <label class="form-label">Correo Electrónico *</label>
                  <input type="email" formControlName="email" class="form-control" [class.is-invalid]="clienteForm.get('email')?.invalid && clienteForm.get('email')?.touched" placeholder="cliente@ejemplo.com">
                  <div class="invalid-feedback d-block" *ngIf="clienteForm.get('email')?.invalid && clienteForm.get('email')?.touched">
                    <small *ngIf="clienteForm.get('email')?.hasError('required')">El correo es requerido</small>
                    <small *ngIf="clienteForm.get('email')?.hasError('pattern')">Ingrese un correo válido (ej: usuario@dominio.com)</small>
                  </div>
                </div>
                <div class="col-md-5">
                  <label class="form-label">Teléfono</label>
                  <input
                    type="text"
                    formControlName="telefono"
                    class="form-control"
                    [class.is-invalid]="clienteForm.get('telefono')?.invalid && clienteForm.get('telefono')?.touched"
                    placeholder="Ej: 0987654321"
                    (keypress)="validateNumbers($event)"
                    maxlength="10"
                  >
                  <div class="invalid-feedback d-block" *ngIf="clienteForm.get('telefono')?.invalid && clienteForm.get('telefono')?.touched">
                    <small *ngIf="clienteForm.get('telefono')?.hasError('pattern')">Debe empezar con 09 y tener 10 dígitos</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Provincia *</label>
                  <select formControlName="provincia" class="form-select" [class.is-invalid]="clienteForm.get('provincia')?.invalid && clienteForm.get('provincia')?.touched">
                    <option value="">Seleccione provincia...</option>
                    <option *ngFor="let prov of provincias" [value]="prov.nombre">
                      {{ prov.nombre }}
                    </option>
                  </select>
                  <div class="invalid-feedback d-block" *ngIf="clienteForm.get('provincia')?.invalid && clienteForm.get('provincia')?.touched">
                    <small>La provincia es requerida</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Ciudad *</label>
                  <select formControlName="ciudad" class="form-select" [disabled]="!clienteForm.get('provincia')?.value" [class.is-invalid]="clienteForm.get('ciudad')?.invalid && clienteForm.get('ciudad')?.touched">
                    <option value="">Seleccione ciudad...</option>
                    <option *ngFor="let city of ciudadesDisponibles" [value]="city.nombre">
                      {{ city.nombre }}
                    </option>
                  </select>
                  <div class="invalid-feedback d-block" *ngIf="clienteForm.get('ciudad')?.invalid && clienteForm.get('ciudad')?.touched">
                    <small>La ciudad es requerida</small>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label">Dirección Fiscal / Residencia *</label>
                  <textarea formControlName="direccion" class="form-control" [class.is-invalid]="clienteForm.get('direccion')?.invalid && clienteForm.get('direccion')?.touched" rows="2"></textarea>
                  <div class="invalid-feedback d-block" *ngIf="clienteForm.get('direccion')?.invalid && clienteForm.get('direccion')?.touched">
                    <small>La dirección es requerida</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- CRÉDITO -->
            <div class="form-section">
               <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.75rem; letter-spacing: 1px;">Crédito Autorizado</h6>
               <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Límite de Crédito ($)</label>
                    <div class="input-group">
                      <span class="input-group-text">$</span>
                      <input type="number" formControlName="limite_credito" class="form-control" placeholder="0.00" (keypress)="validateNoNegative($event)">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Días de Plazo</label>
                    <input
                      type="number"
                      formControlName="dias_credito"
                      class="form-control"
                      (keypress)="validateNoNegative($event)"
                      [class.is-invalid]="clienteForm.get('dias_credito')?.invalid && clienteForm.get('dias_credito')?.touched"
                      maxlength="6"
                      min="0"
                      max="999999"
                      placeholder="0"
                    >
                    <small class="text-muted" *ngIf="clienteForm.get('dias_credito')?.valid">Máximo 6 dígitos</small>
                  </div>
               </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-0 pt-0 pb-4 px-4">
          <div class="d-flex align-items-center justify-content-between w-100">
            <div class="form-check form-switch mb-0" [formGroup]="clienteForm">
              <input class="form-check-input" type="checkbox" formControlName="activo" id="activoCheck">
              <label class="form-check-label fw-semibold" for="activoCheck">Habilitado</label>
            </div>
            
            <div class="d-flex gap-2">
              <button (click)="close()" class="btn btn-light px-4" [disabled]="loading">Cancelar</button>
              <button (click)="submit()"
                      [disabled]="getSubmitButtonDisabled()"
                      class="btn btn-primary px-4">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ cliente ? 'Actualizar' : 'Crear Cliente' }}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1050; animation: fadeIn 0.2s; padding: 1rem; }
    .modal-content-container { background: white; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-height: 90vh; overflow: hidden; width: 95%; max-width: 650px; position: relative; display: flex; flex-direction: column; }

    .modal-body { overflow-y: auto; padding: 1.5rem 2rem; }

    .form-label { font-size: 0.85rem; font-weight: 600; color: #4b5563; margin-bottom: 0.4rem; display: block; }
    .form-control, .form-select { border-radius: 10px; padding: 0.6rem 0.8rem; border: 1px solid #e2e8f0; font-size: 0.95rem; }
    .form-control:focus, .form-select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

    .btn { border-radius: 12px; font-weight: 700; padding: 0.7rem 1.25rem; }
    .btn-primary { background: #2563eb; border: none; }
    .btn-light { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }

    .form-check-input:checked { background-color: #2563eb; border-color: #2563eb; }
    .is-invalid { border-color: #ef4444 !important; }

    .invalid-feedback { color: #ef4444; font-size: 0.8rem; margin-top: 0.25rem; display: none; }
    .invalid-feedback.d-block { display: block; }

    .scroll-custom::-webkit-scrollbar { width: 4px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class CreateClienteModalComponent implements OnInit, OnDestroy {
    @Input() cliente: Cliente | null = null;
    @Input() loading: boolean = false;
    @Output() onSave = new EventEmitter<any>();
    @Output() onClose = new EventEmitter<void>();

    clienteForm: FormGroup;
    provincias: Provincia[] = PROVINCIAS;
    ciudadesDisponibles: Ciudad[] = [];
    initialFormValue: any = {};

    constructor(private fb: FormBuilder) {
        this.clienteForm = this.fb.group({
            identificacion: ['', [Validators.required, SriValidators.identificacionEcuador()]],
            tipo_identificacion: ['CEDULA', [Validators.required]],
            razon_social: ['', [Validators.required, Validators.minLength(3)]],
            nombre_comercial: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
            telefono: ['', [Validators.pattern(/^09\d{8}$/)]],
            direccion: ['', [Validators.required]],
            ciudad: ['', [Validators.required]],
            provincia: ['', [Validators.required]],
            dias_credito: [0, [Validators.min(0), Validators.max(999999)]],
            limite_credito: [0.0, [Validators.min(0)]],
            activo: [true]
        });

        // Dynamic validation based on document type
        this.clienteForm.get('tipo_identificacion')?.valueChanges.subscribe(val => {
            const idCont = this.clienteForm.get('identificacion');
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
        });

        // Dynamic cities based on province selection
        this.clienteForm.get('provincia')?.valueChanges.subscribe(provinciaNombre => {
            if (provinciaNombre) {
                // Busca el ID de la provincia por nombre
                const provincia = this.provincias.find(p => p.nombre === provinciaNombre);
                if (provincia) {
                    this.ciudadesDisponibles = getCiudadesByProvincia(provincia.id);
                }
                this.clienteForm.get('ciudad')?.setValue('');
            } else {
                this.ciudadesDisponibles = [];
            }
        });
    }

    ngOnInit() {
        document.body.style.overflow = 'hidden';
        if (this.cliente) {
            // Si hay provincia, cargar sus ciudades PRIMERO
            const provinciaNombre = this.cliente.provincia;
            if (provinciaNombre) {
                const provincia = this.provincias.find(p => p.nombre === provinciaNombre);
                if (provincia) {
                    this.ciudadesDisponibles = getCiudadesByProvincia(provincia.id);
                }
            }

            // Luego cargar los datos del cliente después de que las ciudades estén disponibles
            const clienteData = this.cliente;
            setTimeout(() => {
                // Primero set la provincia
                this.clienteForm.get('provincia')?.setValue(clienteData.provincia, { emitEvent: false });

                // Luego set la ciudad
                this.clienteForm.get('ciudad')?.setValue(clienteData.ciudad, { emitEvent: false });

                // Finalmente patchValue con el resto de datos
                this.clienteForm.patchValue({
                    identificacion: clienteData.identificacion,
                    tipo_identificacion: clienteData.tipo_identificacion,
                    razon_social: clienteData.razon_social,
                    nombre_comercial: clienteData.nombre_comercial,
                    email: clienteData.email,
                    telefono: clienteData.telefono,
                    direccion: clienteData.direccion,
                    dias_credito: clienteData.dias_credito,
                    limite_credito: clienteData.limite_credito,
                    activo: clienteData.activo
                });

                // Guarda el estado inicial del formulario después de cargar los datos
                this.initialFormValue = JSON.parse(JSON.stringify(this.clienteForm.value));
            }, 50);
        } else {
            // Guarda el estado inicial del formulario después de cargar los datos
            this.initialFormValue = JSON.parse(JSON.stringify(this.clienteForm.value));
        }
    }

    ngOnDestroy() {
        document.body.style.overflow = 'auto';
    }

    submit() {
        // En modo creación, requiere que sea válido
        if (!this.cliente && this.clienteForm.invalid) {
            return;
        }

        // En modo edición, solo verifica que haya cambios (no requiere validez completa)
        if (this.cliente && !this.hasChanges) {
            return;
        }

        this.onSave.emit(this.clienteForm.value);
    }

    validateNoNegative(event: KeyboardEvent) {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode === 45) {
            event.preventDefault();
        }
    }

    validateIdentification(event: KeyboardEvent) {
        const tipoId = this.clienteForm.get('tipo_identificacion')?.value;
        if (tipoId === 'PASAPORTE') return; // Passports can have letters

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

    getIdentificationErrorMessage(): string {
        const idControl = this.clienteForm.get('identificacion');
        const error = idControl?.getError('identificacionInvalid');

        if (error && error['message']) {
            return error['message'];
        }

        const tipoId = this.clienteForm.get('tipo_identificacion')?.value;
        if (tipoId === 'CEDULA') {
            return 'La cédula no es válida';
        } else if (tipoId === 'RUC') {
            return 'El RUC no es válido';
        }

        return 'Identificación inválida';
    }

    getSubmitButtonDisabled(): boolean {
        // Si está en modo creación, requiere formulario válido
        if (!this.cliente) {
            return this.clienteForm.invalid || this.loading;
        }

        // Si está en modo edición, requiere que haya cambios
        // No requiere que el formulario sea válido si hay cambios
        return !this.hasChanges || this.loading;
    }

    get hasChanges(): boolean {
        if (!this.cliente) return true;
        const formValue = this.clienteForm.value;
        const fields = Object.keys(this.clienteForm.controls);

        for (const field of fields) {
            const initialValue = this.initialFormValue[field];
            const currentValue = formValue[field];

            // Normalize for comparison
            const normInitial = (initialValue === null || initialValue === undefined) ? '' : String(initialValue).trim();
            const normCurrent = (currentValue === null || currentValue === undefined) ? '' : String(currentValue).trim();

            if (normInitial !== normCurrent) {
                return true;
            }
        }
        return false;
    }

    close() {
        if (!this.loading) {
            this.onClose.emit();
        }
    }
}

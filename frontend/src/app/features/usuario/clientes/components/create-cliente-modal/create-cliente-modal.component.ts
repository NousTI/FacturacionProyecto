import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Cliente } from '../../../../../domain/models/cliente.model';
import { SriValidators } from '../../../../../shared/utils/sri-validators';

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
                  <select formControlName="tipo_identificacion" class="form-select">
                    <option value="CEDULA">Cédula</option>
                    <option value="RUC">RUC</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
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
                </div>
              </div>
            </div>

            <!-- INFORMACIÓN GENERAL -->
            <div class="form-section mb-4">
              <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.75rem; letter-spacing: 1px;">Razón Social</h6>
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label">Nombres Completos / Razón Social *</label>
                  <input type="text" formControlName="razon_social" class="form-control" placeholder="Ej: Importadora Global S.A.">
                </div>
                <div class="col-md-12">
                  <label class="form-label">Nombre Comercial</label>
                  <input type="text" formControlName="nombre_comercial" class="form-control" placeholder="Ej: Tienda Virtual">
                </div>
              </div>
            </div>

            <!-- CONTACTO -->
            <div class="form-section mb-4">
              <h6 class="text-uppercase text-muted fw-bold mb-3" style="font-size: 0.75rem; letter-spacing: 1px;">Contacto y Ubicación</h6>
              <div class="row g-3">
                <div class="col-md-7">
                  <label class="form-label">Correo Electrónico *</label>
                  <input type="email" formControlName="email" class="form-control" placeholder="cliente@ejemplo.com">
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
                </div>
                <div class="col-md-6">
                  <label class="form-label">Provincia</label>
                  <input type="text" formControlName="provincia" class="form-control">
                </div>
                <div class="col-md-6">
                  <label class="form-label">Ciudad</label>
                  <input type="text" formControlName="ciudad" class="form-control">
                </div>
                <div class="col-12">
                  <label class="form-label">Dirección Fiscal / Residencia</label>
                  <textarea formControlName="direccion" class="form-control" rows="2"></textarea>
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
                    <input type="number" formControlName="dias_credito" class="form-control" (keypress)="validateNoNegative($event)">
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
                      [disabled]="clienteForm.invalid || (cliente && !hasChanges) || loading" 
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

    constructor(private fb: FormBuilder) {
        this.clienteForm = this.fb.group({
            identificacion: ['', [Validators.required, SriValidators.identificacionEcuador()]],
            tipo_identificacion: ['CEDULA', [Validators.required]],
            razon_social: ['', [Validators.required, Validators.minLength(3)]],
            nombre_comercial: [''],
            email: ['', [Validators.required, Validators.email]],
            telefono: ['', [Validators.pattern(/^\d{10}$/)]],
            direccion: [''],
            ciudad: [''],
            provincia: [''],
            dias_credito: [0, [Validators.min(0)]],
            limite_credito: [0.0, [Validators.min(0)]],
            activo: [true]
        });

        // Dynamic validation based on type
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
    }

    ngOnInit() {
        document.body.style.overflow = 'hidden';
        if (this.cliente) {
            this.clienteForm.patchValue(this.cliente);
        }
    }

    ngOnDestroy() {
        document.body.style.overflow = 'auto';
    }

    submit() {
        if (this.clienteForm.valid) {
            const { pais, ...data } = this.clienteForm.value;
            this.onSave.emit(data);
        }
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

    get hasChanges(): boolean {
        if (!this.cliente) return true;
        const formValue = this.clienteForm.value;
        const fields = Object.keys(this.clienteForm.controls);
        
        for (const field of fields) {
            const initialValue = (this.cliente as any)[field];
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

    close() {
        if (!this.loading) {
            this.onClose.emit();
        }
    }
}

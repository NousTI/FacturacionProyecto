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
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-lux-container" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-lux-header">
          <div>
            <h2 class="modal-lux-title">{{ cliente ? 'Editar Perfil' : 'Nuevo Cliente' }}</h2>
            <p class="modal-lux-subtitle">Completa la información legal y de contacto</p>
          </div>
          <button (click)="close()" class="btn-close-lux" [disabled]="loading">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-lux-body scroll-custom">
          <form [formGroup]="clienteForm" (ngSubmit)="submit()">
            
            <!-- IDENTIFICACIÓN -->
            <div class="lux-form-section">
              <h3 class="lux-section-header">Identificación Legal</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="lux-label">Tipo de documento *</label>
                  <select formControlName="tipo_identificacion" class="lux-select">
                    <option value="CEDULA">Cédula</option>
                    <option value="RUC">RUC</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="lux-label">Número de identificación *</label>
                  <input 
                    type="text" 
                    formControlName="identificacion" 
                    class="lux-input" 
                    [class.is-invalid]="clienteForm.get('identificacion')?.invalid && clienteForm.get('identificacion')?.touched"
                    placeholder="Ej: 1712345678001"
                    (keypress)="validateNumbers($event)"
                    [maxlength]="clienteForm.get('tipo_identificacion')?.value === 'CEDULA' ? 10 : (clienteForm.get('tipo_identificacion')?.value === 'RUC' ? 13 : 20)"
                  >
                  <div class="error-feedback" *ngIf="clienteForm.get('identificacion')?.invalid && clienteForm.get('identificacion')?.touched">
                    <span *ngIf="clienteForm.get('identificacion')?.errors?.['required']">La identificación es obligatoria</span>
                    <span *ngIf="clienteForm.get('identificacion')?.errors?.['identificacionEcuador'] || clienteForm.get('identificacion')?.errors?.['rucEcuador']">
                        {{ clienteForm.get('identificacion')?.errors?.['message'] || 'Número de documento inválido' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- INFORMACIÓN GENERAL -->
            <div class="lux-form-section">
              <h3 class="lux-section-header">Razón Social y Comercial</h3>
              <div class="row g-3">
                <div class="col-12">
                  <label class="lux-label">Razón Social / Nombres Completos *</label>
                  <input type="text" formControlName="razon_social" class="lux-input" placeholder="Ej: Importadora Lux S.A.">
                </div>
                <div class="col-md-12">
                  <label class="lux-label">Nombre Comercial</label>
                  <input type="text" formControlName="nombre_comercial" class="lux-input" placeholder="Ej: Tienda Lux">
                </div>
              </div>
            </div>

            <!-- CONTACTO -->
            <div class="lux-form-section">
              <h3 class="lux-section-header">Información de Contacto</h3>
              <div class="row g-3">
                <div class="col-md-7">
                  <label class="lux-label">Correo Electrónico *</label>
                  <input type="email" formControlName="email" class="lux-input" placeholder="cliente@ejemplo.com">
                </div>
                <div class="col-md-5">
                  <label class="lux-label">Teléfono</label>
                  <input 
                    type="text" 
                    formControlName="telefono" 
                    class="lux-input" 
                    [class.is-invalid]="clienteForm.get('telefono')?.invalid && clienteForm.get('telefono')?.touched"
                    placeholder="Ej: 0987654321"
                    (keypress)="validateNumbers($event)"
                    maxlength="10"
                  >
                  <div class="error-feedback" *ngIf="clienteForm.get('telefono')?.invalid && clienteForm.get('telefono')?.touched">
                    <span *ngIf="clienteForm.get('telefono')?.errors?.['pattern']">Debe tener exactamente 10 números</span>
                  </div>
                </div>
                <div class="col-12">
                  <label class="lux-label">Dirección Fiscal / Residencia</label>
                  <input type="text" formControlName="direccion" class="lux-input" placeholder="Av. Principal N23 y Calle B">
                </div>
              </div>
            </div>

            <!-- CRÉDITO -->
            <div class="lux-form-section border-0 mb-0 pb-0">
               <h3 class="lux-section-header">Condiciones de Crédito</h3>
               <div class="row g-3 align-items-center">
                  <div class="col-md-6">
                    <label class="lux-label">Límite de Crédito Autorizado ($)</label>
                    <div class="lux-input-group">
                      <span class="prefix">$</span>
                      <input type="number" formControlName="limite_credito" class="lux-input ps-4" placeholder="0.00">
                    </div>
                  </div>
                  <div class="col-md-6">
                    <label class="lux-label">Días de Crédito Plazo</label>
                    <input type="number" formControlName="dias_credito" class="lux-input" placeholder="0">
                  </div>
               </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="modal-lux-footer">
          <div class="d-flex align-items-center gap-3 w-100">
            <!-- Poner el switch dentro de un div que esté vinculado al form si es necesario, 
                 pero mover el cierre del form es más limpio para que todo sea parte del mismo grupo -->
            <div class="form-check form-switch lux-switch mb-0" [formGroup]="clienteForm">
              <input class="form-check-input" type="checkbox" formControlName="activo" id="activoCheck">
              <label class="form-check-label ms-2" for="activoCheck">Cliente Habilitado</label>
            </div>
            
            <div class="ms-auto d-flex gap-3">
              <button (click)="close()" class="btn-lux-outline" [disabled]="loading">Cancelar</button>
              <button (click)="submit()" 
                      [disabled]="clienteForm.invalid || (cliente && clienteForm.pristine) || loading" 
                      class="btn-lux-submit">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Guardando...' : (cliente ? 'Guardar Cambios' : 'Crear Cliente') }}
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
      background: white;
      width: 720px;
      max-width: 95vw;
      max-height: 90vh;
      border-radius: 32px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 40px 100px -20px rgba(15, 23, 42, 0.2);
    }

    .modal-lux-header {
      padding: 2rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #f1f5f9;
    }

    .modal-lux-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .modal-lux-subtitle {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 0.25rem 0 0 0;
      font-weight: 500;
    }

    .btn-close-lux {
      background: #f8fafc;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-close-lux:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .modal-lux-body {
      padding: 2rem 2.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .lux-form-section {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .lux-section-header {
      font-size: 0.85rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1.5rem;
    }

    .lux-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.6rem;
      display: block;
    }

    .lux-input, .lux-select {
      width: 100%;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      padding: 0.75rem 1.25rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      transition: all 0.2s;
    }

    .lux-input:focus, .lux-select:focus {
      background: white;
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
      outline: none;
    }

    .lux-input-group {
      position: relative;
      display: flex;
      align-items: center;
    }

    .lux-input-group .prefix {
      position: absolute;
      left: 1.25rem;
      font-weight: 700;
      color: #94a3b8;
      font-size: 0.95rem;
    }

    .modal-lux-footer {
      padding: 1.5rem 2.5rem;
      background: white;
      border-top: 1px solid #f1f5f9;
    }

    .btn-lux-submit {
      background: #161d35;
      color: white;
      border: none;
      padding: 0.85rem 2rem;
      border-radius: 16px;
      font-weight: 800;
      font-size: 0.9rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-lux-submit:hover:not(:disabled) {
      background: #232d4b;
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3);
    }

    .btn-lux-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-lux-outline {
      background: white;
      color: #64748b;
      border: 1px solid #f1f5f9;
      padding: 0.85rem 1.75rem;
      border-radius: 16px;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .btn-lux-outline:hover:not(:disabled) {
      background: #f8fafc;
      color: #1e293b;
      border-color: #cbd5e1;
    }

    .lux-switch .form-check-input {
      width: 3.2rem;
      height: 1.6rem;
      cursor: pointer;
    }

    .lux-switch .form-check-input:checked {
      background-color: #111827;
      border-color: #111827;
    }

    .lux-switch .form-check-label {
      font-size: 0.9rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      line-height: 1.6rem;
    }

    .lux-input.is-invalid {
      border-color: #ef4444 !important;
      background: #fef2f2;
    }

    .error-feedback {
      font-size: 0.75rem;
      color: #ef4444;
      font-weight: 700;
      margin-top: 0.4rem;
      display: block;
      text-transform: uppercase;
    }

    .scroll-custom::-webkit-scrollbar { width: 6px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
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

    validateNumbers(event: KeyboardEvent) {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
        }
    }

    close() {
        if (!this.loading) {
            this.onClose.emit();
        }
    }
}

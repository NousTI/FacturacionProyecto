import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Cliente } from '../../../../../domain/models/cliente.model';

@Component({
    selector: 'app-create-cliente-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <h2 class="modal-title-final">{{ cliente ? 'Editar Cliente' : 'Registro de Cliente' }}</h2>
          <button (click)="close()" class="btn-close-final" [disabled]="loading">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          <form [formGroup]="clienteForm" (ngSubmit)="submit()">
            
            <!-- IDENTIFICACIÓN -->
            <div class="form-section-final">
              <h3 class="section-header-final">Identificación Legal</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-final">Tipo de Identificación *</label>
                  <select formControlName="tipo_identificacion" class="select-final">
                    <option value="CEDULA">Cédula</option>
                    <option value="RUC">RUC</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Identificación *</label>
                  <input 
                    type="text" 
                    formControlName="identificacion" 
                    class="input-final" 
                    [class.is-invalid]="clienteForm.get('identificacion')?.invalid && clienteForm.get('identificacion')?.touched"
                    placeholder="Ej: 1712345678001"
                  >
                  <div class="error-feedback" *ngIf="clienteForm.get('identificacion')?.invalid && clienteForm.get('identificacion')?.touched">
                    Identificación es requerida
                  </div>
                </div>
              </div>
            </div>

            <!-- INFORMACIÓN GENERAL -->
            <div class="form-section-final">
              <h3 class="section-header-final">Datos Generales</h3>
              <div class="row g-3">
                <div class="col-12">
                  <label class="label-final">Razón Social / Nombres Completos *</label>
                  <input type="text" formControlName="razon_social" class="input-final" placeholder="Ej: Juan Perez o Empresa S.A.">
                  <div class="error-feedback" *ngIf="clienteForm.get('razon_social')?.invalid && clienteForm.get('razon_social')?.touched">
                    Razón social es requerida
                  </div>
                </div>
                <div class="col-md-12">
                  <label class="label-final">Nombre Comercial</label>
                  <input type="text" formControlName="nombre_comercial" class="input-final" placeholder="Ej: Tienda de Juan">
                </div>
              </div>
            </div>

            <!-- CONTACTO Y UBICACIÓN -->
            <div class="form-section-final">
              <h3 class="section-header-final">Contacto & Ubicación</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-final">Email *</label>
                  <input type="email" formControlName="email" class="input-final" placeholder="ejemplo@correo.com">
                  <div class="error-feedback" *ngIf="clienteForm.get('email')?.invalid && clienteForm.get('email')?.touched">
                    Email válido es requerido
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Teléfono</label>
                  <input type="text" formControlName="telefono" class="input-final" placeholder="Ej: 0999999999">
                </div>
                <div class="col-12">
                  <label class="label-final">Dirección</label>
                  <input type="text" formControlName="direccion" class="input-final" placeholder="Calle A y Calle B">
                </div>
                <div class="col-md-4">
                  <label class="label-final">Ciudad</label>
                  <input type="text" formControlName="ciudad" class="input-final" placeholder="Quito">
                </div>
                <div class="col-md-4">
                  <label class="label-final">Provincia</label>
                  <input type="text" formControlName="provincia" class="input-final" placeholder="Pichincha">
                </div>
                <div class="col-md-4">
                  <label class="label-final">País</label>
                  <input type="text" formControlName="pais" class="input-final" placeholder="Ecuador">
                </div>
              </div>
            </div>

            <!-- CRÉDITO -->
            <div class="form-section-final border-0 mb-0 pb-0">
               <h3 class="section-header-final">Condiciones de Crédito</h3>
               <div class="row g-3 align-items-center">
                  <div class="col-md-4">
                    <label class="label-final">Límite de Crédito ($)</label>
                    <input type="number" formControlName="limite_credito" class="input-final" placeholder="0.00">
                  </div>
                  <div class="col-md-4">
                    <label class="label-final">Días de Crédito</label>
                    <input type="number" formControlName="dias_credito" class="input-final" placeholder="0">
                  </div>
                  <div class="col-md-4">
                    <div class="form-check form-switch mt-4 switch-final">
                       <input class="form-check-input" type="checkbox" formControlName="activo" id="activoCheck">
                       <label class="form-check-label ms-2" for="activoCheck">Cliente Activo</label>
                    </div>
                  </div>
               </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="close()" class="btn-cancel-final" [disabled]="loading">Cancelar</button>
          <button (click)="submit()" 
                  [disabled]="clienteForm.invalid || (cliente && clienteForm.pristine) || loading" 
                  class="btn-submit-final d-flex align-items-center gap-2">
            <span *ngIf="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ loading ? 'Guardando...' : (cliente ? 'Guardar Cambios' : 'Crear Cliente') }}
          </button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 1rem;
    }
    .modal-container-final {
      background: #ffffff; width: 700px;
      max-width: 95vw; max-height: 90vh; border-radius: 28px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final {
      padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center;
    }
    .modal-title-final {
      font-size: 1.25rem; font-weight: 800; color: #161d35; margin: 0;
    }
    .btn-close-final {
      background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer;
    }
    .modal-body-final {
      padding: 0 2.5rem 2rem; overflow-y: auto; flex: 1;
    }
    .form-section-final {
      margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9;
    }
    .section-header-final {
      font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 1.25rem;
    }
    .label-final {
      font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; display: block;
    }
    .input-final, .select-final {
      width: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 0.75rem 1.25rem; font-size: 0.9rem; color: #475569; font-weight: 600;
      transition: all 0.2s;
    }
    .input-final:focus, .select-final:focus {
      border-color: #161d35; outline: none; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    .modal-footer-final {
      padding: 1.25rem 2.5rem; background: #ffffff; display: flex; justify-content: flex-end; gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-submit-final {
      background: #161d35; color: #ffffff; border: none; padding: 0.75rem 2rem; border-radius: 12px;
      font-weight: 700; transition: all 0.2s;
    }
    .btn-submit-final:hover:not(:disabled) {
      background: #232d4d; transform: translateY(-1px);
    }
    .btn-submit-final:disabled {
      opacity: 0.5; cursor: not-allowed;
    }
    .btn-cancel-final {
      background: #ffffff; color: #64748b; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem;
      border-radius: 12px; font-weight: 600;
    }
    .error-feedback { color: #ef4444; font-size: 0.75rem; font-weight: 700; margin-top: 0.35rem; }
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .switch-final .form-check-input:checked { background-color: #161d35; border-color: #161d35; }
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
            identificacion: ['', [Validators.required]],
            tipo_identificacion: ['CEDULA', [Validators.required]],
            razon_social: ['', [Validators.required, Validators.minLength(3)]],
            nombre_comercial: [''],
            email: ['', [Validators.required, Validators.email]],
            telefono: [''],
            direccion: [''],
            ciudad: [''],
            provincia: [''],
            pais: ['Ecuador'],
            dias_credito: [0, [Validators.min(0)]],
            limite_credito: [0.0, [Validators.min(0)]],
            activo: [true]
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
            this.onSave.emit(this.clienteForm.value);
        }
    }

    close() {
        if (!this.loading) {
            this.onClose.emit();
        }
    }
}

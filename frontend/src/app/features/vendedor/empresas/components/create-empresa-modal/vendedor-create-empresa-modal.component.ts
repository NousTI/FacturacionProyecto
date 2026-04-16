import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { VendedorEmpresaService } from '../../services/vendedor-empresa.service';
import { SriValidators } from '../../../../../shared/utils/sri-validators';
import { SRI_TIPOS_PERSONA, SRI_TIPOS_CONTRIBUYENTE } from '../../../../../core/constants/sri-iva.constants';

@Component({
    selector: 'app-vendedor-create-empresa-modal',
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <h2 class="modal-title-final">{{ empresa ? 'Edición Empresa' : 'Registro de Nueva Empresa' }}</h2>
          <button (click)="close()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          <form [formGroup]="empresaForm" (ngSubmit)="submit()">
            
            <!-- INFORMACIÓN LEGAL -->
            <div class="form-section-final">
              <h3 class="section-header-final">Información Legal</h3>
              <div class="row g-3">
                <div class="col-12">
                  <label class="label-final">Razón Social * <span *ngIf="empresa" class="text-muted small ms-1">(Solo lectura)</span></label>
                  <input type="text" formControlName="razon_social" class="input-final" 
                    [class.is-invalid]="empresaForm.get('razon_social')?.invalid && empresaForm.get('razon_social')?.touched"
                    [class.bg-light]="empresa"
                    [class.opacity-75]="empresa"
                    placeholder="Ej: EMPRESA XYZ S.A."
                    [readonly]="empresa">
                  <div class="error-feedback" *ngIf="empresaForm.get('razon_social')?.invalid && empresaForm.get('razon_social')?.touched">
                    La razón social es obligatoria (mín. 3 caracteres)
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Nombre Comercial *</label>
                  <input type="text" formControlName="nombre_comercial" class="input-final" 
                    [class.is-invalid]="empresaForm.get('nombre_comercial')?.invalid && empresaForm.get('nombre_comercial')?.touched"
                    placeholder="Ej: XYZ Store">
                  <div class="error-feedback" *ngIf="empresaForm.get('nombre_comercial')?.invalid && empresaForm.get('nombre_comercial')?.touched">
                    Nombre comercial obligatorio (mín. 3)
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="label-final">RUC <span class="text-muted small ms-1">(Solo lectura)</span></label>
                  <input 
                    type="text" 
                    formControlName="ruc" 
                    class="input-final bg-light opacity-75" 
                    [class.is-invalid]="empresaForm.get('ruc')?.invalid && empresaForm.get('ruc')?.touched"
                    placeholder="1234567890001"
                    maxlength="13"
                    (keypress)="onlyNumbers($event)"
                    readonly
                  >
                  <div class="error-feedback" *ngIf="empresaForm.get('ruc')?.invalid && empresaForm.get('ruc')?.touched">
                    {{ empresaForm.get('ruc')?.hasError('required') ? 'El RUC es obligatorio' : (empresaForm.get('ruc')?.errors?.['message'] || 'RUC inválido') }}
                  </div>
                  <span class="hint-final" *ngIf="!empresaForm.get('ruc')?.touched">13 dígitos</span>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Tipo de Persona *</label>
                  <select formControlName="tipo_persona" class="select-final" 
                    [class.is-invalid]="empresaForm.get('tipo_persona')?.invalid && empresaForm.get('tipo_persona')?.touched">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let t of tiposPersona" [value]="t.code">{{ t.label }}</option>
                  </select>
                  <div class="error-feedback" *ngIf="empresaForm.get('tipo_persona')?.invalid && empresaForm.get('tipo_persona')?.touched">
                    Debe seleccionar el tipo de persona
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Régimen Tributario *</label>
                  <select formControlName="tipo_contribuyente" class="select-final"
                    [class.is-invalid]="empresaForm.get('tipo_contribuyente')?.invalid && empresaForm.get('tipo_contribuyente')?.touched">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let t of tiposContribuyente" [value]="t.code">{{ t.label }}</option>
                  </select>
                  <div class="error-feedback" *ngIf="empresaForm.get('tipo_contribuyente')?.invalid && empresaForm.get('tipo_contribuyente')?.touched">
                    Debe seleccionar un régimen
                  </div>
                </div>
                <div class="col-12">
                  <label class="label-final">Dirección Principal *</label>
                  <input type="text" formControlName="direccion" class="input-final" 
                    [class.is-invalid]="empresaForm.get('direccion')?.invalid && empresaForm.get('direccion')?.touched"
                    placeholder="Av. Principal N24-123 y Calle B">
                  <div class="error-feedback" *ngIf="empresaForm.get('direccion')?.invalid && empresaForm.get('direccion')?.touched">
                    Dirección obligatoria (mín. 5 caracteres)
                  </div>
                </div>
              </div>
            </div>

            <!-- INFORMACIÓN DE CONTACTO -->
            <div class="form-section-final">
              <h3 class="section-header-final">Información de Contacto</h3>
              <div class="row g-3">
                <div class="col-md-7">
                  <label class="label-final">Correo Electrónico *</label>
                  <input type="email" formControlName="email" class="input-final" 
                    [class.is-invalid]="empresaForm.get('email')?.invalid && empresaForm.get('email')?.touched"
                    placeholder="ejemplo@empresa.com">
                  <div class="error-feedback" *ngIf="empresaForm.get('email')?.invalid && empresaForm.get('email')?.touched">
                    {{ empresaForm.get('email')?.hasError('required') ? 'El correo es obligatorio' : 'Ingrese un correo electrónico válido' }}
                  </div>
                </div>
                <div class="col-md-5">
                  <label class="label-final">Teléfono *</label>
                  <input 
                    type="text" 
                    formControlName="telefono" 
                    class="input-final" 
                    [class.is-invalid]="empresaForm.get('telefono')?.invalid && empresaForm.get('telefono')?.touched"
                    placeholder="0999999999"
                    maxlength="10"
                    inputmode="numeric"
                    (keypress)="onlyNumbers($event)"
                  >
                  <div class="error-feedback" *ngIf="empresaForm.get('telefono')?.hasError('required') && empresaForm.get('telefono')?.touched">
                    El teléfono es obligatorio
                  </div>
                  <div class="error-feedback" *ngIf="empresaForm.get('telefono')?.hasError('pattern') && empresaForm.get('telefono')?.touched">
                    Debe empezar con 09 y tener 10 dígitos
                  </div>
                  <span class="hint-final" *ngIf="!empresaForm.get('telefono')?.touched">Ej: 0912345678</span>
                </div>
              </div>
            </div>

            <!-- CONFIGURACIÓN ADICIONAL -->
            <div class="form-section-final">
               <h3 class="section-header-final">Configuración</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="form-check form-switch switch-final mt-2">
                    <input class="form-check-input" type="checkbox" formControlName="obligado_contabilidad" id="obligadoCheck">
                    <label class="form-check-label ms-2" for="obligadoCheck">Obligado Contabilidad</label>
                  </div>
                </div>
              </div>
            </div>

             <!-- SUSCRIPCIÓN Y PAGO (Solo en creación) -->
            <div class="form-section-final border-0 mb-0 pb-0" *ngIf="!empresa">
              <h3 class="section-header-final">Suscripción y Pago Inicial</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-final">Plan de Suscripción *</label>
                  <select formControlName="plan_id" class="select-final" (change)="onPlanChange()"
                    [class.is-invalid]="empresaForm.get('plan_id')?.invalid && empresaForm.get('plan_id')?.touched">
                    <option value="">Seleccionar plan...</option>
                    <option *ngFor="let plan of planes" [value]="plan.id">
                      {{ plan.nombre }} - {{ plan.precio_anual | currency }} / año
                    </option>
                  </select>
                  <div class="error-feedback" *ngIf="empresaForm.get('plan_id')?.invalid && empresaForm.get('plan_id')?.touched">
                    Debe seleccionar un plan
                  </div>
                </div>
                 <div class="col-md-6">
                  <label class="label-final">Monto Pago Inicial (Solo lectura)</label>
                  <input type="number" formControlName="monto_pago" class="input-final bg-light opacity-75" 
                    [class.is-invalid]="empresaForm.get('monto_pago')?.invalid && empresaForm.get('monto_pago')?.touched"
                    placeholder="0.00"
                    readonly>
                  <div class="error-feedback" *ngIf="empresaForm.get('monto_pago')?.invalid && empresaForm.get('monto_pago')?.touched">
                    Monto inválido (mín. 0)
                  </div>
                </div>

                <!-- Estado de pago fijo como PENDIENTE para vendedores -->
                <div class="col-md-6">
                  <label class="label-final">Estado de Pago</label>
                  <div class="input-final bg-light opacity-75 d-flex align-items-center gap-2" style="cursor:default;">
                    <i class="bi bi-clock-history text-warning"></i>
                    <span class="fw-bold text-warning">PENDIENTE</span>
                  </div>
                </div>

              </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="close()" class="btn-cancel-final">Cancelar</button>
          <button (click)="submit()" [disabled]="empresaForm.invalid || (empresa && empresaForm.pristine)" class="btn-submit-final">
            {{ empresa ? 'Guardar Cambios' : 'Crear Empresa' }}
          </button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 53, 0.4);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    }
    .modal-container-final {
      background: #ffffff;
      width: 780px;
      height: 750px;
      max-width: 95vw;
      max-height: 90vh;
      border-radius: 28px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final {
      padding: 1.5rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-title-final {
      font-size: 1.25rem;
      font-weight: 800;
      color: #161d35;
      margin: 0;
    }
    .btn-close-final {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
    }
    .modal-body-final {
      padding: 0 2.5rem 2rem;
      overflow-y: auto;
      flex: 1;
    }
    .form-section-final {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .section-header-final {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 1.5rem;
    }
    .label-final {
      font-size: 0.85rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.6rem;
      display: block;
    }
    .input-final, .select-final {
      width: 100%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem 1.5rem;
      font-size: 0.95rem;
      color: #475569;
      font-weight: 600;
      transition: all 0.2s;
    }
    .input-final::placeholder {
      color: #94a3b8;
      font-weight: 600;
    }
    .input-final:focus, .select-final:focus {
      outline: none;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    .input-final.is-invalid, .select-final.is-invalid {
      border-color: #ef4444 !important;
      background-color: #fef2f2 !important;
    }
    .input-final.is-invalid:focus, .select-final.is-invalid:focus {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
    }
    .hint-final {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.4rem;
      padding-left: 1rem;
    }
    .modal-footer-final {
      padding: 1.5rem 2.5rem;
      background: #ffffff;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-submit-final {
      background: #161d35;
      color: #ffffff;
      border: none;
      padding: 0.75rem 2.5rem;
      border-radius: 12px;
      font-weight: 700;
      transition: all 0.2s;
    }
    .btn-submit-final:hover:not(:disabled) {
      background: #232d4d;
      transform: translateY(-1px);
    }
    .btn-submit-final:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .btn-cancel-final {
      background: #ffffff;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 2rem;
      border-radius: 12px;
      font-weight: 600;
    }
    .switch-final .form-check-input:checked {
      background-color: #161d35;
      border-color: #161d35;
    }
    .switch-final .form-check-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
    }
    .scroll-custom::-webkit-scrollbar {
      width: 5px;
    }
    .scroll-custom::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }
    .input-final.is-invalid {
      border-color: #ef4444;
      background: #fffcfc;
    }
    .error-feedback {
      color: #ef4444;
      font-size: 0.75rem;
      font-weight: 700;
      margin-top: 0.4rem;
      padding-left: 0.5rem;
    }
  `],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule]
})
export class VendedorCreateEmpresaModalComponent implements OnInit, OnDestroy {
    @Input() empresa: any = null;
    @Output() onSave = new EventEmitter<any>();
    @Output() onClose = new EventEmitter<void>();

    empresaForm: FormGroup;
    planes: any[] = [];
    tiposPersona = SRI_TIPOS_PERSONA;
    tiposContribuyente = SRI_TIPOS_CONTRIBUYENTE;

    constructor(
        private fb: FormBuilder,
        private vendedorEmpresaService: VendedorEmpresaService
    ) {
        this.empresaForm = this.fb.group({
            ruc: ['', [SriValidators.rucEcuador()]],
            razon_social: ['', [Validators.required, Validators.minLength(3)]],
            nombre_comercial: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            telefono: ['', [Validators.required, Validators.pattern(/^09[0-9]{8}$/)]],
            direccion: ['', [Validators.required, Validators.minLength(5)]],
            tipo_persona: ['', Validators.required],
            tipo_contribuyente: ['', Validators.required],
            obligado_contabilidad: [false],
            plan_id: ['', Validators.required],
            activo: [true],
            monto_pago: [0, [Validators.required, Validators.min(0)]],
            estado_pago: ['PENDIENTE'],
            metodo_pago: [null],
            numero_comprobante: [null],
            observacion_pago: ['', [Validators.maxLength(250)]]
        });
    }

    ngOnInit() {
        document.body.style.overflow = 'hidden';
        this.loadCatalogs();

            if (this.empresa) {
                this.empresaForm.patchValue({
                    ...this.empresa,
                    razon_social: this.empresa.razon_social || this.empresa.razonSocial,
                    tipo_persona: this.empresa.tipo_persona || 'NATURAL'
                });
            // Deactivate plan fields on edit
            this.empresaForm.get('plan_id')?.clearValidators();
            this.empresaForm.get('plan_id')?.updateValueAndValidity();
        }
    }

    loadCatalogs() {
        this.vendedorEmpresaService.getPlanes().subscribe(data => this.planes = data);
    }

    ngOnDestroy() {
        document.body.style.overflow = 'auto';
    }

    onlyNumbers(event: any) {
        const pattern = /[0-9]/;
        const inputChar = String.fromCharCode(event.charCode);
        if (!pattern.test(inputChar)) {
            event.preventDefault();
        }
    }

    onPlanChange() {
        if (this.empresa) return;
        const planId = this.empresaForm.get('plan_id')?.value;
        const selectedPlan = this.planes.find(p => p.id == planId);
        if (selectedPlan) {
            this.empresaForm.patchValue({
                monto_pago: selectedPlan.precio_anual || 0,
                observacion_pago: `Suscripción inicial al plan ${selectedPlan.nombre}`
            });
        }
    }

    submit() {
        if (this.empresaForm.valid) {
            this.onSave.emit({
                id: this.empresa?.id,
                ...this.empresaForm.value
            });
        } else {
            this.empresaForm.markAllAsTouched();
        }
    }

    close() {
        this.onClose.emit();
    }
}

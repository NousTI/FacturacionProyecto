import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmpresaService } from '../../services/empresa.service';
import { SriValidators } from '../../../../../../shared/utils/sri-validators';

@Component({
  selector: 'app-create-empresa-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <h2 class="modal-title-final">Registro de Empresa</h2>
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
                  <label class="label-final">Razón Social *</label>
                  <input type="text" formControlName="razon_social" class="input-final" placeholder="Ej: EMPRESA XYZ S.A.">
                </div>
                <div class="col-md-6">
                  <label class="label-final">Nombre Comercial</label>
                  <input type="text" formControlName="nombre_comercial" class="input-final" placeholder="Ej: XYZ Store">
                  <span class="hint-final">Opcional</span>
                </div>
                <div class="col-md-6">
                  <label class="label-final">RUC *</label>
                  <input 
                    type="text" 
                    formControlName="ruc" 
                    class="input-final" 
                    [class.is-invalid]="empresaForm.get('ruc')?.invalid && empresaForm.get('ruc')?.touched && empresaForm.get('ruc')?.value"
                    placeholder="1234567890001"
                    maxlength="13"
                    (keypress)="onlyNumbers($event)"
                  >
                  <div class="error-feedback" *ngIf="empresaForm.get('ruc')?.invalid && empresaForm.get('ruc')?.touched && empresaForm.get('ruc')?.value">
                    {{ empresaForm.get('ruc')?.errors?.['message'] || 'RUC inválido' }}
                  </div>
                  <span class="hint-final" *ngIf="!empresaForm.get('ruc')?.touched">13 dígitos</span>
                </div>
                <div class="col-md-12">
                  <label class="label-final">Tipo de Contribuyente *</label>
                  <select formControlName="tipo_contribuyente" class="select-final">
                    <option value="">Seleccionar...</option>
                    <option value="PERSONA_NATURAL">Persona Natural</option>
                    <option value="PERSONA_JURIDICA">Persona Juridica</option>
                    <option value="RIMPE_NEGOCIO_POPULAR">RIMPE - Negocio Popular</option>
                    <option value="RIMPE_EMPRENDEDOR">RIMPE - Emprendedor</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="label-final">Dirección Principal *</label>
                  <input type="text" formControlName="direccion" class="input-final" placeholder="Av. Principal N24-123 y Calle B">
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
                    [class.is-invalid]="empresaForm.get('email')?.invalid && empresaForm.get('email')?.touched && empresaForm.get('email')?.value"
                    placeholder="ejemplo@empresa.com">
                  <div class="error-feedback" *ngIf="empresaForm.get('email')?.invalid && empresaForm.get('email')?.touched && empresaForm.get('email')?.value">
                    Ingrese un correo electrónico válido
                  </div>
                </div>
                <div class="col-md-5">
                  <label class="label-final">Teléfono</label>
                  <input 
                    type="text" 
                    formControlName="telefono" 
                    class="input-final" 
                    [class.is-invalid]="empresaForm.get('telefono')?.invalid && empresaForm.get('telefono')?.touched && empresaForm.get('telefono')?.value"
                    placeholder="0999999999"
                    maxlength="10"
                    (keypress)="onlyNumbers($event)"
                  >
                  <div class="error-feedback" *ngIf="empresaForm.get('telefono')?.invalid && empresaForm.get('telefono')?.touched && empresaForm.get('telefono')?.value">
                    El teléfono debe tener 10 dígitos
                  </div>
                  <span class="hint-final" *ngIf="!empresaForm.get('telefono')?.touched">10 dígitos</span>
                </div>
              </div>
            </div>

            <!-- CONFIGURACIÓN ADICIONAL -->
            <div class="form-section-final">
               <h3 class="section-header-final">Configuración</h3>
              <div class="row g-3">
                 <div class="col-md-6">
                  <label class="label-final">Vendedor Asignado</label>
                  <select formControlName="vendedor_id" class="select-final">
                    <option [ngValue]="null">Gestión Directa</option>
                    <option *ngFor="let vendedor of vendedores" [value]="vendedor.id">
                      {{ vendedor.nombres }} {{ vendedor.apellidos }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <div class="form-check form-switch switch-final mt-2">
                    <input class="form-check-input" type="checkbox" formControlName="obligado_contabilidad" id="obligadoCheck">
                    <label class="form-check-label ms-2" for="obligadoCheck">Obligado Contabilidad</label>
                  </div>
                   <div class="form-check form-switch switch-final mt-2">
                    <input class="form-check-input" type="checkbox" formControlName="activo" id="activoCheck">
                    <label class="form-check-label ms-2" for="activoCheck">Empresa Activa</label>
                  </div>
                </div>
              </div>
            </div>

             <!-- SUSCRIPCIÓN Y PAGO -->
            <div class="form-section-final border-0 mb-0 pb-0">
              <h3 class="section-header-final">Suscripción y Pago Inicial</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-final">Plan de Suscripción *</label>
                  <select formControlName="plan_id" class="select-final" (change)="onPlanChange()">
                    <option value="">Seleccionar plan...</option>
                    <option *ngFor="let plan of planes" [value]="plan.id">
                      {{ plan.nombre }} - {{ plan.precio_mensual | currency }}
                    </option>
                  </select>
                </div>
                 <div class="col-md-6">
                  <label class="label-final">Monto Pago Inicial</label>
                  <input type="number" formControlName="monto_pago" class="input-final" placeholder="0.00">
                </div>
                 <div class="col-12">
                  <label class="label-final">Observación del Pago</label>
                  <textarea formControlName="observacion_pago" class="input-final" rows="2" placeholder="Ej: Pago manual Superadmin"></textarea>
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="close()" class="btn-cancel-final">Cancelar</button>
          <button (click)="submit()" [disabled]="empresaForm.invalid" class="btn-submit-final">
            Crear Empresa
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
      width: 780px; /* 20% más ancho que 650px */
      height: 750px; /* Altura aumentada para nuevos campos */
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
      border-color: #161d35;
      outline: none;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
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
export class CreateEmpresaModalComponent implements OnInit, OnDestroy {
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  empresaForm: FormGroup;

  vendedores: any[] = [];
  planes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService
  ) {
    this.empresaForm = this.fb.group({
      ruc: ['', [Validators.required, SriValidators.rucEcuador()]],
      razon_social: ['', [Validators.required, Validators.minLength(3)]],
      nombre_comercial: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      vendedor_id: [null],
      tipo_contribuyente: ['', Validators.required],
      obligado_contabilidad: [false],
      plan_id: ['', Validators.required],
      activo: [true],
      monto_pago: [0],
      observacion_pago: ['']
    });
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.loadCatalogs();
  }

  loadCatalogs() {
    // Cargar Vendedores
    this.empresaService.getVendedores().subscribe({
      next: (data) => this.vendedores = data,
      error: (err) => console.error('Error loading vendedores', err)
    });

    // Cargar Planes
    this.empresaService.getPlanes().subscribe({
      next: (data) => this.planes = data,
      error: (err) => console.error('Error loading planes', err)
    });
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
    const planId = this.empresaForm.get('plan_id')?.value;
    const selectedPlan = this.planes.find(p => p.id == planId);

    if (selectedPlan) {
      this.empresaForm.patchValue({
        monto_pago: selectedPlan.precio_mensual || 0,
        observacion_pago: `Suscripción inicial al plan ${selectedPlan.nombre}`
      });
    }
  }

  submit() {
    if (this.empresaForm.valid) {
      this.onSave.emit(this.empresaForm.value);
    }
  }

  close() {
    this.onClose.emit();
  }
}

import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Plan, PlanCharacteristics } from '../../services/plan.service';

@Component({
  selector: 'app-plan-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <h2 class="modal-title-final">{{ isEdit ? 'Editar' : 'Nuevo' }} Plan de Suscripción</h2>
          <button (click)="close()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          <form [formGroup]="planForm" (ngSubmit)="submit()">
            
            <!-- INFORMACIÓN BÁSICA Y PRECIO -->
            <div class="form-section-final">
              <h3 class="section-header-final">Información Básica</h3>
              <div class="row g-3">
                <div class="col-md-12">
                  <label class="label-final">Nombre del Plan *</label>
                  <input type="text" formControlName="name" class="input-final" placeholder="Ej: Profesional, Enterprise...">
                </div>
                <div class="col-12">
                  <label class="label-final">Descripción</label>
                  <textarea formControlName="description" class="input-final" rows="2" placeholder="Breve detalle de los beneficios..."></textarea>
                </div>
                <div class="col-12">
                  <label class="label-final">Precio ($) *</label>
                  <input type="number" formControlName="price" class="input-final" placeholder="0.00" (keydown)="preventNegative($event)">
                </div>

              </div>
            </div>

            <!-- LÍMITES DEL PLAN -->
            <div class="form-section-final">
              <h3 class="section-header-final">Límites y Capacidades</h3>
              <div class="limits-grid">
                <div class="limit-card">
                  <label class="limit-name">USUARIOS MÁXIMOS</label>
                  <input type="number" formControlName="max_usuarios" class="input-final py-1 px-2" min="0" (keydown)="preventNegative($event)">
                </div>
                <div class="limit-card">
                  <label class="limit-name">FACTURAS / MES</label>
                  <input type="number" formControlName="max_facturas_mes" class="input-final py-1 px-2" min="0" (keydown)="preventNegative($event)">
                </div>
                <div class="limit-card">
                  <label class="limit-name">ESTABLECIMIENTOS</label>
                  <input type="number" formControlName="max_establecimientos" class="input-final py-1 px-2" min="0" (keydown)="preventNegative($event)">
                </div>
                <div class="limit-card">
                  <label class="limit-name">PROGRAMACIONES</label>
                  <input type="number" formControlName="max_programaciones" class="input-final py-1 px-2" min="0" (keydown)="preventNegative($event)">
                </div>
              </div>
            </div>

            <!-- CARACTERÍSTICAS INCLUIDAS -->
            <div class="form-section-final border-0 mb-0 pb-0">
               <h3 class="section-header-final">Características Premium</h3>
               <div class="features-wrapper" formGroupName="caracteristicas">
                  <div class="feature-item" *ngFor="let feat of featureKeys">
                    <div class="form-check form-switch switch-final">
                      <input class="form-check-input" type="checkbox" [formControlName]="feat.key" [id]="'feat-'+feat.key">
                      <label class="form-check-label ms-2" [for]="'feat-'+feat.key">{{ feat.label }}</label>
                    </div>
                  </div>
               </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="close()" [disabled]="saving" class="btn-cancel-final">Cancelar</button>
          <button (click)="submit()" [disabled]="planForm.invalid || saving || (isEdit && !planForm.dirty)" class="btn-submit-final d-flex align-items-center gap-2">
            <span *ngIf="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ saving ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Plan') }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;
    }
    .modal-container-final {
      background: #ffffff; width: 780px; max-width: 95vw; height: 800px; max-height: 95vh;
      border-radius: 28px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final { padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center; }
    .modal-title-final { font-size: 1.25rem; font-weight: 800; color: #161d35; margin: 0; }
    .btn-close-final { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    .modal-body-final { padding: 0 2.5rem 1rem; overflow-y: auto; flex: 1; }
    .form-section-final { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #f1f5f9; }
    .section-header-final { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem; }
    .label-final { font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 0.6rem; display: block; }
    .input-final, .select-final {
      width: 100%; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 0.75rem 1.5rem; font-size: 0.95rem; color: #475569; font-weight: 600; transition: all 0.2s;
    }
    .input-final:focus, .select-final:focus {
      border-color: #161d35; outline: none;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    .rounded-start-12 { border-radius: 12px 0 0 12px !important; }
    .limits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .limit-card { background: #f8fafc; padding: 1rem; border-radius: 16px; border: 1px solid #f1f5f9; }
    .limit-info { display: flex; flex-direction: column; gap: 0.5rem; }
    .limit-name { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
    .limit-unit { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
    .features-wrapper { display: flex; flex-wrap: wrap; gap: 1.25rem; }
    .feature-item { width: calc(50% - 0.75rem); }
    .modal-footer-final { padding: 1.5rem 2.5rem; background: #ffffff; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #f1f5f9; }
    .btn-submit-final {
      background: #161d35; color: #ffffff; border: none; padding: 0.75rem 2.5rem;
      border-radius: 12px; font-weight: 700; transition: all 0.2s;
    }
    .btn-submit-final:hover:not(:disabled) { background: #232d4d; transform: translateY(-1px); }
    .btn-submit-final:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-cancel-final { background: #ffffff; color: #64748b; border: 1px solid #e2e8f0; padding: 0.75rem 2rem; border-radius: 12px; font-weight: 600; }
    .switch-final .form-check-input:checked { background-color: #161d35; border-color: #161d35; }
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .input-final::placeholder { color: #94a3b8; font-weight: 600; }
    .hint-final { display: block; font-size: 0.75rem; color: #94a3b8; margin-top: 0.4rem; padding-left: 1rem; }
    .input-final.is-invalid { border-color: #ef4444; background: #fffcfc; }
    .error-feedback { color: #ef4444; font-size: 0.75rem; font-weight: 700; margin-top: 0.4rem; padding-left: 0.5rem; }
  `],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class PlanModalComponent implements OnInit, OnDestroy {
  @Input() plan: Plan | null = null;
  @Input() saving: boolean = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  planForm: FormGroup;
  isEdit: boolean = false;

  featureKeys = [
    { key: 'api_acceso', label: 'Acceso a API' },
    { key: 'multi_usuario', label: 'Multi-usuario' },
    { key: 'backup_automatico', label: 'Respaldo Automático' },
    { key: 'exportacion_datos', label: 'Exportación de Datos' },
    { key: 'reportes_avanzados', label: 'Reportes Avanzados' },
    { key: 'alertas_vencimiento', label: 'Alertas de Vencimiento' },
    { key: 'personalizacion_pdf', label: 'Personalización de PDF' },
    { key: 'soporte_prioritario', label: 'Soporte Prioritario' },
    { key: 'facturacion_electronica', label: 'Facturación Electrónica' }
  ];

  constructor(private fb: FormBuilder) {
    this.planForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [null, [Validators.required, Validators.min(0)]],

      max_usuarios: [1, [Validators.required, Validators.min(0)]],
      max_facturas_mes: [0, [Validators.required, Validators.min(0)]],
      max_establecimientos: [1, [Validators.required, Validators.min(0)]],
      max_programaciones: [0, [Validators.required, Validators.min(0)]],
      caracteristicas: this.fb.group({
        api_acceso: [true],
        multi_usuario: [true],
        backup_automatico: [true],
        exportacion_datos: [true],
        reportes_avanzados: [true],
        alertas_vencimiento: [true],
        personalizacion_pdf: [true],
        soporte_prioritario: [true],
        facturacion_electronica: [true]
      })
    });
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.isEdit = !!this.plan;
    if (this.plan) {
      this.planForm.patchValue({
        name: this.plan.name,
        description: this.plan.description,
        price: this.plan.price,

        max_usuarios: this.plan.max_usuarios,
        max_facturas_mes: this.plan.max_facturas_mes,
        max_establecimientos: this.plan.max_establecimientos,
        max_programaciones: this.plan.max_programaciones,
        caracteristicas: this.plan.caracteristicas
      });
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  submit() {
    if (this.planForm.invalid || (this.isEdit && !this.planForm.dirty)) return;
    this.onSave.emit(this.planForm.value);
  }

  preventNegative(event: KeyboardEvent) {
    if (event.key === '-' || event.key === 'e' || event.key === '+') {
      event.preventDefault();
    }
  }

  close() { this.onClose.emit(); }
}

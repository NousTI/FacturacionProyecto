import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Suscripcion } from '../../services/suscripcion.service';

@Component({
    selector: 'app-registro-pago-modal',
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <h2 class="modal-title-final">Registrar Pago</h2>
          <button (click)="close()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final" style="overflow-y: visible !important;">
          <form [formGroup]="pagoForm" (ngSubmit)="submit()">
            
            <div class="form-section-final border-0 mb-0 pb-0">
              <div class="alert alert-info d-flex align-items-center mb-4">
                  <i class="bi bi-info-circle-fill me-2 fs-5"></i>
                  <div>
                    Regristrando pago para <strong>{{ suscripcion?.empresa_nombre }}</strong>
                    <div class="small">Plan: {{ suscripcion?.plan_nombre }}</div>
                  </div>
              </div>

              <div class="row g-3">
                
                <div class="col-md-6">
                  <label class="label-final">Monto ($) *</label>
                  <input type="number" formControlName="monto" class="input-final" placeholder="0.00">
                </div>

                <div class="col-md-6">
                  <label class="label-final">Método de Pago *</label>
                  <select formControlName="metodo_pago" class="input-final">
                    <option value="" disabled>Seleccione...</option>
                    <option *ngFor="let m of metodosPago" [value]="m">{{ m }}</option>
                  </select>
                </div>

                <div class="col-md-12">
                   <label class="label-final">Número de Comprobante / Referencia *</label>
                   <input type="text" formControlName="numero_comprobante" class="input-final" placeholder="Ej: TR-123456789">
                </div>

                 <!-- Fechas del Periodo (Opcionales, backend might infer but better explicit to update sub logic) -->
                 <!-- If we want to support extending the subscription here, we might need start/end date inputs.
                      Backend 'PagoSuscripcionQuick' accepts fecha_inicio_periodo/fecha_fin_periodo. 
                      Let's add them or auto-calc. I'll add them as defaults to next month. 
                 -->
              </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="close()" [disabled]="saving" class="btn-cancel-final">Cancelar</button>
          <button (click)="submit()" [disabled]="pagoForm.invalid || saving" class="btn-submit-final d-flex align-items-center gap-2">
            <span *ngIf="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ saving ? 'Registrar Pago' : 'Confirmar' }}
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
      background: #ffffff; width: 600px; max-width: 95vw; height: auto;
      border-radius: 28px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final { padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center; }
    .modal-title-final { font-size: 1.25rem; font-weight: 800; color: #161d35; margin: 0; }
    .btn-close-final { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    .modal-body-final { padding: 0 2.5rem 1rem; flex: 1; } /* Removed overflow-y auto for small content */
    .form-section-final { margin-bottom: 2rem; padding-bottom: 0; }
    .label-final { font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 0.6rem; display: block; }
    .input-final {
      width: 100%; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 0.75rem 1.5rem; font-size: 0.95rem; color: #475569; font-weight: 600; transition: all 0.2s;
    }
    .input-final:focus {
      border-color: #161d35; outline: none;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    .alert-info {
        background-color: #eff6ff;
        border-color: #bfdbfe;
        color: #1e40af;
        border-radius: 12px;
        font-size: 0.9rem;
    }
    .modal-footer-final { padding: 1.5rem 2.5rem; background: #ffffff; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #f1f5f9; }
    .btn-submit-final {
      background: #161d35; color: #ffffff; border: none; padding: 0.75rem 2.5rem;
      border-radius: 12px; font-weight: 700; transition: all 0.2s;
    }
    .btn-submit-final:hover:not(:disabled) { background: #232d4d; transform: translateY(-1px); }
    .btn-submit-final:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-cancel-final { background: #ffffff; color: #64748b; border: 1px solid #e2e8f0; padding: 0.75rem 2rem; border-radius: 12px; font-weight: 600; }
  `],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule]
})
export class RegistroPagoModalComponent implements OnInit, OnDestroy {
    @Input() suscripcion: Suscripcion | null = null;
    @Input() saving: boolean = false;
    @Output() onSave = new EventEmitter<any>();
    @Output() onClose = new EventEmitter<void>();

    pagoForm: FormGroup;
    metodosPago = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE', 'OTRO'];

    constructor(private fb: FormBuilder) {
        this.pagoForm = this.fb.group({
            monto: [0, [Validators.required, Validators.min(0)]],
            metodo_pago: ['', Validators.required],
            numero_comprobante: ['', Validators.required]
        });
    }

    ngOnInit() {
        document.body.style.overflow = 'hidden';
        if (this.suscripcion) {
            this.pagoForm.patchValue({
                monto: this.suscripcion.precio_plan || 0
            });
        }
    }

    ngOnDestroy() {
        document.body.style.overflow = 'auto';
    }

    submit() {
        if (this.pagoForm.invalid) return;

        // Construct the payload expected by PagoQuick
        const payload = {
            empresa_id: this.suscripcion?.empresa_id,
            plan_id: this.suscripcion?.plan_id,
            ...this.pagoForm.value
        };
        this.onSave.emit(payload);
    }

    close() { this.onClose.emit(); }
}

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
          <h2 class="modal-title-final">Renovar / Cambiar Plan</h2>
          <button (click)="close()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final" style="overflow-y: visible !important;">
          <form [formGroup]="pagoForm" (ngSubmit)="submit()">
            
            <div class="form-section-final border-0 mb-0 pb-0">
              <!-- Company Info Banner -->
              <div class="company-banner mb-4">
                <div class="company-icon"><i class="bi bi-building"></i></div>
                <div>
                  <div class="fw-bold text-dark">{{ suscripcion?.empresa_nombre }}</div>
                  <div class="small text-muted">Plan actual: <strong>{{ suscripcion?.plan_nombre }}</strong></div>
                </div>
              </div>

              <div class="row g-3">

                <!-- Plan Selector -->
                <div class="col-md-12">
                  <label class="label-final">Plan a registrar *</label>
                  <select formControlName="plan_id" class="input-final" (change)="onPlanChange()">
                    <option *ngFor="let p of planes" [value]="p.id" [disabled]="isPlanDisabled(p.id)">
                      {{ getPlanLabel(p) }} — {{ p.precio_anual | currency:'USD':'symbol':'1.0-0' }}/año
                    </option>
                  </select>
                </div>

                <!-- Payment Status Toggle -->
                <div class="col-md-12 mb-2">
                  <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-light border">
                    <div class="d-flex align-items-center gap-3">
                      <div class="icon-payment" [class.active]="pagoRecibido">
                        <i class="bi" [class.bi-cash-coin]="pagoRecibido" [class.bi-hourglass-split]="!pagoRecibido"></i>
                      </div>
                      <div>
                        <div class="fw-bold text-dark">{{ pagoRecibido ? 'Pago Recibido' : 'Pago por Recibir (Pendiente)' }}</div>
                        <div class="small text-muted">{{ pagoRecibido ? 'Detalla la transacción abajo.' : 'Se generará una deuda en el sistema.' }}</div>
                      </div>
                    </div>
                    <div class="form-check form-switch fs-4">
                      <input class="form-check-input ms-0" type="checkbox" role="switch" [checked]="pagoRecibido" (change)="togglePagoRecibido()">
                    </div>
                  </div>
                </div>

                <div class="col-md-12">
                  <label class="label-final">Monto ($) *</label>
                  <input type="number" formControlName="monto" class="input-final" placeholder="0.00">
                </div>

                <ng-container *ngIf="pagoRecibido">
                  <div class="col-md-6 animate__animated animate__fadeIn">
                    <label class="label-final">Método de Pago *</label>
                    <select formControlName="metodo_pago" class="input-final">
                      <option value="" disabled>Seleccione...</option>
                      <option *ngFor="let m of metodosPago" [value]="m">{{ m }}</option>
                    </select>
                  </div>

                  <div class="col-md-6 animate__animated animate__fadeIn">
                     <label class="label-final">Nº Comprobante / Referencia *</label>
                     <input type="text" formControlName="numero_comprobante" class="input-final" placeholder="Ej: TR-123456789">
                  </div>
                </ng-container>

                <div class="col-md-12">
                   <label class="label-final">Observaciones</label>
                   <textarea formControlName="observaciones" class="input-final" rows="2" placeholder="Opcional..."></textarea>
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="close()" [disabled]="saving" class="btn-cancel-final">Cancelar</button>
          <button (click)="submit()" 
                  [disabled]="pagoForm.invalid || saving || isPlanDisabled(pagoForm.get('plan_id')?.value)" 
                  class="btn-submit-final d-flex align-items-center gap-2">
            <span *ngIf="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ saving ? 'Procesando...' : (pagoRecibido ? 'Registrar Pago' : 'Generar Deuda') }}
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
      background: #ffffff; width: 520px; max-width: 95vw; height: auto;
      border-radius: 28px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final { padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center; }
    .modal-title-final { font-size: 1.25rem; font-weight: 800; color: #161d35; margin: 0; }
    .btn-close-final { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    .modal-body-final { padding: 0 2.5rem 1rem; flex: 1; }
    .form-section-final { margin-bottom: 2rem; padding-bottom: 0; }
    .label-final { font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 0.6rem; display: block; }
    .input-final {
      width: 100%; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 0.75rem 1.5rem; font-size: 0.95rem; color: #475569; font-weight: 600; transition: all 0.2s;
      background: #ffffff;
    }
    .input-final:focus {
      border-color: #161d35; outline: none;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    .company-banner {
      display: flex; align-items: center; gap: 1rem;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem 1.25rem;
    }
    .company-icon {
      width: 42px; height: 42px; border-radius: 12px;
      background: #161d35; color: #ffffff;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
      flex-shrink: 0;
    }
    .icon-payment {
      width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      background: #f1f5f9; color: #94a3b8; font-size: 1.4rem; transition: all 0.2s;
    }
    .icon-payment.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }

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
    @Input() planes: any[] = [];
    @Input() saving: boolean = false;
    @Output() onSave = new EventEmitter<any>();
    @Output() onClose = new EventEmitter<void>();

    pagoForm: FormGroup;
    metodosPago = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE', 'OTRO'];
    pagoRecibido: boolean = true;

    constructor(private fb: FormBuilder) {
        this.pagoForm = this.fb.group({
            plan_id: ['', Validators.required],
            monto: [0, [Validators.required, Validators.min(0)]],
            metodo_pago: ['TRANSFERENCIA', Validators.required],
            numero_comprobante: ['', Validators.required],
            observaciones: ['']
        });
    }

    ngOnInit() {
        document.body.style.overflow = 'hidden';
        if (this.suscripcion) {
            this.pagoForm.patchValue({
                plan_id: this.suscripcion.plan_id || '',
                monto: this.suscripcion.precio_plan || 0
            });
        }
    }

    ngOnDestroy() {
        document.body.style.overflow = 'auto';
    }

    onPlanChange() {
        const selectedPlanId = this.pagoForm.get('plan_id')?.value;
        const selectedPlan = this.planes.find(p => p.id === selectedPlanId);
        if (selectedPlan) {
            this.pagoForm.patchValue({ monto: selectedPlan.precio_anual });
        }
    }

    get daysRemaining(): number {
        if (!this.suscripcion?.fecha_fin) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(this.suscripcion.fecha_fin);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    isPlanDisabled(planId: string): boolean {
        // Solo deshabilitar si es el plan actual Y faltan más de 30 días
        if (planId !== this.suscripcion?.plan_id) return false;
        return this.daysRemaining > 30;
    }

    getPlanLabel(p: any): string {
        const isCurrent = p.id === this.suscripcion?.plan_id;
        if (isCurrent && this.daysRemaining > 30) {
            return `${p.nombre} (Vigente - ${this.daysRemaining} días restantes)`;
        }
        return isCurrent ? `${p.nombre} (Plan actual - Renovable)` : p.nombre;
    }

    togglePagoRecibido() {
      this.pagoRecibido = !this.pagoRecibido;
      if (this.pagoRecibido) {
        this.pagoForm.get('metodo_pago')?.setValidators([Validators.required]);
        this.pagoForm.get('numero_comprobante')?.setValidators([Validators.required]);
      } else {
        this.pagoForm.get('metodo_pago')?.clearValidators();
        this.pagoForm.get('numero_comprobante')?.clearValidators();
      }
      this.pagoForm.get('metodo_pago')?.updateValueAndValidity();
      this.pagoForm.get('numero_comprobante')?.updateValueAndValidity();
    }

    submit() {
        if (this.pagoForm.invalid) return;

        const val = this.pagoForm.value;
        const payload = {
            empresa_id: this.suscripcion?.empresa_id,
            plan_id: val.plan_id,
            monto: val.monto,
            metodo_pago: this.pagoRecibido ? val.metodo_pago : 'PENDIENTE',
            numero_comprobante: this.pagoRecibido ? val.numero_comprobante : 'POR_RECIBIR',
            estado: this.pagoRecibido ? 'PAGADO' : 'PENDIENTE',
            observaciones: val.observaciones
        };
        this.onSave.emit(payload);
    }

    close() { this.onClose.emit(); }
}

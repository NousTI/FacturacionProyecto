import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendedorEmpresaService } from '../../services/vendedor-empresa.service';

@Component({
  selector: 'app-vendedor-change-plan-modal',
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-container-plan shadow-premium" (click)="$event.stopPropagation()">
        
        <div class="modal-header-plan">
          <h2 class="modal-title-plan">Cambiar Plan de Suscripción</h2>
          <button (click)="onClose.emit()" class="btn-close-plan">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-plan">
          <p class="plan-subtitle mb-4">Selecciona el nuevo plan para <strong>{{ empresaName }}</strong></p>
          
          <div class="plans-list mb-4">
            <div 
              *ngFor="let plan of availablePlans" 
              class="plan-card" 
              [ngClass]="{
                'selected': selectedNewPlanId === plan.id,
                'disabled': isCurrentPlan(plan)
              }"
              (click)="selectPlan(plan)"
            >
              <div class="plan-info">
                <div class="d-flex align-items-center gap-2">
                  <span class="plan-name">{{ plan.nombre }}</span>
                  <span *ngIf="isCurrentPlan(plan)" class="badge-current">PLAN ACTUAL</span>
                </div>
                <span class="plan-desc text-muted small" *ngIf="plan.descripcion">{{ plan.descripcion }}</span>
                <span class="plan-price fw-bold text-primary mt-1">{{ plan.precio_anual | currency }} / año</span>
              </div>
              <div class="plan-check">
                <i class="bi" [ngClass]="selectedNewPlanId === plan.id ? 'bi-check-circle-fill' : (isCurrentPlan(plan) ? 'bi-slash-circle' : 'bi-circle')"></i>
              </div>
            </div>
          </div>

          <!-- PAYMENT SECTION (Accordion) -->
          <div class="payment-wrapper" [class.open]="!!selectedNewPlanId">
            <div class="payment-section border-top pt-4">
              <h6 class="text-secondary mb-3 text-uppercase fw-bold" style="font-size: 0.75rem; letter-spacing: 0.5px;">
                <i class="bi bi-credit-card me-2"></i>Detalles del Pago
              </h6>
              
              <div class="row g-3">
                 <div class="col-6">
                  <label class="form-label small fw-bold text-secondary">Monto Recibido</label>
                  <input type="number" [(ngModel)]="monto" class="form-control rounded-pill shadow-none" placeholder="0.00">
                </div>
                <div class="col-6">
                   <label class="form-label small fw-bold text-secondary">Método</label>
                   <input type="text" value="MANUAL_VENDEDOR" readonly class="form-control rounded-pill bg-light text-muted shadow-none">
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold text-secondary">Observaciones / Motivo</label>
                  <textarea [(ngModel)]="observaciones" class="form-control rounded-3 shadow-none" rows="2" 
                    placeholder="Ej: Upgrade de plan solicitado por el cliente..."></textarea>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="modal-footer-plan">
          <button (click)="onClose.emit()" class="btn-plan-secondary">Cancelar</button>
          <button (click)="submit()" [disabled]="!selectedNewPlanId" class="btn-plan-primary">
            Actualizar Plan
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
      z-index: 10001;
    }
    .modal-container-plan {
      background: var(--bg-main);
      width: 100%;
      max-width: 550px;
      border-radius: 28px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      border: 1px solid var(--border-color);
      box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.2);
    }
    .modal-header-plan {
      padding: 1.5rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
    }
    .modal-title-plan {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
    }
    .plan-subtitle {
      font-size: 0.9rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .btn-close-plan {
      background: var(--status-neutral-bg);
      border: none;
      width: 36px; height: 36px;
      border-radius: 10px;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-close-plan:hover { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .modal-body-plan {
      padding: 2rem 2.5rem;
      overflow-y: auto;
    }
    .plans-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .plan-card {
      padding: 1.25rem;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;
      background: #ffffff;
    }
    .plan-card:hover:not(.disabled) { border-color: var(--primary-color); background: var(--status-info-bg); }
    .plan-card.selected {
      border-color: var(--primary-color);
      background: var(--status-info-bg);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }
    .plan-card.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--status-neutral-bg);
      border-color: var(--border-color);
    }
    .badge-current {
      font-size: 0.65rem;
      background: var(--status-neutral);
      color: white;
      padding: 3px 10px;
      border-radius: 6px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .plan-info { display: flex; flex-direction: column; }
    .plan-name { font-weight: 800; color: var(--text-main); font-size: 1rem; }
    .plan-desc { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
    .plan-check { font-size: 1.25rem; color: var(--text-muted); opacity: 0.4; }
    .selected .plan-check { color: var(--primary-color); opacity: 1; }
    
    .payment-wrapper {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-in-out, opacity 0.3s;
      opacity: 0;
    }
    .payment-wrapper.open {
      max-height: 500px;
      opacity: 1;
      margin-top: 1.5rem;
    }

    .payment-section {
       border-top: 1px solid var(--border-color);
       padding-top: 1.5rem;
    }
    .section-label {
       font-size: 0.7rem; font-weight: 800; color: var(--text-muted); 
       text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1rem;
       display: block;
    }

    .form-control {
       border-radius: 12px !important;
       border: 1px solid var(--border-color) !important;
       font-weight: 600; font-size: 0.95rem; padding: 0.75rem 1rem !important;
    }
    .form-control:focus {
       border-color: var(--status-info) !important;
       box-shadow: 0 0 0 4px var(--status-info-bg) !important;
    }

    .modal-footer-plan {
      padding: 1.5rem 2.5rem;
      background: var(--bg-main);
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid var(--border-color);
      margin-top: auto;
    }
    .btn-plan-primary {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 12px;
      font-weight: 700;
      transition: all 0.2s;
    }
    .btn-plan-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 15px -3px rgba(0,0,0,0.1); }
    .btn-plan-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-plan-secondary {
      background: white;
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-plan-secondary:hover { background: var(--status-neutral-bg); }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VendedorChangePlanModalComponent implements OnInit {
  @Input() empresaName: string = '';
  @Input() selectedPlanId: string | null = null;

  @Output() onSave = new EventEmitter<{ planId: string, monto: number, observaciones: string, metodo_pago: string }>();
  @Output() onClose = new EventEmitter<void>();

  availablePlans: any[] = [];

  // Track the NEW plan selected by the user
  selectedNewPlanId: string | null = null;
  monto: number = 0;
  observaciones: string = '';

  constructor(
    private vendedorService: VendedorEmpresaService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.vendedorService.getPlanes().subscribe({
      next: (data) => {
        this.availablePlans = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading plans', err)
    });
  }

  isCurrentPlan(plan: any): boolean {
    if (!this.selectedPlanId) return false;
    return String(plan.id) === String(this.selectedPlanId);
  }

  selectPlan(plan: any) {
    // Prevent selecting the current plan
    if (this.isCurrentPlan(plan)) return;

    this.selectedNewPlanId = plan.id;
    this.monto = plan.precio_anual || 0;
    this.observaciones = `Cambio de plan a ${plan.nombre}`;
  }

  submit() {
    if (!this.selectedNewPlanId) return;
    this.onSave.emit({
      planId: this.selectedNewPlanId,
      monto: this.monto,
      observaciones: this.observaciones,
      metodo_pago: 'MANUAL_VENDEDOR'
    });
  }
}

import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaService } from '../../services/empresa.service';

@Component({
  selector: 'app-change-plan-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
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
                <span class="plan-price fw-bold text-primary mt-1">{{ plan.precio_mensual | currency }} / mes</span>
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
                   <input type="text" value="MANUAL_SUPERADMIN" readonly class="form-control rounded-pill bg-light text-muted shadow-none">
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold text-secondary">Observaciones / Motivo</label>
                  <textarea [(ngModel)]="observaciones" class="form-control rounded-3 shadow-none" rows="2" 
                    placeholder="Ej: Upgrade autorizado por Gerencia..."></textarea>
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
      background: #ffffff;
      width: 100%;
      max-width: 550px;
      border-radius: 28px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    .modal-header-plan {
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff;
    }
    .modal-title-plan {
      font-size: 1.15rem;
      font-weight: 800;
      color: #161d35;
      margin: 0;
    }
    .plan-subtitle {
      font-size: 0.9rem;
      color: #64748b;
    }
    .btn-close-plan {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
    }
    .modal-body-plan {
      padding: 0 2rem 2rem;
      overflow-y: auto;
    }
    .plans-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .plan-card {
      padding: 1rem 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .plan-card:hover:not(.disabled) { border-color: #161d35; background: #f8fafc; }
    .plan-card.selected {
      border-color: #161d35;
      background: rgba(22, 29, 53, 0.02);
      box-shadow: 0 4px 15px rgba(22, 29, 53, 0.05);
    }
    .plan-card.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #f1f5f9;
      border-color: #e2e8f0;
    }
    .badge-current {
      font-size: 0.65rem;
      background: #e2e8f0;
      color: #64748b;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .plan-info { display: flex; flex-direction: column; }
    .plan-name { font-weight: 800; color: #1e293b; font-size: 1rem; }
    .plan-desc { font-size: 0.8rem; color: #64748b; }
    .plan-check { font-size: 1.25rem; color: #94a3b8; }
    .selected .plan-check { color: #161d35; }
    
    /* Accordion styles */
    .payment-wrapper {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-in-out, opacity 0.3s;
      opacity: 0;
    }
    .payment-wrapper.open {
      max-height: 500px;
      opacity: 1;
    }

    .modal-footer-plan {
      padding: 1.5rem 2rem;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid #e2e8f0;
      margin-top: auto;
    }
    .btn-plan-primary {
      background: #161d35;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 12px;
      font-weight: 700;
      transition: all 0.2s;
    }
    .btn-plan-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-plan-secondary {
      background: white;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
    }
    .shadow-premium { box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25); }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChangePlanModalComponent implements OnInit {
  @Input() empresaName: string = '';
  // Input received from parent can be ID or Name
  @Input('selectedPlan') currentPlanValue: string = '';

  @Output() onSave = new EventEmitter<{ planId: string, monto: number, observaciones: string }>();
  @Output() onClose = new EventEmitter<void>();

  availablePlans: any[] = [];

  // Track the NEW plan selected by the user
  selectedNewPlanId: string | null = null;
  monto: number = 0;
  observaciones: string = '';

  constructor(
    private empresaService: EmpresaService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.empresaService.getPlanes().subscribe({
      next: (data) => {
        this.availablePlans = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading plans', err)
    });
  }

  isCurrentPlan(plan: any): boolean {
    if (!this.currentPlanValue) return false;
    // Check match by ID or by Name (case insensitive for name is safer but exact match is fine too)
    return String(plan.id) === String(this.currentPlanValue) ||
      plan.nombre === this.currentPlanValue;
  }

  selectPlan(plan: any) {
    // Prevent selecting the current plan
    if (this.isCurrentPlan(plan)) return;

    this.selectedNewPlanId = plan.id;
    this.monto = plan.precio_mensual || 0;
    this.observaciones = `Cambio de plan a ${plan.nombre}`;
  }

  submit() {
    if (!this.selectedNewPlanId) return;
    this.onSave.emit({
      planId: this.selectedNewPlanId,
      monto: this.monto,
      observaciones: this.observaciones
    });
  }
}

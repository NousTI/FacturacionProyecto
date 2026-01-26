import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Comision } from '../../services/comisiones.service';

@Component({
  selector: 'app-comisiones-details-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="onClose.emit()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-details-premium">
              <i class="bi bi-cash-coin"></i>
            </div>
            <div>
              <h2 class="modal-title-final">Detalle de Comisión</h2>
              <span class="badge-status-details" [ngClass]="getStatusClass(comision?.estado)">
                {{ comision?.estado }}
              </span>
            </div>
          </div>
          <button (click)="onClose.emit()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          
          <!-- SECCIÓN: INFORMACIÓN GENERAL -->
          <div class="form-section-final">
            <h3 class="section-header-final">Información General</h3>
            <div class="row g-3">
              <div class="col-12">
                <label class="label-final">Concepto</label>
                <div class="value-display-premium">{{ comision?.concepto }}</div>
              </div>
              <div class="col-md-6">
                <label class="label-final">Vendedor</label>
                <div class="value-display-premium font-mono">{{ comision?.vendedor_nombre }}</div>
              </div>
              <div class="col-md-6">
                <label class="label-final">Empresa Relacionada</label>
                <div class="value-display-premium" [class.no-data]="!comision?.empresa_nombre">
                  {{ comision?.empresa_nombre || 'N/A' }}
                </div>
              </div>
            </div>

            <!-- Approval Info -->
            <div class="row g-3 mt-1" *ngIf="comision?.aprobado_por_nombre && (comision?.estado === 'APROBADA' || comision?.estado === 'PAGADA')">
              <div class="col-md-6">
                <label class="label-final">Aprobado Por</label>
                <div class="value-display-premium font-mono text-corporate">
                  <i class="bi bi-shield-check me-2"></i>{{ comision?.aprobado_por_nombre }}
                </div>
              </div>
              <div class="col-md-6">
                <label class="label-final">Fecha Aprobación</label>
                <div class="value-display-premium">
                  {{ comision?.fecha_aprobacion | date:'dd/MM/yyyy HH:mm' }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN: MONTOS Y FECHAS -->
          <div class="form-section-final border-0 mb-0 pb-0">
            <h3 class="section-header-final text-corporate">Datos Financieros</h3>
            <div class="system-card-premium">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-final">Monto Comisión</label>
                  <div class="value-display-premium fw-bold text-corporate" style="font-size: 1.1rem;">
                    {{ comision?.monto | currency:'USD' }}
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Porcentaje Aplicado</label>
                  <div class="value-display-premium font-mono">{{ comision?.porcentaje_aplicado }}%</div>
                </div>
                <div class="col-md-6" *ngIf="comision?.metodo_pago && comision?.estado === 'PAGADA'">
                  <label class="label-final">Método de Pago</label>
                  <div class="value-display-premium font-mono">
                    {{ comision?.metodo_pago }}
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Fecha Generación</label>
                  <div class="value-display-premium">
                    {{ comision?.fecha_generacion | date:'dd MMM, yyyy' }}
                  </div>
                </div>
                <div class="col-md-6" *ngIf="comision?.fecha_pago && comision?.estado === 'PAGADA'">
                  <label class="label-final">Fecha de Pago</label>
                  <div class="value-display-premium text-success fw-bold">
                    {{ comision?.fecha_pago | date:'dd MMM, yyyy' }}
                  </div>
                </div>
                <div class="col-12" *ngIf="comision?.observaciones">
                  <label class="label-final">Observaciones</label>
                  <div class="value-display-premium fst-italic">
                    {{ comision?.observaciones }}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="onClose.emit()" class="btn-cancel-final">Cerrar</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10005;
      padding: 1rem;
    }
    .modal-container-final {
      background: #ffffff; width: 680px;
      max-width: 95vw; max-height: 90vh; border-radius: 28px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final { padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center; }
    .modal-title-final { font-size: 1.25rem; font-weight: 800; color: #161d35; margin: 0; }
    .btn-close-final { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    
    .avatar-details-premium {
      width: 44px; height: 44px; background: #e0e7ff; color: #4338ca;
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.2rem;
    }
    .badge-status-details {
      font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.85rem; border-radius: 100px;
      text-transform: uppercase; margin-top: 0.25rem; display: inline-block;
    }
    .badge-status-details.active { background: #dcfce7; color: #15803d; } 
    .badge-status-details.pending { background: #fff7ed; color: #c2410c; }
    .badge-status-details.rejected { background: #fee2e2; color: #b91c1c; }
    .badge-status-details.paid { background: #d1fae5; color: #059669; }

    .modal-body-final { padding: 0 2.5rem 2rem; overflow-y: auto; flex: 1; }
    .form-section-final { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #f1f5f9; }
    .section-header-final { font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem; }
    .label-final { font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 0.6rem; display: block; }
    
    .value-display-premium {
      width: 100%; background: #f8fafc; border: 1px solid #f1f5f9;
      border-radius: 100px; padding: 0.65rem 1.5rem;
      font-size: 0.9rem; color: #1e293b; font-weight: 600;
    }
    .value-display-premium.no-data {
      color: #94a3b8; font-style: italic;
    }
    
    .system-card-premium {
      background: #fbfcfe; padding: 1.5rem; border-radius: 24px;
      border: 1px solid #f1f5f9;
    }

    .text-corporate { color: #161d35 !important; }
    .font-mono { font-family: 'DM Mono', monospace; letter-spacing: -0.5px; }
    
    .modal-footer-final {
      padding: 1.5rem 2.5rem; background: #ffffff;
      display: flex; justify-content: flex-end; gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-cancel-final {
      background: #ffffff; color: #64748b; border: 1px solid #e2e8f0;
      padding: 0.75rem 2rem; border-radius: 12px; font-weight: 600;
      min-width: 120px;
    }
    
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ComisionesDetailsModalComponent {
  @Input() comision: Comision | null = null;
  @Output() onClose = new EventEmitter<void>();

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    switch (status) {
      case 'APROBADA': return 'active';
      case 'PENDIENTE': return 'pending';
      case 'RECHAZADA': return 'rejected';
      case 'PAGADA': return 'paid';
      default: return '';
    }
  }
}

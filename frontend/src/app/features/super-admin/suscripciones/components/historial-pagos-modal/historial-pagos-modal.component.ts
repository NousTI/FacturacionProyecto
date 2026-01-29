import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagoHistorico } from '../../services/suscripcion.service';

@Component({
    selector: 'app-historial-pagos-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <div>
            <h2 class="modal-title-final">Historial de Pagos</h2>
            <p class="text-muted mb-0" style="font-size: 0.85rem;" *ngIf="companyName">Empresa: {{ companyName }}</p>
          </div>
          <button (click)="close()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          <!-- Empty State -->
          <div *ngIf="pagos.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-clock-history mb-3" style="font-size: 2rem; opacity: 0.5;"></i>
            <p>No hay pagos registrados.</p>
          </div>

          <!-- Pagos List -->
          <div *ngIf="pagos.length > 0" class="pagos-list">
            <div class="pago-card" *ngFor="let pago of pagos">
              
              <div class="d-flex align-items-center gap-3 flex-grow-1">
                <div class="pago-icon-minimal">
                  <i class="bi bi-currency-dollar"></i>
                </div>
                
                <div class="d-flex flex-column">
                  <span class="pago-monto-minimal">{{ pago.monto | currency:'USD' }}</span>
                  <span class="pago-plan-minimal">{{ pago.plan_nombre }}</span>
                </div>
              </div>

              <div class="d-flex flex-column align-items-end gap-1">
                <div class="d-flex align-items-center gap-2">
                    <span class="badge-metodo">{{ pago.metodo_pago }}</span>
                </div>
                <span class="pago-date-minimal">{{ pago.fecha_pago | date:'d MMM, y h:mm a' }}</span>
                <span class="pago-ref-minimal" *ngIf="pago.numero_comprobante">Ref: {{ pago.numero_comprobante }}</span>
              </div>

            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="close()" class="btn-submit-final">Cerrar</button>
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
      background: #ffffff; width: 600px; max-width: 95vw; height: 600px; max-height: 80vh;
      border-radius: 24px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final { padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: flex-start; }
    .modal-title-final { font-size: 1.15rem; font-weight: 800; color: #161d35; margin: 0; }
    .btn-close-final { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    .modal-body-final { padding: 0 2rem 2rem; overflow-y: auto; flex: 1; }
    
    .pagos-list { display: flex; flex-direction: column; gap: 0.8rem; }
    
    .pago-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      transition: all 0.2s ease;
    }
    .pago-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
      border-color: #cbd5e1;
    }

    .pago-icon-minimal {
      width: 42px; height: 42px;
      background: #f0fdf4;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: #16a34a;
      font-size: 1.1rem;
      border: 1px solid #dcfce7;
    }

    .pago-monto-minimal {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .pago-plan-minimal {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }

    .pago-date-minimal {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .pago-ref-minimal {
        font-size: 0.7rem;
        color: #cbd5e1;
        font-family: monospace;
    }

    .badge-metodo {
        background: #f1f5f9;
        color: #475569;
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .modal-footer-final { padding: 1.25rem 2rem; display: flex; justify-content: flex-end; border-top: 1px solid #f1f5f9; }
    .btn-submit-final { background: #161d35; color: white; border: none; padding: 0.6rem 2rem; border-radius: 12px; font-weight: 700; transition: all 0.2s; }
    .btn-submit-final:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(22, 29, 53, 0.15); }

    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class HistorialPagosModalComponent implements OnInit, OnDestroy {
    @Input() companyName: string = '';
    @Input() pagos: PagoHistorico[] = [];
    @Output() onClose = new EventEmitter<void>();

    constructor() { }

    ngOnInit() {
        document.body.style.overflow = 'hidden';
    }

    ngOnDestroy() { document.body.style.overflow = 'auto'; }
    close() { this.onClose.emit(); }
}

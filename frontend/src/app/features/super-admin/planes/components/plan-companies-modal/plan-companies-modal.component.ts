import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanService } from '../../services/plan.service';

@Component({
  selector: 'app-plan-companies-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <div>
            <h2 class="modal-title-final">Empresas en {{planName}}</h2>
            <p class="text-muted mb-0" style="font-size: 0.85rem;">Listado de empresas con suscripción activa</p>
          </div>
          <button (click)="close()" class="btn-close-final">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          <!-- Empty State -->
          <div *ngIf="companies.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-building mb-3" style="font-size: 2rem; opacity: 0.5;"></i>
            <p>No hay empresas suscritas a este plan actualmente.</p>
          </div>

          <!-- Companies List -->
          <div *ngIf="companies.length > 0" class="companies-list">
            <div class="company-card" *ngFor="let company of companies">
              
              <div class="d-flex align-items-center gap-3 flex-grow-1">
                <div class="company-icon-minimal">
                  <i class="bi bi-building"></i>
                </div>
                
                <div class="d-flex flex-column">
                  <span class="company-name-minimal">{{company.nombre_comercial || company.razon_social || 'Sin Nombre'}}</span>
                  <span class="company-ruc-minimal">RUC: {{company.ruc}}</span>
                </div>
              </div>

              <div class="d-flex align-items-center gap-4">
                <div class="company-date-minimal" *ngIf="company.fecha_vencimiento">
                  <span class="label">Vence</span>
                  <span class="value">{{company.fecha_vencimiento | date:'d MMM, y'}}</span>
                </div>
                
                <div class="status-pill" [ngClass]="company.activo ? 'status-active' : 'status-inactive'">
                  <span class="dot"></span>
                  {{company.activo ? 'Activo' : 'Inactivo'}}
                </div>
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
    
    .companies-list { display: flex; flex-direction: column; gap: 0.8rem; }
    
    .company-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      transition: all 0.2s ease;
    }
    .company-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
      border-color: #cbd5e1;
    }

    .company-icon-minimal {
      width: 42px; height: 42px;
      background: #f8fafc;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: #64748b;
      font-size: 1.1rem;
      border: 1px solid #f1f5f9;
    }

    .company-name-minimal {
      font-size: 0.95rem;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .company-ruc-minimal {
      font-size: 0.75rem;
      color: #94a3b8;
      font-family: monospace;
      letter-spacing: 0.5px;
    }

    .company-date-minimal {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
    }
    .company-date-minimal .label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #cbd5e1;
      font-weight: 700;
    }
    .company-date-minimal .value {
      font-size: 0.85rem;
      color: #475569;
      font-weight: 500;
    }

    .status-pill {
      padding: 0.35rem 0.85rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-pill .dot {
      width: 6px; height: 6px; border-radius: 50%;
    }

    .status-active {
      background: rgba(16, 185, 129, 0.08);
      color: #059669;
    }
    .status-active .dot { background: #10b981; }

    .status-inactive {
      background: rgba(100, 116, 139, 0.08);
      color: #64748b;
    }
    .status-inactive .dot { background: #94a3b8; }

    .modal-footer-final { padding: 1.25rem 2rem; display: flex; justify-content: flex-end; border-top: 1px solid #f1f5f9; }
    .btn-submit-final { background: #161d35; color: white; border: none; padding: 0.6rem 2rem; border-radius: 12px; font-weight: 700; transition: all 0.2s; }
    .btn-submit-final:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(22, 29, 53, 0.15); }

    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class PlanCompaniesModalComponent implements OnInit, OnDestroy {
  @Input() planName: string = '';
  @Input() companies: any[] = [];
  @Output() onClose = new EventEmitter<void>();

  constructor() { }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() { document.body.style.overflow = 'auto'; }
  close() { this.onClose.emit(); }
}

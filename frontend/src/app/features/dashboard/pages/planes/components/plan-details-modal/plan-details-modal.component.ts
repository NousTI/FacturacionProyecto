import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plan } from '../../services/plan.service';

@Component({
    selector: 'app-plan-details-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-details" (click)="$event.stopPropagation()">
        
        <!-- Header with Branding Style -->
        <div class="modal-header-details">
          <div class="header-content">
            <div class="plan-badge-icon">
              <i class="bi bi-box-seam"></i>
            </div>
            <div>
              <h2 class="modal-title-details">{{ plan.name }}</h2>
              <p class="modal-subtitle-details">{{ plan.description }}</p>
            </div>
          </div>
          <button (click)="close()" class="btn-close-details">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="modal-body-details custom-scrollbar">
          
          <!-- Pricing Section -->
          <div class="details-section pricing-card">
            <div class="price-header">
              <span class="currency">$</span>
              <span class="amount">{{ plan.price | number:'1.2-2' }}</span>
              <span class="period">/mes</span>
            </div>
            <div class="plan-status">
              <span class="status-badge" [ngClass]="plan.status === 'ACTIVO' ? 'active' : 'inactive'">
                <i class="bi" [ngClass]="plan.status === 'ACTIVO' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                {{ plan.status }}
              </span>
              <span class="status-badge" [ngClass]="plan.visible_publico ? 'visible' : 'hidden'">
                <i class="bi" [ngClass]="plan.visible_publico ? 'bi-eye-fill' : 'bi-eye-slash-fill'"></i>
                {{ plan.visible_publico ? 'Público' : 'Oculto' }}
              </span>
            </div>
          </div>

          <!-- Limits Grid -->
          <h3 class="section-title">Límites y Capacidades</h3>
          <div class="limits-grid">
            <div class="limit-card">
              <div class="limit-icon"><i class="bi bi-people"></i></div>
              <div class="limit-info">
                <span class="limit-value">{{ plan.max_usuarios === 0 ? 'Ilimitado' : plan.max_usuarios }}</span>
                <span class="limit-label">Usuarios</span>
              </div>
            </div>
            <div class="limit-card">
              <div class="limit-icon"><i class="bi bi-receipt"></i></div>
              <div class="limit-info">
                <span class="limit-value">{{ plan.max_facturas_mes === 0 ? 'Ilimitado' : plan.max_facturas_mes }}</span>
                <span class="limit-label">Facturas/Mes</span>
              </div>
            </div>
            <div class="limit-card">
              <div class="limit-icon"><i class="bi bi-shop"></i></div>
              <div class="limit-info">
                <span class="limit-value">{{ plan.max_establecimientos === 0 ? 'Ilimitado' : plan.max_establecimientos }}</span>
                <span class="limit-label">Establecimientos</span>
              </div>
            </div>
          </div>

          <!-- Features List -->
          <h3 class="section-title mt-4">Características Incluidas</h3>
          <div class="features-list">
            <div class="feature-item" [class.included]="plan.caracteristicas.facturacion_electronica">
              <i class="bi" [ngClass]="plan.caracteristicas.facturacion_electronica ? 'bi-check-lg' : 'bi-dash'"></i>
              <span>Facturación Electrónica</span>
            </div>
             <div class="feature-item" [class.included]="plan.caracteristicas.multi_usuario">
              <i class="bi" [ngClass]="plan.caracteristicas.multi_usuario ? 'bi-check-lg' : 'bi-dash'"></i>
              <span>Multi-Usuario</span>
            </div>
            <div class="feature-item" [class.included]="plan.caracteristicas.api_acceso">
              <i class="bi" [ngClass]="plan.caracteristicas.api_acceso ? 'bi-check-lg' : 'bi-dash'"></i>
              <span>Acceso a API</span>
            </div>
            <div class="feature-item" [class.included]="plan.caracteristicas.reportes_avanzados">
              <i class="bi" [ngClass]="plan.caracteristicas.reportes_avanzados ? 'bi-check-lg' : 'bi-dash'"></i>
              <span>Reportes Avanzados</span>
            </div>
            <div class="feature-item" [class.included]="plan.caracteristicas.personalizacion_pdf">
              <i class="bi" [ngClass]="plan.caracteristicas.personalizacion_pdf ? 'bi-check-lg' : 'bi-dash'"></i>
              <span>Personalización PDF</span>
            </div>
             <div class="feature-item" [class.included]="plan.caracteristicas.soporte_prioritario">
              <i class="bi" [ngClass]="plan.caracteristicas.soporte_prioritario ? 'bi-check-lg' : 'bi-dash'"></i>
              <span>Soporte Prioritario</span>
            </div>
             <div class="feature-item" [class.included]="plan.caracteristicas.backup_automatico">
              <i class="bi" [ngClass]="plan.caracteristicas.backup_automatico ? 'bi-check-lg' : 'bi-dash'"></i>
              <span>Backups Automáticos</span>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer-details">
          <button (click)="close()" class="btn-close-modal">Cerrar Detalles</button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.6); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem;
    }
    .modal-container-details {
      background: #ffffff; width: 500px; max-width: 95vw; max-height: 90vh;
      border-radius: 24px; display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.3);
      animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Header */
    .modal-header-details {
      padding: 2rem 2rem 1.5rem;
      display: flex; justify-content: space-between; align-items: flex-start;
      background: linear-gradient(to bottom, #ffffff, #fcfcfc);
      /* border-bottom: 1px solid #f1f5f9; */
    }
    .header-content { display: flex; gap: 1rem; align-items: flex-start; }
    .plan-badge-icon {
      width: 48px; height: 48px; background: #f1f5f9; color: #161d35;
      border-radius: 14px; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; flex-shrink: 0;
    }
    .modal-title-details { font-size: 1.5rem; font-weight: 800; color: #161d35; margin: 0; line-height: 1.2; }
    .modal-subtitle-details { font-size: 0.9rem; color: #64748b; margin: 0.25rem 0 0; font-weight: 500; }
    .btn-close-details {
      background: #f8fafc; border: none; width: 32px; height: 32px; border-radius: 50%;
      color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-close-details:hover { background: #fee2e2; color: #ef4444; }

    /* Body */
    .modal-body-details { padding: 0 2rem 2rem; overflow-y: auto; flex: 1; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    /* Pricing Card */
    .pricing-card {
      background: #f8fafc; padding: 1.5rem; border-radius: 20px;
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 2rem; border: 1px solid #f1f5f9;
    }
    .price-header { display: flex; align-items: baseline; color: #161d35; }
    .currency { font-size: 1.2rem; font-weight: 600; margin-right: 2px; }
    .amount { font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; }
    .period { color: #64748b; font-weight: 600; font-size: 0.9rem; margin-left: 4px; }
    
    .plan-status { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; }
    .status-badge {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      padding: 0.3rem 0.75rem; border-radius: 100px; display: flex; align-items: center; gap: 6px;
    }
    .status-badge.active { background: #dcfce7; color: #166534; }
    .status-badge.inactive { background: #fee2e2; color: #991b1b; }
    .status-badge.visible { background: #e0f2fe; color: #075985; }
    .status-badge.hidden { background: #f1f5f9; color: #64748b; }

    /* Section Titles */
    .section-title {
      font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px;
      color: #94a3b8; font-weight: 800; margin-bottom: 1rem;
    }

    /* Limits Grid */
    .limits-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .limit-card {
      background: #ffffff; border: 1px solid #f1f5f9; border-radius: 16px;
      padding: 1rem; text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);
    }
    .limit-icon { font-size: 1.5rem; color: #161d35; margin-bottom: 0.5rem; }
    .limit-info { display: flex; flex-direction: column; }
    .limit-value { font-weight: 800; color: #161d35; font-size: 1.1rem; }
    .limit-label { font-size: 0.7rem; color: #64748b; font-weight: 600; }

    /* Features List */
    .features-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .feature-item {
      display: flex; align-items: center; gap: 0.75rem;
      font-size: 0.85rem; color: #94a3b8; font-weight: 500;
      padding: 0.5rem; border-radius: 8px;
    }
    .feature-item.included { color: #334155; font-weight: 600; background: #f8fafc; }
    .feature-item i { font-size: 1.1rem; }
    .feature-item.included i { color: #161d35; }

    /* Footer */
    .modal-footer-details {
      padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: center;
    }
    .btn-close-modal {
      background: #161d35; color: #ffffff; border: none;
      padding: 0.75rem 3rem; border-radius: 12px; font-weight: 700;
      font-size: 0.9rem; cursor: pointer; transition: transform 0.2s;
    }
    .btn-close-modal:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3); }

  `]
})
export class PlanDetailsModalComponent {
    @Input() plan!: Plan;
    @Output() onClose = new EventEmitter<void>();

    close() {
        this.onClose.emit();
    }
}

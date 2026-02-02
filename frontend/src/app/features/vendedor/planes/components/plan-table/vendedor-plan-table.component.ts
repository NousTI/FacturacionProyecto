import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plan } from '../../../../super-admin/planes/services/plan.service';

@Component({
  selector: 'app-vendedor-plan-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="module-table">
      <div class="table-container border-0 shadow-premium">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Nombre del Plan</th>
                <th style="width: 140px">Costo</th>
                <th style="width: 120px">Empresas</th>
                <th style="width: 120px">Público</th>
                <th style="width: 120px">Estado</th>
                <th class="text-end" style="width: 100px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let plan of planes; trackBy: trackByPlanId" class="animate__animated animate__fadeIn">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="plan-icon me-3" [style.background]="getPlanColor(plan.name, 0.1)" [style.color]="getPlanColor(plan.name, 1)">
                      <i class="bi bi-box"></i>
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block mb-0">{{ plan.name }}</span>
                      <small class="text-muted d-block" style="font-size: 0.75rem; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        {{ plan.description }}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="fw-800 text-dark">{{ plan.price | currency:'USD' }}</span>
                </td>

                <td>
                  <div class="d-flex align-items-center cursor-pointer" (click)="onViewCompanies.emit(plan)">
                    <span class="subs-count me-2">{{ plan.activeCompanies }}</span>
                    <i class="bi bi-arrow-right-short text-muted"></i>
                  </div>
                </td>
                <td>
                  <span class="badge-status-premium" [ngClass]="plan.visible_publico ? 'active' : 'inactive'">
                    {{ plan.visible_publico ? 'VISIBLE' : 'OCULTO' }}
                  </span>
                </td>
                <td>
                  <span class="badge-status-premium" [ngClass]="plan.status === 'ACTIVO' ? 'active' : 'inactive'">
                    {{ plan.status }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + plan.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-bs-display="static"
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + plan.id">
                      <!-- VIEW DETAILS -->
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onViewDetails.emit(plan)">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      <!-- VIEW COMPANIES -->
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onViewCompanies.emit(plan)">
                          <i class="bi bi-building text-corporate"></i>
                          <span class="ms-2">Ver Empresas</span>
                        </a>
                      </li>
                      
                      <!-- RESTRICTED ACTIONS REMOVED FOR VENDOR -->
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .module-table { margin-top: 1rem; }
    .table-container {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      overflow: visible !important;
    }
    .table-responsive-premium { overflow: visible !important; position: relative; }
    .table thead th {
      background: #f8fafc;
      padding: 1.15rem 1.5rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 800;
      border-bottom: 2px solid #f1f5f9;
    }
    .table tbody tr:has(.btn-action-trigger[aria-expanded="true"]) {
      z-index: 10002 !important;
      position: relative !important;
    }
    .table tbody tr:has(.btn-action-trigger[aria-expanded="true"]) td {
      z-index: 10002 !important;
      position: relative !important;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f8fafc;
    }
    .plan-icon {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }
    .subs-count {
      font-weight: 800;
      color: #161d35;
      font-size: 1.1rem;
    }
    .badge-status-premium {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.75rem; font-weight: 800;
    }
    .badge-status-premium.active { background: #dcfce7; color: #15803d; }
    .badge-status-premium.inactive { background: #fee2e2; color: #b91c1c; }
    
    .btn-action-trigger {
      background: #f8fafc; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #161d35; color: #ffffff;
    }
    
    .dropdown-menu {
      z-index: 100000 !important;
      min-width: 210px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.25) !important;
      position: absolute !important;
      inset: auto 0 auto auto !important; /* Align to right/bottom of toggle */
      margin-top: 0.5rem !important;
    }
    .dropdown-item {
      font-size: 0.85rem; font-weight: 600;
      color: #475569; padding: 0.65rem 1.15rem;
      display: flex; align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover {
      background: #f8fafc; color: #161d35;
    }
    .cursor-pointer { cursor: pointer; }
    .text-corporate { color: #161d35 !important; }
    .fw-800 { font-weight: 800; }
    .shadow-premium { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04); }
    .shadow-premium-lg { box-shadow: 0 20px 40px -15px rgba(0, 10, 30, 0.15); }
  `]
})
export class VendedorPlanTableComponent {
  @Input() planes: Plan[] = [];
  @Output() onViewCompanies = new EventEmitter<Plan>();
  @Output() onViewDetails = new EventEmitter<Plan>();

  trackByPlanId(index: number, plan: Plan): string {
    return plan.id;
  }

  getPlanColor(name: string, opacity: number): string {
    if (name.includes('Básico')) return `rgba(99, 102, 241, ${opacity})`;
    if (name.includes('Profesional')) return `rgba(16, 185, 129, ${opacity})`;
    if (name.includes('Enterprise')) return `rgba(245, 158, 11, ${opacity})`;
    return `rgba(148, 163, 184, ${opacity})`;
  }
}

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plan } from '../../services/plan.service';

@Component({
  selector: 'app-plan-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="module-table">
      <div class="table-container">
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
              <tr *ngFor="let plan of planes; trackBy: trackByPlanId">
                <td>
                  <div class="d-flex align-items-center" style="max-width: 300px;">
                    <div class="avatar-soft-premium me-3">
                      <i class="bi bi-stack"></i>
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate" [title]="plan.name">{{ plan.name }}</span>
                      <small class="text-muted" style="font-size: 0.7rem;">{{ plan.description }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="fw-600 text-dark" style="font-size: 0.85rem;">{{ plan.price | currency:'USD' }}</span>
                </td>
                <td>
                  <div class="d-flex align-items-center cursor-pointer" (click)="onViewCompanies.emit(plan)">
                    <span class="subs-count me-2">{{ plan.activeCompanies }}</span>
                    <i class="bi bi-arrow-right-short text-muted"></i>
                  </div>
                </td>
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="plan.visible_publico ? 'visible' : 'oculto'">
                    {{ plan.visible_publico ? 'VISIBLE' : 'OCULTO' }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="plan.status === 'ACTIVO' ? 'activo' : 'inactivo'">
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
                      data-bs-popper-config='{"strategy":"fixed"}'
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + plan.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onEdit.emit(plan)">
                          <i class="bi bi-pencil-square text-corporate"></i>
                          <span class="ms-2">Editar Plan</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onViewDetails.emit(plan)">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onViewCompanies.emit(plan)">
                          <i class="bi bi-building text-corporate"></i>
                          <span class="ms-2">Ver Empresas</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onToggleVisibility.emit(plan)">
                          <i class="bi" [ngClass]="plan.visible_publico ? 'bi-eye-slash-fill text-muted' : 'bi-eye-fill text-corporate'"></i>
                          <span class="ms-2">{{ plan.visible_publico ? 'Ocultar de Web' : 'Mostrar en Web' }}</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onToggleStatus.emit(plan)">
                          <i class="bi" [ngClass]="plan.status === 'ACTIVO' ? 'bi-toggle-off text-muted' : 'bi-toggle-on text-corporate'"></i>
                          <span class="ms-2">{{ plan.status === 'ACTIVO' ? 'Desactivar Plan' : 'Activar Plan' }}</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="planes.length === 0">
                <td colspan="6" class="text-center p-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                  No se encontraron planes registrados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
    }
    .module-table {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin-top: 0;
    }
    .table-container {
      background: var(--bg-main);
      border-radius: 20px;
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: auto;
      max-height: 100%;
      overflow: hidden;
      margin-bottom: 0;
    }
    .table-responsive-premium {
      flex: 1;
      overflow-y: auto;
      overflow-x: auto;
      position: relative;
    }
    .table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
    }
    .table thead th {
      position: sticky; top: 0; z-index: 10;
      background: var(--bg-main); padding: 1rem 1.5rem;
      font-size: var(--text-base); color: var(--text-main); font-weight: 800;
      border-bottom: 2px solid var(--border-color); vertical-align: middle;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: var(--text-md);
    }
    .table tbody tr:last-child td {
      border-bottom: none;
    }
    .avatar-soft-premium {
      width: 38px; height: 38px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: 1.1rem;
      font-weight: 800;
      background: var(--primary-color); color: #ffffff;
    }
    .badge-cycle {
      background: var(--status-neutral-bg);
      color: var(--text-muted);
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .subs-count {
      font-weight: 800;
      color: #000000;
      font-size: 1.1rem;
    }
    .badge-status-premium {
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: var(--text-sm);
      font-weight: 600;
      display: inline-block;
      text-transform: capitalize;
    }
    .badge-status-premium.activo { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-premium.inactivo { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .badge-status-premium.visible { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-premium.oculto { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: var(--text-muted);
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: var(--status-neutral-bg); color: var(--text-main);
    }

    .dropdown-menu {
      background: var(--bg-main) !important;
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1) !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 1050 !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--text-muted); padding: 0.5rem 1rem;
      display: flex; align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover { background: var(--status-neutral-bg); color: var(--text-main); }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }

    .cursor-pointer { cursor: pointer; }
    .text-corporate { color: var(--primary-color) !important; }
    .fw-bold { font-weight: 700; }
    .text-dark { color: var(--text-main); }
    .text-muted { color: var(--text-muted); }
    .fw-600 { font-weight: 600; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class PlanTableComponent {
  @Input() planes: Plan[] = [];
  @Output() onEdit = new EventEmitter<Plan>();
  @Output() onViewCompanies = new EventEmitter<Plan>();
  @Output() onToggleStatus = new EventEmitter<Plan>();
  @Output() onToggleVisibility = new EventEmitter<Plan>();
  @Output() onViewDetails = new EventEmitter<Plan>();

  trackByPlanId(index: number, plan: Plan): string {
    return plan.id;
  }

  getPlanColor(name: string, opacity: number): string {
    return `rgba(148, 163, 184, ${opacity})`;
  }
}

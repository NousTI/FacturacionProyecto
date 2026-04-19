import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plan } from '../../../../super-admin/planes/services/plan.service';
import { EmpresaPaginacionComponent, PaginationState } from '../../../../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-vendedor-plan-table',
  standalone: true,
  imports: [CommonModule, EmpresaPaginacionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0">
            <thead>
              <tr>
                <th class="ps-4">Nombre del Plan</th>
                <th>Costo</th>
                <th>Empresas</th>
                <th>Categoría</th>
                <th>Público</th>
                <th>Estado</th>
                <th class="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let plan of planes; trackBy: trackByPlanId">
                <!-- Plan Name + Icon -->
                <td class="ps-4">
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-3">
                      <i class="bi bi-box-seam"></i>
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block">{{ plan.name }}</span>
                      <small class="text-muted d-block text-truncate" style="max-width: 200px;">
                        {{ plan.description }}
                      </small>
                    </div>
                  </div>
                </td>

                <!-- Costo -->
                <td>
                  <span class="fw-800 text-dark">{{ plan.price | currency:'USD' }}</span>
                </td>

                <!-- Empresas -->
                <td class="cursor-pointer" (click)="onViewCompanies.emit(plan)">
                  <div class="d-flex align-items-center">
                    <span class="fw-800 text-dark me-2">{{ plan.activeCompanies || 0 }}</span>
                    <i class="bi bi-arrow-right-short text-muted"></i>
                  </div>
                </td>

                <!-- Categoría Badge -->
                <td>
                  <span class="badge-role-premium" [ngClass]="getCategoryClass(plan.name)">
                    {{ getCategoryLabel(plan.name) }}
                  </span>
                </td>

                <!-- Público Badge -->
                <td>
                  <span class="badge-status-premium" [ngClass]="plan.visible_publico ? 'visible' : 'oculto'">
                    {{ plan.visible_publico ? 'VISIBLE' : 'OCULTO' }}
                  </span>
                </td>

                <!-- Estado Badge -->
                <td>
                  <span class="badge-status-premium" [ngClass]="plan.status === 'ACTIVO' ? 'activo' : 'inactivo'">
                    {{ plan.status }}
                  </span>
                </td>

                <!-- Acciones Dropdown -->
                <td class="text-end pe-4">
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
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onViewDetails.emit(plan)">
                          <i class="bi bi-eye"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onViewCompanies.emit(plan)">
                          <i class="bi bi-building"></i>
                          <span class="ms-2">Ver Empresas</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div *ngIf="planes.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-box-seam fs-1 d-block mb-3"></i>
            <p class="fw-600">No se encontraron planes para mostrar.</p>
          </div>
        </div>
      </div>
      <app-empresa-paginacion
        [pagination]="pagination"
        (pageChange)="pageChange.emit($event)"
        (pageSizeChange)="pageSizeChange.emit($event)"
      ></app-empresa-paginacion>
    </section>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
    }
    .module-table {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .table-container {
      background: var(--bg-main, #ffffff);
      border-radius: 20px;
      border: 1px solid var(--border-color, #f1f5f9);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    .table-responsive-premium {
      flex: 1;
      overflow-y: auto;
      overflow-x: auto;
      position: relative;
    }
    .table thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bg-main);
      padding: 1rem 1.25rem;
      font-size: var(--text-base);
      color: var(--text-main);
      font-weight: 800;
      border-bottom: 2px solid var(--border-color);
      vertical-align: middle;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .table tbody td {
      padding: 1.25rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: var(--text-md);
      vertical-align: middle;
    }

    .avatar-soft-premium {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.1rem;
      background: var(--primary-color);
      color: #ffffff;
      flex-shrink: 0;
    }

    .badge-status-premium {
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      font-size: var(--text-xs);
      font-weight: 800;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .activo { background: var(--status-success-bg); color: var(--status-success-text); }
    .inactivo { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .visible { background: var(--status-info-bg); color: var(--status-info-text); }
    .oculto { background: var(--status-natural-bg); color: var(--text-main); }

    .badge-role-premium {
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      font-size: var(--text-xs);
      font-weight: 800;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .basico { background: var(--status-info-bg); color: var(--status-info-text); }
    .profesional { background: var(--status-success-bg); color: var(--status-success-text); }
    .enterprise { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .estandar { background: var(--status-natural-bg); color: var(--text-main); }

    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: var(--text-muted);
      transition: all 0.2s; cursor: pointer;
    }
    .btn-action-trigger:hover,
    .btn-action-trigger[aria-expanded="true"] {
      background: var(--status-info-bg); color: var(--status-info-text);
    }

    .dropdown-menu {
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 1050 !important;
    }

    .fw-800 { font-weight: 800; }
    .fw-600 { font-weight: 600; }
    .cursor-pointer { cursor: pointer; }
  `]
})

export class VendedorPlanTableComponent {
  @Input() planes: Plan[] = [];
  @Input() pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };
  @Output() onViewCompanies = new EventEmitter<Plan>();
  @Output() onViewDetails = new EventEmitter<Plan>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  trackByPlanId(index: number, plan: Plan): string {
    return plan.id;
  }

  getCategoryLabel(planName: string): string {
    if (planName.includes('Básico')) return 'Básico';
    if (planName.includes('Profesional')) return 'Profesional';
    if (planName.includes('Enterprise')) return 'Enterprise';
    return 'Estándar';
  }

  getCategoryClass(planName: string): string {
    if (planName.includes('Básico')) return 'basico';
    if (planName.includes('Profesional')) return 'profesional';
    if (planName.includes('Enterprise')) return 'enterprise';
    return 'estandar';
  }
}

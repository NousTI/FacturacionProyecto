import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InfoTooltipComponent } from '../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-recent-companies',
  standalone: true,
  imports: [CommonModule, RouterModule, InfoTooltipComponent],
  template: `
    <div class="editorial-panel h-100">
      <div class="panel-header-premium">
        <div class="d-flex align-items-center gap-2">
          <div class="icon-circle-sm" style="background: var(--border-color); color: var(--primary-color);">
            <i class="bi bi-building"></i>
          </div>
          <div class="d-flex flex-column">
            <span class="panel-title">Empresas Recientes</span>
            <span class="panel-subtitle">Últimas incorporaciones al sistema</span>
          </div>
          <app-info-tooltip message="Las últimas empresas registradas en la plataforma SaaS."></app-info-tooltip>
        </div>
        <a routerLink="/empresas" class="panel-link">Explorar todas <i class="bi bi-arrow-right"></i></a>
      </div>

      <div class="table-container-premium">
        <table class="table-premium">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Plan</th>
              <th>Estado</th>
              <th class="text-end">Registro</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of empresas">
              <td>
                <div class="d-flex align-items-center gap-3">
                  <div class="avatar-soft-premium">
                    {{ (emp.nombre_comercial || '').slice(0, 2).toUpperCase() }}
                  </div>
                  <div class="d-flex flex-column">
                    <span class="fw-bold text-dark">{{ emp.nombre_comercial }}</span>
                    <span class="text-muted extra-small">ID: {{ (emp.id || '').slice(0, 8) }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge-plan">{{ emp.plan_nombre || 'Sin Plan' }}</span>
              </td>
              <td>
                <span class="status-badge" [ngClass]="emp.activo ? 'active' : 'inactive'">
                  {{ emp.activo ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="text-end">
                <span class="date-text">{{ emp.fecha_registro | date:'MMM d, y' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div *ngIf="!empresas?.length" class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>No hay registros recientes</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editorial-panel {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header-premium {
      padding: 1.5rem 1.5rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .panel-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--primary-color);
      line-height: 1.2;
    }

    .panel-subtitle {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .panel-link {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary-color);
      text-decoration: none;
      transition: all 0.2s;
    }
    .panel-link:hover { transform: translateX(3px); }

    .icon-circle-sm {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem;
    }

    /* Table Styling */
    .table-container-premium { padding: 0 1.5rem 1.5rem; }
    .table-premium { width: 100%; border-collapse: collapse; }
    .table-premium thead th {
      font-size: 0.65rem; font-weight: 800; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px;
      padding: 1rem 0; border-bottom: 1px solid var(--border-color);
      background: var(--bg-main); position: sticky; top: 0;
    }
    .table-premium tbody tr { 
      border-bottom: 1px solid var(--border-color); 
      transition: background 0.2s;
    }
    .table-premium tbody tr:hover { background: var(--border-color); }
    .table-premium tbody td { padding: 1.25rem 0; vertical-align: middle; }

    .avatar-soft-premium {
      width: 40px; height: 40px; border-radius: 12px;
      background: var(--border-color); color: var(--text-muted);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
    }

    .badge-plan {
      font-size: 0.75rem; font-weight: 700; color: var(--primary-color);
      background: var(--border-color); padding: 4px 10px; border-radius: 8px;
    }

    .status-badge {
      font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
      padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center;
    }
    .status-badge.active { 
      background: var(--status-success); 
      color: white; 
    }
    .status-badge.inactive { 
      background: var(--status-danger); 
      color: white; 
    }

    .date-text { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }

    .empty-state {
      padding: 3rem 0; text-align: center; color: var(--text-muted);
    }
    .empty-state i { font-size: 2.5rem; display: block; margin-bottom: 1rem; }
    .empty-state p { font-size: 0.875rem; font-weight: 500; }

    .extra-small { font-size: 0.65rem; }
  `]
})
export class RecentCompaniesComponent {
  @Input() empresas: any[] = [];
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmpresaResumen } from '../services/vendedor-home.service';
import { InfoTooltipComponent } from '../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-dashboard-empresas',
  standalone: true,
  imports: [CommonModule, RouterModule, InfoTooltipComponent],
  template: `
    <div class="panel">
      <div class="panel-header">
        <span class="d-flex align-items-center gap-1">
          <i class="bi bi-building me-2"></i>Empresas Asignadas
          <app-info-tooltip message="Listado de las empresas de tu cartera con su plan activo, estado de suscripción y fecha de vencimiento."></app-info-tooltip>
        </span>
        <a routerLink="/vendedor/empresas" class="panel-header-link">Ver todas</a>
      </div>
      <div class="table-responsive">
        <table class="table table-sm table-hover mb-0">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Plan</th>
              <th>Estado</th>
              <th class="text-end">Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of empresas">
              <td class="fw-bold small">{{ emp.razon_social }}</td>
              <td class="small text-muted">{{ emp.plan_nombre || 'Sin Plan' }}</td>
              <td>
                <span class="estado-badge" 
                      [ngClass]="emp.estado_suscripcion === 'ACTIVA' ? 'badge-activa' : 'badge-vencida'">
                  {{ emp.estado_suscripcion || 'N/A' }}
                </span>
              </td>
              <td class="text-end text-muted small">{{ emp.fecha_vencimiento || '--' }}</td>
            </tr>
            <tr *ngIf="!isLoading && !empresas.length">
              <td colspan="4" class="text-center py-4 text-muted small">No hay empresas asignadas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      display: flex;
      flex-direction: column;
    }
    .panel-header {
      padding: 0.9rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-main);
      border-bottom: 1px solid var(--border-color);
      background: var(--status-neutral-bg);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 14px 14px 0 0;
    }
    .panel-header-link {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--status-info-text);
      text-decoration: none;
      background: var(--status-info-bg);
      padding: 4px 10px;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .panel-header-link:hover { background: var(--status-info); color: white; }

    .table thead th {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      border-bottom: 1px solid var(--border-color);
      padding: 0.8rem 1rem;
      background: var(--bg-main);
      letter-spacing: 0.5px;
    }
    .table tbody td { padding: 1rem; vertical-align: middle; font-size: 0.875rem; color: var(--text-main); }
    .table-hover tbody tr:hover td { background: var(--status-info-bg); }
    
    .estado-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .badge-activa  { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-vencida { background: var(--status-danger-bg); color: var(--status-danger-text); }
  `]
})
export class DashboardEmpresasComponent {
  @Input() empresas: EmpresaResumen[] = [];
  @Input() isLoading = false;
}

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
            <tr *ngIf="!isLoading && !empresas?.length">
              <td colspan="4" class="text-center py-4 text-muted small">No hay empresas asignadas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
    }
    .panel-header {
      padding: 0.9rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 800;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 14px 14px 0 0;
    }
    .panel-header-link {
      font-size: 0.75rem;
      font-weight: 700;
      color: #6366f1;
      text-decoration: none;
    }
    .table thead th {
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      border-bottom: 1px solid #f1f5f9;
      padding: 0.6rem 1rem;
      background: white;
    }
    .table tbody td { padding: 0.75rem 1rem; vertical-align: middle; font-size: 0.875rem; }
    .table-hover tbody tr:hover td { background: #f8fafc; }
    .estado-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .badge-activa  { background: #ecfdf5; color: #10b981; }
    .badge-vencida { background: #fef2f2; color: #ef4444; }
  `]
})
export class DashboardEmpresasComponent {
  @Input() empresas: EmpresaResumen[] = [];
  @Input() isLoading = false;
}

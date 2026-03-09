import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardAlertas } from '../super-admin-dashboard.service';
import { InfoTooltipComponent } from '../../../../shared/components/info-tooltip/info-tooltip.component';

// Componente para visualizar alertas críticas, advertencias e informativas del sistema.

@Component({
  selector: 'app-super-admin-alerts',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent],
  template: `
    <div class="row g-3 mb-4">
      <div class="col-12">
        <div class="alerts-header d-flex align-items-center gap-1 mb-2 px-1">
          <span class="fw-bold text-dark" style="font-size:0.85rem">
            <i class="bi bi-bell-fill me-1 text-warning"></i>Alertas del Sistema
          </span>
          <app-info-tooltip message="Notificaciones críticas, advertencias y avisos informativos que requieren atención del administrador."></app-info-tooltip>
        </div>
        <div class="alerts-container">
          <div *ngFor="let alert of allAlerts" class="alert-item" [ngClass]="alert.nivel">
            <i class="bi" [ngClass]="getIcon(alert.nivel)"></i>
            <div class="alert-content">
              <strong>{{ alert.tipo }}:</strong> {{ alert.mensaje }}
            </div>
            <span class="badge" [ngClass]="'badge-' + alert.nivel">{{ alert.cantidad }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .alerts-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .alert-empty {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 1rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .alert-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      font-size: 0.85rem;
      border: 1px solid transparent;
    }
    .alert-item.critical { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .alert-item.warning { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
    .alert-item.info { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
    
    .alert-content { flex: 1; }
    .badge { padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 0.7rem; }
    .badge-critical { background: #ef4444; color: white; }
    .badge-warning { background: #f59e0b; color: white; }
    .badge-info { background: #3b82f6; color: white; }
  `]
})
export class SuperAdminAlertsComponent {
  @Input() alertas: DashboardAlertas | undefined;

  get allAlerts() {
    if (!this.alertas) return [];
    return [
      ...this.alertas.criticas,
      ...this.alertas.advertencias,
      ...this.alertas.informativas
    ];
  }

  getIcon(nivel: string) {
    switch (nivel) {
      case 'critical': return 'bi-exclamation-octagon-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      default: return 'bi-info-circle-fill';
    }
  }
}

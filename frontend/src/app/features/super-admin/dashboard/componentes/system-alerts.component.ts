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
      gap: 8px;
    }
    .alert-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0.75rem 1.25rem;
      border-radius: 16px;
      font-size: 0.85rem;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }
    .alert-item:hover {
      transform: translateX(4px);
    }
    .alert-item.critical { 
      background: var(--status-danger-bg); 
      border-color: var(--status-danger-bg); 
      color: var(--status-danger-text); 
    }
    .alert-item.warning { 
      background: var(--status-warning-bg); 
      border-color: var(--status-warning-bg); 
      color: var(--status-warning-text); 
    }
    .alert-item.info { 
      background: var(--status-info-bg); 
      border-color: var(--status-info-bg); 
      color: var(--status-info-text); 
    }
    
    .alert-content { 
      flex: 1; 
      font-weight: 500;
    }
    .alert-content strong {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      margin-right: 4px;
    }
    .badge { 
      padding: 4px 10px; 
      border-radius: 10px; 
      font-weight: 800; 
      font-size: 0.75rem; 
      border: none;
    }
    .badge-critical { background: var(--status-danger-text); color: white; }
    .badge-warning { background: var(--status-warning-text); color: white; }
    .badge-info { background: var(--status-info-text); color: white; }
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

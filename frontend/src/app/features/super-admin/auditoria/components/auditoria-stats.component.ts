import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auditoria-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row">
      <!-- Total Logs -->
      <div class="stat-item-mini">
        <div class="icon-circle status-info-soft">
          <i class="bi bi-shield-shaded"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Registros</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Security Alerts (Failed Logins) -->
      <div class="stat-item-mini">
        <div class="icon-circle status-danger-soft">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Alertas Seguridad</span>
          <span class="stat-value text-danger">{{ stats.alertas }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Active Modules -->
      <div class="stat-item-mini">
        <div class="icon-circle status-success-soft">
          <i class="bi bi-cpu-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Módulos Activos</span>
          <span class="stat-value text-success">{{ stats.modulos }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Actions Today -->
      <div class="stat-item-mini">
        <div class="icon-circle status-warning-soft">
          <i class="bi bi-activity"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Actividad Hoy</span>
          <span class="stat-value">{{ stats.hoy }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .stats-compact-row {
      background: var(--bg-main);
      border-radius: 20px;
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid var(--border-color);
      margin-bottom: 0;
    }
    .stat-item-mini {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      flex: 1;
    }
    .icon-circle {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    
    .status-info-soft { background: var(--status-info-bg); color: var(--status-info); }
    .status-danger-soft { background: var(--status-danger-bg); color: var(--status-danger); }
    .status-success-soft { background: var(--status-success-bg); color: var(--status-success); }
    .status-warning-soft { background: var(--status-warning-bg); color: var(--status-warning); }

    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.2;
    }
    .text-danger { color: var(--status-danger-text) !important; }
    .text-success { color: var(--status-success-text) !important; }
    
    .stat-divider {
      width: 1px;
      height: 35px;
      background: var(--border-color);
      margin: 0 1.5rem;
    }
    @media (max-width: 992px) {
      .stats-compact-row {
        flex-wrap: wrap;
        gap: 1.5rem;
      }
      .stat-divider {
        display: none;
      }
      .stat-item-mini {
        min-width: 45%;
      }
    }
  `]
})
export class AuditoriaStatsComponent {
  @Input() stats: any = { total: 0, alertas: 0, modulos: 0, hoy: 0 };
}

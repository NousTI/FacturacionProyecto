import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-renovaciones-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row">
      <!-- Pendientes / En Revisión -->
      <div class="stat-item-mini">
        <div class="icon-circle status-warning-soft">
          <i class="bi bi-hourglass-split"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">En Revisión</span>
          <span class="stat-value text-warning">{{ stats.pending || 0 }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Aprobadas -->
      <div class="stat-item-mini">
        <div class="icon-circle status-success-soft">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Aprobadas</span>
          <span class="stat-value text-success">{{ stats.accepted || 0 }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Rechazadas -->
      <div class="stat-item-mini">
        <div class="icon-circle status-danger-soft">
          <i class="bi bi-x-octagon-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Rechazadas</span>
          <span class="stat-value text-danger">{{ stats.rejected || 0 }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .stats-compact-row {
      background: var(--bg-main); border-radius: 20px; padding: 1.25rem 2rem;
      display: flex; align-items: center; justify-content: space-between;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 15px -3px rgba(0,0,0,0.02);
    }
    .stat-item-mini { display: flex; align-items: center; gap: 1.1rem; flex: 1; }
    .icon-circle {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label {
      font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .stat-value { font-size: 1.35rem; font-weight: 800; color: var(--text-main); line-height: 1.2; }
    
    .status-warning-soft { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .status-success-soft { background: var(--status-success-bg); color: var(--status-success-text); }
    .status-danger-soft { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .text-success { color: var(--status-success) !important; }
    .text-warning { color: var(--status-warning) !important; }
    .text-danger { color: var(--status-danger) !important; }

    .stat-divider { width: 1px; height: 35px; background: var(--border-color); margin: 0 1.5rem; }
    
    @media (max-width: 992px) {
      .stats-compact-row { flex-wrap: wrap; gap: 1.5rem; }
      .stat-divider { display: none; }
      .stat-item-mini { min-width: 45%; }
    }
  `]
})
export class RenovacionesStatsComponent {
  @Input() stats: { pending: number, accepted: number, rejected: number } = { pending: 0, accepted: 0, rejected: 0 };
}

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
        <div class="icon-circle" style="background: rgba(245, 158, 11, 0.1); color: var(--status-warning);">
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
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: var(--status-success);">
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
        <div class="icon-circle" style="background: rgba(239, 68, 68, 0.1); color: var(--status-danger);">
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
      background: white; border-radius: 20px; padding: 1.25rem 2rem;
      display: flex; align-items: center; justify-content: space-between;
      border: 1px solid var(--border-color, #f1f5f9);
    }
    .stat-item-mini { display: flex; align-items: center; gap: 1.1rem; flex: 1; }
    .icon-circle {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label {
      font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .stat-value { font-size: 1.35rem; font-weight: 800; color: #1e293b; line-height: 1.2; }
    
    .text-success { color: var(--status-success) !important; }
    .text-warning { color: var(--status-warning) !important; }
    .text-danger { color: var(--status-danger) !important; }

    .stat-divider { width: 1px; height: 35px; background: #f1f5f9; margin: 0 1.5rem; }
    
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

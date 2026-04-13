import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-suscripcion-stats',
  template: `
    <div class="stats-compact-row">
      <!-- Activas -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: var(--status-success);">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Suscripciones Activas</span>
          <span class="stat-value text-success">{{ stats.active || 0 }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Atrasados -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(239, 68, 68, 0.1); color: var(--status-danger);">
          <i class="bi bi-calendar-x-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Pagos Atrasados</span>
          <span class="stat-value text-danger">{{ stats.overdue || 0 }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Proyección de Cobros -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(59, 130, 246, 0.1); color: var(--status-info);">
          <i class="bi bi-graph-up-arrow"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Proyección de Cobros</span>
          <span class="stat-value">{{ stats.projectedCollection || 0 | currency:'USD' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
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
    .text-danger { color: var(--status-danger) !important; }

    .stat-divider { width: 1px; height: 35px; background: #f1f5f9; margin: 0 1.5rem; }
    
    @media (max-width: 992px) {
      .stats-compact-row { flex-wrap: wrap; gap: 1.5rem; }
      .stat-divider { display: none; }
      .stat-item-mini { min-width: 45%; }
    }
  `]
,
  standalone: true,
  imports: [CommonModule]
})
export class SuscripcionStatsComponent {
  @Input() stats: any = {};
}

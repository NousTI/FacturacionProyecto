import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuarios-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row">
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: var(--status-neutral-bg); color: var(--status-neutral-text);">
          <i class="bi bi-people-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Usuarios</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: var(--status-success-bg); color: var(--status-success-text);">
          <i class="bi bi-person-check-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Usuarios Activos</span>
          <span class="stat-value text-success">{{ active }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: var(--status-danger-bg); color: var(--status-danger-text);">
          <i class="bi bi-person-x-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Usuarios Inactivos</span>
          <span class="stat-value text-danger">{{ inactive }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .stats-compact-row {
      background: white; border-radius: 20px; padding: 1.25rem 2rem;
      display: flex; align-items: center; justify-content: space-between;
      border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .stat-item-mini { display: flex; align-items: center; gap: 1.1rem; flex: 1; }
    .icon-circle {
      width: 44px; height: 44px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 1.4rem; font-weight: 850; color: #0f172a; line-height: 1.2; letter-spacing: -0.01em; }
    .text-success { color: var(--status-success-text) !important; }
    .text-danger { color: var(--status-danger-text) !important; }
    .stat-divider { width: 1px; height: 35px; background: #f1f5f9; margin: 0 2rem; }
    @media (max-width: 992px) {
      .stats-compact-row { flex-wrap: wrap; gap: 1.5rem; padding: 1.5rem; }
      .stat-divider { display: none; }
      .stat-item-mini { min-width: 45%; }
    }
  `]
})
export class UsuariosStatsComponent {
  @Input() total: number = 0;
  @Input() active: number = 0;
  @Input() inactive: number = 0;
}

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
        <div class="icon-circle primary">
          <i class="bi bi-people-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Usuarios</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle success">
          <i class="bi bi-person-check-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Usuarios Activos</span>
          <span class="stat-value success">{{ active }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle danger">
          <i class="bi bi-person-x-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Usuarios Inactivos</span>
          <span class="stat-value danger">{{ inactive }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .stats-compact-row {
      background: white; border-radius: 20px; padding: 1.25rem 2rem;
      display: flex; align-items: center; justify-content: space-between;
      border: 1px solid var(--border-color); box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .stat-item-mini { display: flex; align-items: center; gap: 1.1rem; flex: 1; }
    .icon-circle {
      width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }
    .icon-circle.primary { background: var(--primary-color); color: #ffffff; }
    .icon-circle.success { background: var(--status-success-bg); color: var(--status-success-text); }
    .icon-circle.danger  { background: var(--status-danger-bg);  color: var(--status-danger-text); }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 1.4rem; font-weight: 850; color: #0f172a; line-height: 1.2; letter-spacing: -0.01em; }
    .stat-value.success { color: var(--status-success-text); }
    .stat-value.danger  { color: var(--status-danger-text); }
    .stat-divider { width: 1px; height: 35px; background: var(--border-color); margin: 0 2rem; }
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

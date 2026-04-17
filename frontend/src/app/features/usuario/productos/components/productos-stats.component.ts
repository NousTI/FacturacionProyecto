import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-productos-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row">
      <div class="stat-item-mini">
        <div class="icon-circle info">
          <i class="bi bi-box-seam"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Productos</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle success">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Habilitados</span>
          <span class="stat-value success">{{ active }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle warning">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Bajo Stock</span>
          <span class="stat-value warning">{{ bajoStock }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle danger">
          <i class="bi bi-x-octagon-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Sin Stock</span>
          <span class="stat-value danger">{{ sinStock }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .stats-compact-row {
      background: white; border-radius: 20px; padding: 1.25rem 2rem;
      display: flex; align-items: center; justify-content: space-between;
      border: 1px solid var(--border-color);
    }
    .stat-item-mini { display: flex; align-items: center; gap: 1.1rem; flex: 1; }
    .icon-circle {
      width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .icon-circle.info    { background: var(--status-info-bg);    color: var(--status-info-text); }
    .icon-circle.success { background: var(--status-success-bg); color: var(--status-success-text); }
    .icon-circle.warning { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .icon-circle.danger  { background: var(--status-danger-bg);  color: var(--status-danger-text); }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 1.35rem; font-weight: 800; color: #1e293b; line-height: 1.2; }
    .stat-value.success { color: var(--status-success-text); }
    .stat-value.warning { color: var(--status-warning-text); }
    .stat-value.danger  { color: var(--status-danger-text); }
    .stat-divider { width: 1px; height: 35px; background: var(--border-color); margin: 0 1.5rem; }
    @media (max-width: 1200px) {
      .stats-compact-row { flex-wrap: wrap; gap: 1.5rem; }
      .stat-divider { display: none; }
      .stat-item-mini { min-width: 45%; }
    }
    @media (max-width: 768px) {
      .stat-item-mini { min-width: 100%; }
    }
  `]
})
export class ProductosStatsComponent {
  @Input() total: number = 0;
  @Input() active: number = 0;
  @Input() bajoStock: number = 0;
  @Input() sinStock: number = 0;
}

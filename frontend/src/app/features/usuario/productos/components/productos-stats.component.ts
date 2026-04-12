import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-productos-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row">
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(30, 41, 59, 0.1); color: #1e293b;">
          <i class="bi bi-box-seam"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Productos</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Habilitados</span>
          <span class="stat-value text-success">{{ active }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Bajo Stock</span>
          <span class="stat-value text-warning">{{ bajoStock }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
          <i class="bi bi-x-octagon-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Sin Stock</span>
          <span class="stat-value text-danger">{{ sinStock }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .stats-compact-row {
      background: white; border-radius: 20px; padding: 1.25rem 2rem;
      display: flex; align-items: center; justify-content: space-between;
      border: 1px solid #f1f5f9;
    }
    .stat-item-mini { display: flex; align-items: center; gap: 1.1rem; flex: 1; }
    .icon-circle {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 1.35rem; font-weight: 800; color: #1e293b; line-height: 1.2; }
    .text-success { color: #10b981 !important; }
    .text-warning { color: #f59e0b !important; }
    .text-danger { color: #ef4444 !important; }
    .stat-divider { width: 1px; height: 35px; background: #f1f5f9; margin: 0 1.5rem; }
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

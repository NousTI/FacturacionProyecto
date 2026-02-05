import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-producto-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row mb-4">
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(22, 29, 53, 0.05); color: #161d35;">
          <i class="bi bi-box-seam-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Stock Total</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Activos</span>
          <span class="stat-value">{{ active }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
          <i class="bi bi-exclamation-octagon-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Agotados</span>
          <span class="stat-value">{{ sinStock }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
          <i class="bi bi-lightning-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Bajo Stock</span>
          <span class="stat-value">{{ bajoStock }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-compact-row {
      background: white; border-radius: 20px;
      padding: 1.25rem 2rem; display: flex;
      align-items: center; justify-content: space-between;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
    }
    .stat-item-mini { display: flex; align-items: center; gap: 1.1rem; flex: 1; }
    .icon-circle {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem;
    }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label {
      font-size: 0.65rem; font-weight: 800; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .stat-value { font-size: 1.35rem; font-weight: 800; color: #1e293b; line-height: 1.2; }
    .stat-divider { width: 1px; height: 35px; background: #f1f5f9; margin: 0 1.5rem; }
    
    @media (max-width: 992px) {
      .stats-compact-row { flex-wrap: wrap; gap: 1.5rem; }
      .stat-divider { display: none; }
      .stat-item-mini { min-width: 45%; }
    }
  `]
})
export class ProductoStatsComponent {
  @Input() total: number = 0;
  @Input() active: number = 0;
  @Input() sinStock: number = 0;
  @Input() bajoStock: number = 0;
}

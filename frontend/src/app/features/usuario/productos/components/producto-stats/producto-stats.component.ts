import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-producto-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row">
      <!-- TOTAL -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(59, 130, 246, 0.1); color: var(--status-info);">
          <i class="bi bi-box-seam"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Stock General</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- ACTIVOS -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: var(--status-success);">
          <i class="bi bi-check2-circle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Items Activos</span>
          <span class="stat-value text-success">{{ active }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- SIN STOCK -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(239, 68, 68, 0.1); color: var(--status-danger);">
          <i class="bi bi-exclamation-triangle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Sin Existencias</span>
          <span class="stat-value text-danger">{{ sinStock }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- BAJO STOCK -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(245, 158, 11, 0.1); color: var(--status-warning);">
          <i class="bi bi-graph-down-arrow"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Alerta Stock</span>
          <span class="stat-value text-warning">{{ bajoStock }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-compact-row {
      background: #ffffff;
      border-radius: 20px;
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #f1f5f9;
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
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.2;
    }
    .text-success { color: var(--status-success) !important; }
    .text-danger { color: var(--status-danger) !important; }
    .text-warning { color: var(--status-warning) !important; }
    
    .stat-divider {
      width: 1px;
      height: 35px;
      background: #f1f5f9;
      margin: 0 1.5rem;
    }
    @media (max-width: 1200px) {
       .stat-divider { margin: 0 1rem; }
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
    @media (max-width: 576px) {
      .stat-item-mini {
        min-width: 100%;
      }
    }
  `]
})
export class ProductoStatsComponent {
  @Input() total: number = 0;
  @Input() active: number = 0;
  @Input() sinStock: number = 0;
  @Input() bajoStock: number = 0;
}

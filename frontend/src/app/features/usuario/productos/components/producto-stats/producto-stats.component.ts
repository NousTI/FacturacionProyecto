import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-producto-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid-dashboard">
      <div class="stat-card">
        <div class="stat-icon ico-total">
          <i class="bi bi-layers"></i>
        </div>
        <div class="stat-data">
          <span class="stat-label">Stock General</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon ico-active">
          <i class="bi bi-check2-square"></i>
        </div>
        <div class="stat-data">
          <span class="stat-label">Items Activos</span>
          <span class="stat-value">{{ active }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon ico-empty">
          <i class="bi bi-box-arrow-in-down"></i>
        </div>
        <div class="stat-data">
          <span class="stat-label">Sin Existencias</span>
          <span class="stat-value">{{ sinStock }}</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon ico-low">
          <i class="bi bi-graph-down-arrow"></i>
        </div>
        <div class="stat-data">
          <span class="stat-label">Alerta de Stock</span>
          <span class="stat-value">{{ bajoStock }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .stat-card {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: border-color 0.2s;
    }

    .stat-card:hover {
      border-color: var(--primary-color);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }

    .stat-data {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.01em;
    }

    .stat-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--primary-color);
      line-height: 1;
      margin-top: 0.25rem;
    }

    .ico-total { background: #f1f5f9; color: var(--primary-color); }
    .ico-active { background: #ecfdf5; color: #10b981; }
    .ico-empty { background: #fef2f2; color: #ef4444; }
    .ico-low { background: #fffbeb; color: #f59e0b; }

    @media (max-width: 576px) {
      .stats-grid-dashboard {
        grid-template-columns: 1fr 1fr;
      }
      .stat-card {
        padding: 1rem;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
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

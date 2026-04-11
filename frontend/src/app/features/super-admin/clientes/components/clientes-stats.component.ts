import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clientes-stats',
  template: `
    <div class="stats-compact-row mb-4">
      <div class="stat-item-mini">
        <span class="stat-label">Total Clientes</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <span class="stat-label">Clientes Activos</span>
        <span class="stat-value">{{ stats.activos }}</span>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <span class="stat-label">Clientes Inactivos</span>
        <span class="stat-value">{{ stats.total - stats.activos }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stats-compact-row {
      background: #ffffff;
      border-radius: 16px;
      padding: 1.5rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #f1f5f9;
    }
    .stat-item-mini {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }
    .stat-label {
      font-size: var(--text-sm);
      font-weight: 500;
      color: #64748b;
      letter-spacing: 0;
    }
    .stat-value {
      font-size: var(--text-xl);
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .stat-divider {
      width: 1px;
      height: 40px;
      background: #f1f5f9;
      margin: 0 2rem;
    }
    @media (max-width: 768px) {
      .stats-compact-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
      }
      .stat-divider { display: none; }
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ClientesStatsComponent {
  @Input() stats: any = { total: 0, activos: 0, nuevos_mes: 0 };
}

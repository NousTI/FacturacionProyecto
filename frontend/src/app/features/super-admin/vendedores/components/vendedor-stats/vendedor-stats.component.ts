import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendedorStats } from '../../services/vendedor.service';

@Component({
  selector: 'app-vendedor-stats',
  template: `
    <div class="stats-compact-row mb-4">
      <div class="stat-item-mini">
        <span class="stat-label">Total Vendedores</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <span class="stat-label">Vendedores Activos</span>
        <span class="stat-value text-success">{{ stats.activos }}</span>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <span class="stat-label">Empresas Captadas</span>
        <span class="stat-value text-corporate">{{ stats.empresasTotales }}</span>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <span class="stat-label">Ingresos Generados</span>
        <span class="stat-value">{{ stats.ingresosGenerados | currency:'USD' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stats-compact-row {
      background: var(--bg-main, #ffffff);
      border-radius: 16px;
      padding: 1.5rem 2.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid var(--border-color, #f1f5f9);
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
      color: var(--text-muted, #64748b);
      letter-spacing: 0;
    }
    .stat-value {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--text-main, #0f172a);
      line-height: 1.2;
    }
    .stat-divider {
      width: 1px;
      height: 48px;
      background: var(--border-color, #f1f5f9);
      margin: 0 2.5rem;
    }
    .text-success { color: var(--status-success, #10b981) !important; }
    .text-corporate { color: var(--primary-color, #161d35) !important; }

    @media (max-width: 992px) {
      .stats-compact-row {
        flex-wrap: wrap;
        gap: 1.5rem;
        padding: 1.5rem;
      }
      .stat-item-mini {
        flex: 1 1 40%;
        min-width: 150px;
      }
      .stat-divider { display: none; }
    }
    @media (max-width: 576px) {
      .stat-item-mini {
        flex: 1 1 100%;
      }
    }
  `]
,
  standalone: true,
  imports: [CommonModule]
})
export class VendedorStatsComponent {
  @Input() stats: any = { total: 0, activos: 0, inactivos: 0, empresasTotales: 0, ingresosGenerados: 0 };
}

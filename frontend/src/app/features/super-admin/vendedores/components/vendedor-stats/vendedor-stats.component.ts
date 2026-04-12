import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendedorStats } from '../../services/vendedor.service';

@Component({
  selector: 'app-vendedor-stats',
  template: `
    <div class="stats-compact-row">
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(22, 29, 53, 0.1); color: var(--primary-color);">
          <i class="bi bi-person-badge-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Vendedores</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: var(--status-success);">
          <i class="bi bi-person-fill-check"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Vendedores Activos</span>
          <span class="stat-value text-success">{{ stats.activos }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(245, 158, 11, 0.1); color: var(--status-warning);">
          <i class="bi bi-buildings-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Empresas Captadas</span>
          <span class="stat-value text-corporate">{{ stats.empresasTotales }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(59, 130, 246, 0.1); color: var(--status-info);">
          <i class="bi bi-currency-dollar"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Ingresos Generados</span>
          <span class="stat-value">{{ stats.ingresosGenerados | currency:'USD' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-compact-row {
      background: white;
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
    .text-corporate { color: var(--primary-color) !important; }

    .stat-divider {
      width: 1px;
      height: 35px;
      background: #f1f5f9;
      margin: 0 1.5rem;
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
  `],
  standalone: true,
  imports: [CommonModule]
})
export class VendedorStatsComponent {
  @Input() stats: any = { total: 0, activos: 0, inactivos: 0, empresasTotales: 0, ingresosGenerados: 0 };
}

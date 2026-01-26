import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendedorStats } from '../../services/vendedor.service';

@Component({
  selector: 'app-vendedor-stats',
  template: `
    <div class="stats-compact-row mb-4">
      <!-- Total Vendedores -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(22, 29, 53, 0.05); color: #161d35;">
          <i class="bi bi-people-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Vendedores</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Vendedores Activos -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
          <i class="bi bi-person-check-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Activos</span>
          <div class="d-flex align-items-baseline gap-1">
            <span class="stat-value text-success">{{ stats.activos }}</span>
            <span class="text-muted small" style="font-size: 0.8rem; font-weight: 600;">/ {{ stats.total }}</span>
          </div>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Empresas Captadas -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
          <i class="bi bi-building-up"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Empresas Captadas</span>
          <span class="stat-value">{{ stats.empresasTotales }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Ingresos Generados -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
          <i class="bi bi-cash-stack"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Ingresos Generados</span>
          <span class="stat-value text-warning">{{ stats.ingresosGenerados | currency:'USD' }}</span>
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
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
    }
    .stat-item-mini {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex: 1;
    }
    .icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.2;
    }
    .stat-divider {
      width: 1px;
      height: 40px;
      background: #f1f5f9;
      margin: 0 2rem;
    }
    @media (max-width: 992px) {
      .stats-compact-row {
        flex-wrap: wrap;
        gap: 1.5rem;
        padding: 1.5rem;
      }
      .stat-item-mini {
        flex: 1 1 40%; /* 2 per row on smaller screens */
        min-width: 150px;
      }
      .stat-divider {
        display: none;
      }
    }
    @media (max-width: 576px) {
      .stat-item-mini {
        flex: 1 1 100%; /* 1 per row on mobile */
      }
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class VendedorStatsComponent {
  @Input() stats: VendedorStats = { total: 0, activos: 0, inactivos: 0, empresasTotales: 0, ingresosGenerados: 0 };
}

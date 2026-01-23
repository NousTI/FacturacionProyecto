import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendedorStats } from '../../services/vendedor.service';

@Component({
    selector: 'app-vendedor-stats',
    template: `
    <div class="row g-4">
      <!-- Vendedores Activos -->
      <div class="col-md-3">
        <div class="stat-card-premium active-card">
          <div class="stat-icon-wrapper">
            <i class="bi bi-person-check-fill"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Vendedores Activos</span>
            <div class="d-flex align-items-baseline gap-2">
              <h3 class="stat-value mb-0">{{ stats.activos }}</h3>
              <span class="stat-total text-muted">/ {{ stats.total }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empresas Captadas -->
      <div class="col-md-3">
        <div class="stat-card-premium company-card">
          <div class="stat-icon-wrapper">
            <i class="bi bi-building-up"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Empresas Captadas</span>
            <h3 class="stat-value mb-0">{{ stats.empresasTotales }}</h3>
          </div>
        </div>
      </div>

      <!-- Ingresos Generados -->
      <div class="col-md-6">
        <div class="stat-card-premium revenue-card">
          <div class="stat-icon-wrapper">
            <i class="bi bi-cash-stack"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Ingresos Generados (Fuerza de Ventas)</span>
            <div class="d-flex align-items-center justify-content-between">
                <h3 class="stat-value mb-0 text-success">{{ stats.ingresosGenerados | currency }}</h3>
                <div class="revenue-badge">
                    <i class="bi bi-graph-up-arrow me-1"></i>
                    +12.5%
                </div>
            </div>
          </div>
          <div class="revenue-wave"></div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .stat-card-premium {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .stat-card-premium:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
      border-color: #161d35;
    }
    .stat-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .active-card .stat-icon-wrapper { background: #f0f9ff; color: #0369a1; }
    .company-card .stat-icon-wrapper { background: #f5f3ff; color: #6d28d9; }
    .revenue-card .stat-icon-wrapper { background: #f0fdf4; color: #15803d; z-index: 2; }
    
    .stat-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1e293b;
    }
    .stat-total { font-size: 0.9rem; font-weight: 600; }
    .revenue-badge {
        background: #dcfce7;
        color: #166534;
        font-size: 0.75rem;
        font-weight: 800;
        padding: 4px 12px;
        border-radius: 100px;
        z-index: 2;
    }
    .revenue-wave {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 150px;
        height: 100px;
        background: linear-gradient(45deg, transparent, rgba(34, 197, 94, 0.05));
        clip-path: ellipse(80% 50% at 100% 100%);
    }
  `],
    standalone: true,
    imports: [CommonModule]
})
export class VendedorStatsComponent {
    @Input() stats: VendedorStats = { total: 0, activos: 0, inactivos: 0, empresasTotales: 0, ingresosGenerados: 0 };
}

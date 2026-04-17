import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoTooltipComponent } from '../../../../shared/components/info-tooltip/info-tooltip.component';
import { VendedorHomeStats } from '../services/vendedor-home.service';

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent],
  template: `
    <div class="row g-3 mb-4">
      <!-- Empresas Asignadas -->
      <div class="col-6 col-lg-3">
        <div class="kpi-card-premium">
          <div class="icon-circle status-info-soft">
            <i class="bi bi-building"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">Empresas Asignadas
              <app-info-tooltip message="Total de empresas bajo tu cartera que gestionas activamente."></app-info-tooltip>
            </span>
            <span class="kpi-value">{{ stats?.empresas_asignadas || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Comisiones Pendientes -->
      <div class="col-6 col-lg-3">
        <div class="kpi-card-premium">
          <div class="icon-circle status-warning-soft">
            <i class="bi bi-percent"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">Comisiones Pend.
              <app-info-tooltip message="Monto acumulado de comisiones generadas que aún no han sido liquidadas."></app-info-tooltip>
            </span>
            <span class="kpi-value">{{ (stats?.comisiones_pendientes || 0) | currency }}</span>
          </div>
        </div>
      </div>

      <!-- Ingresos Generados -->
      <div class="col-6 col-lg-3">
        <div class="kpi-card-premium">
          <div class="icon-circle status-success-soft">
            <i class="bi bi-wallet2"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">Ingresos Generados
              <app-info-tooltip message="Total de ingresos SaaS producidos por las empresas de tu cartera."></app-info-tooltip>
            </span>
            <span class="kpi-value">{{ (stats?.ingresos_generados || 0) | currency }}</span>
          </div>
        </div>
      </div>

      <!-- Renovaciones Próximas -->
      <div class="col-6 col-lg-3">
        <div class="kpi-card-premium">
          <div class="icon-circle status-danger-soft">
            <i class="bi bi-clock-history"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">Renovaciones Próx.
              <app-info-tooltip message="Empresas cuya suscripción vence en los próximos 7 días. Requieren seguimiento."></app-info-tooltip>
            </span>
            <span class="kpi-value" [class.text-danger]="(stats?.renovaciones_proximas || 0) > 0">
              {{ stats?.renovaciones_proximas || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card-premium {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.1rem;
      height: 100%;
    }
    .icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .status-info-soft { background: var(--status-info-bg); color: var(--status-info); }
    .status-warning-soft { background: var(--status-warning-bg); color: var(--status-warning); }
    .status-success-soft { background: var(--status-success-bg); color: var(--status-success); }
    .status-danger-soft { background: var(--status-danger-bg); color: var(--status-danger); }

    .kpi-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .kpi-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.2;
    }
    .text-danger {
      color: var(--status-danger-text) !important;
    }

    @media (max-width: 1400px) {
      .kpi-value { font-size: 1.15rem; }
      .kpi-card-premium { padding: 1rem; gap: 0.85rem; }
    }
  `]
})
export class DashboardStatsComponent {
  @Input() stats: VendedorHomeStats | undefined;
}

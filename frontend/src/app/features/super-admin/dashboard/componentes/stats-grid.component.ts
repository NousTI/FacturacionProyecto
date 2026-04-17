import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardKPIs } from '../super-admin-dashboard.service';
import { InfoTooltipComponent } from '../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-super-admin-stats',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent],
  template: `
    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <div class="kpi-card-premium">
          <div class="icon-circle" style="background: var(--status-success-bg); color: var(--status-success-text)">
            <i class="bi bi-building-check"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">Empresas Activas
              <app-info-tooltip message="Número de empresas con suscripción activa en el periodo seleccionado."></app-info-tooltip>
            </span>
            <span class="kpi-value text-success">{{ kpis?.empresas_activas || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="col-6 col-lg-3">
        <div class="kpi-card-premium">
          <div class="icon-circle" style="color: var(--primary-color); background: var(--border-color)">
            <i class="bi bi-wallet2"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">
              {{ getIncomeLabel() }}
              <app-info-tooltip [message]="getIncomeTooltip()"></app-info-tooltip>
            </span>
            <div class="d-flex align-items-baseline gap-2">
              <span class="kpi-value text-truncate">{{ kpis?.ingresos_mensuales || 0 | currency:'USD':'symbol':'1.0-2' }}</span>
              <span class="kpi-trend" [ngClass]="(kpis?.variacion_ingresos || 0) >= 0 ? 'up' : 'down'">
                <i class="bi" [ngClass]="(kpis?.variacion_ingresos || 0) >= 0 ? 'bi-arrow-up-short' : 'bi-arrow-down-short'"></i>
                {{ kpis?.variacion_ingresos || 0 }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-6 col-lg-3">
        <div class="kpi-card-premium">
          <div class="icon-circle" style="background: var(--status-orange-bg); color: var(--status-orange-text)">
            <i class="bi bi-percent"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">Comisiones Pend.
              <app-info-tooltip message="Monto total en comisiones de vendedores que aún no han sido liquidadas."></app-info-tooltip>
            </span>
            <span class="kpi-value text-orange text-truncate">{{ kpis?.comisiones_pendientes || 0 | number }}</span>
          </div>
        </div>
      </div>

      <div class="col-6 col-lg-3">
        <div class="kpi-card-premium">
          <div class="icon-circle" style="background: var(--status-danger-bg); color: var(--status-danger-text)">
            <i class="bi bi-clock-history"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">Próximos Venc.
              <app-info-tooltip message="Empresas cuya suscripción vence en los próximos 7 días y requieren atención."></app-info-tooltip>
            </span>
            <span class="kpi-value" [class.text-danger]="(kpis?.empresas_por_vencer || 0) > 0">
              {{ kpis?.empresas_por_vencer || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-card-premium {
      background: var(--bg-main, #ffffff);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.1rem;
      height: 100%;
      transition: all 0.2s ease;
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
      color: var(--primary-color);
      line-height: 1.2;
    }
    .kpi-trend {
      font-size: 0.75rem;
      font-weight: 700;
    }
    .up { color: var(--status-success-text) !important; }
    .down { color: var(--status-danger-text) !important; }

    .text-success { color: var(--status-success-text) !important; }
    .text-danger { color: var(--status-danger-text) !important; }
    .text-orange { color: var(--status-orange-text) !important; }

    @media (max-width: 1400px) {
      .kpi-value { font-size: 1.15rem; }
      .kpi-card-premium { padding: 1rem; gap: 0.85rem; }
    }
  `]
})
export class SuperAdminStatsComponent implements OnChanges {
  @Input() kpis: DashboardKPIs | undefined;
  @Input() selectedPeriod: string = 'month';

  ngOnChanges() {
    console.log('[StatsGrid] KPIs updated:', this.kpis);
  }

  getIncomeLabel(): string {
    switch (this.selectedPeriod) {
      case 'week': return 'Ingresos de la Semana';
      case 'year': return 'Ingresos del Año';
      default: return 'Ingresos del Mes';
    }
  }

  getIncomeTooltip(): string {
    const periodName = this.selectedPeriod === 'week' ? 'los últimos 7 días' : 
                      this.selectedPeriod === 'year' ? 'el año actual' : 'el mes actual';
    return `Total recaudado por suscripciones SaaS en ${periodName}. El % muestra la variación respecto al periodo anterior equivalente.`;
  }
}

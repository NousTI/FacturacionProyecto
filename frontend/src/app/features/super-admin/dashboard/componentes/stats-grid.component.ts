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
      <!-- Empresas Activas -->
      <div class="col-6 col-lg-3">
        <div class="kpi-card">
          <div class="kpi-icon" style="color:#10b981; background:rgba(16,185,129,.1)">
            <i class="bi bi-building-check"></i>
          </div>
          <div class="kpi-body">
            <span class="kpi-label d-flex align-items-center gap-1">Empresas Activas
              <app-info-tooltip message="Número de empresas con suscripción activa en el periodo seleccionado."></app-info-tooltip>
            </span>
            <span class="kpi-value">{{ kpis?.empresas_activas || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Ingresos Dinámicos -->
      <div class="col-6 col-lg-3">
        <div class="kpi-card shadow-sm border-0">
          <div class="kpi-icon" style="color:#6366f1; background:rgba(99,102,241,.1)">
            <i class="bi bi-wallet2"></i>
          </div>
          <div class="kpi-body">
            <span class="kpi-label d-flex align-items-center gap-1">
              {{ getIncomeLabel() }}
              <app-info-tooltip [message]="getIncomeTooltip()"></app-info-tooltip>
            </span>
            <span class="kpi-value text-truncate">{{ kpis?.ingresos_mensuales || 0 | currency:'USD':'symbol':'1.0-2' }}</span>
            <span class="kpi-trend" [ngClass]="(kpis?.variacion_ingresos || 0) >= 0 ? 'up' : 'down'">
              <i class="bi" [ngClass]="(kpis?.variacion_ingresos || 0) >= 0 ? 'bi-arrow-up-short' : 'bi-arrow-down-short'"></i>
              {{ kpis?.variacion_ingresos || 0 }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Comisiones Pendientes -->
      <div class="col-6 col-lg-3">
        <div class="kpi-card">
          <div class="kpi-icon" style="color:#f59e0b; background:rgba(245,158,11,.1)">
            <i class="bi bi-percent"></i>
          </div>
          <div class="kpi-body">
            <span class="kpi-label d-flex align-items-center gap-1">Comisiones Pend.
              <app-info-tooltip message="Monto total en comisiones de vendedores que aún no han sido liquidadas."></app-info-tooltip>
            </span>
            <span class="kpi-value text-truncate">{{ kpis?.comisiones_pendientes || 0 | number }}</span>
          </div>
        </div>
      </div>

      <!-- Pagos Atrasados / Empresas por vencer -->
      <div class="col-6 col-lg-3">
        <div class="kpi-card">
          <div class="kpi-icon" style="color:#ef4444; background:rgba(239,68,68,.1)">
            <i class="bi bi-clock-history"></i>
          </div>
          <div class="kpi-body">
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
    .kpi-card {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      height: 100%;
    }
    .kpi-icon {
      width: 42px; height: 42px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem; flex-shrink: 0;
    }
    .kpi-body { display: flex; flex-direction: column; min-width: 0; }
    .kpi-label { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
    .kpi-value { font-size: 1.25rem; font-weight: 800; color: #161d35; line-height: 1.2; }
    .kpi-trend { font-size: 0.7rem; font-weight: 700; }
    .kpi-trend.up   { color: #10b981; }
    .kpi-trend.down { color: #ef4444; }
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

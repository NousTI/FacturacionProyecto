import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { InfoTooltipComponent } from '../../../../shared/components/info-tooltip/info-tooltip.component';
import { VendedorHomeStats } from '../services/vendedor-home.service';

@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [CommonModule, StatCardComponent, InfoTooltipComponent],
  template: `
    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <app-stat-card
          title="Empresas Asignadas"
          [value]="stats?.empresas_asignadas?.toString() || '--'"
          icon="bi-building"
          iconBg="rgba(99,102,241,.1)"
          iconColor="#6366f1">
          <app-info-tooltip message="Total de empresas bajo tu cartera que gestionas activamente."></app-info-tooltip>
        </app-stat-card>
      </div>
      <div class="col-6 col-lg-3">
        <app-stat-card
          title="Comisiones Pendientes"
          [value]="(stats?.comisiones_pendientes | currency) || '$--'"
          icon="bi-percent"
          iconBg="rgba(245,158,11,.1)"
          iconColor="#f59e0b">
          <app-info-tooltip message="Monto acumulado de comisiones generadas que aún no han sido liquidadas."></app-info-tooltip>
        </app-stat-card>
      </div>
      <div class="col-6 col-lg-3">
        <app-stat-card
          title="Ingresos Generados"
          [value]="(stats?.ingresos_generados | currency) || '$--'"
          icon="bi-wallet2"
          iconBg="rgba(16,185,129,.1)"
          iconColor="#10b981">
          <app-info-tooltip message="Total de ingresos SaaS producidos por las empresas de tu cartera."></app-info-tooltip>
        </app-stat-card>
      </div>
      <div class="col-6 col-lg-3">
        <app-stat-card
          title="Renovaciones Próximas"
          [value]="stats?.renovaciones_proximas?.toString() || '--'"
          icon="bi-clock-history"
          iconBg="rgba(239,68,68,.1)"
          iconColor="#ef4444">
          <app-info-tooltip message="Empresas cuya suscripción vence en los próximos 7 días. Requieren seguimiento."></app-info-tooltip>
        </app-stat-card>
      </div>
    </div>
  `
})
export class DashboardStatsComponent {
  @Input() stats: VendedorHomeStats | undefined;
}

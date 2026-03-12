import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { StatCardComponent } from '../../../../../shared/components/stat-card/stat-card.component';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';
import { DashboardKPIs } from '../../../../../shared/services/dashboard.service';

@Component({
  selector: 'app-dashboard-kpis',
  standalone: true,
  imports: [CommonModule, StatCardComponent, InfoTooltipComponent],
  providers: [CurrencyPipe],
  template: `
    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">
        <app-stat-card
          title="Monto Facturado"
          [value]="(kpis?.ventas_periodo | currency:'USD':'symbol':'1.2-2') || '$0.00'"
          icon="bi-receipt"
          iconBg="rgba(99,102,241,.1)"
          iconColor="#6366f1">
          <app-info-tooltip message="Suma total de facturas autorizadas en el periodo seleccionado."></app-info-tooltip>
        </app-stat-card>
      </div>
      <div class="col-6 col-lg-3">
        <app-stat-card
          title="Ventas de Hoy"
          [value]="(kpis?.ventas_hoy | currency:'USD':'symbol':'1.2-2') || '$0.00'"
          icon="bi-check-circle"
          iconBg="rgba(16,185,129,.1)"
          iconColor="#10b981">
          <app-info-tooltip message="Monto total de las ventas realizadas durante el día actual."></app-info-tooltip>
        </app-stat-card>
      </div>
      <div class="col-6 col-lg-3">
        <app-stat-card
          title="Saldos Pendientes"
          [value]="(kpis?.cuentas_cobrar | currency:'USD':'symbol':'1.2-2') || '$0.00'"
          icon="bi-hourglass-split"
          iconBg="rgba(245,158,11,.1)"
          iconColor="#f59e0b">
          <app-info-tooltip message="Total de facturas autorizadas que aún no han sido cobradas."></app-info-tooltip>
        </app-stat-card>
      </div>
      <div class="col-6 col-lg-3">
        <app-stat-card
          title="Stock Bajo"
          [value]="kpis?.productos_stock_bajo?.toString() || '0'"
          icon="bi-box-seam"
          iconBg="rgba(14,165,233,.1)"
          iconColor="#0ea5e9">
          <app-info-tooltip message="Cantidad de productos activos cuyo stock actual es menor o igual al mínimo definido."></app-info-tooltip>
        </app-stat-card>
      </div>
    </div>
  `
})
export class DashboardKpisComponent {
  @Input() kpis?: DashboardKPIs;
}

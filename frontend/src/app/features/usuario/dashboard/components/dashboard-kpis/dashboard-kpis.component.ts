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
      <!-- Fila 1: Operativa -->
      <div class="col-6 col-lg-3">
        <app-stat-card
          [title]="getMontoTitle()"
          [value]="(kpis?.ventas_periodo | currency:'USD':'symbol':'1.2-2') || '$0.00'"
          [trend]="kpis?.variacion_ventas"
          icon="bi-receipt"
          iconBg="rgba(99,102,241,.1)"
          iconColor="#6366f1">
          <app-info-tooltip message="Suma total de facturas autorizadas en el periodo seleccionado."></app-info-tooltip>
        </app-stat-card>
      </div>
      <div class="col-6 col-lg-3">
        <app-stat-card
          [title]="getVentasTitle()"
          [value]="kpis?.ventas_hoy?.toString() || '0'"
          icon="bi-check-circle"
          iconBg="rgba(16,185,129,.1)"
          iconColor="#10b981">
          <app-info-tooltip message="Cantidad de comprobantes emitidos durante el periodo seleccionado."></app-info-tooltip>
        </app-stat-card>
      </div>
      <div class="col-6 col-lg-3">
        <app-stat-card
          [title]="getSaldosTitle()"
          [value]="(kpis?.cuentas_cobrar | currency:'USD':'symbol':'1.2-2') || '$0.00'"
          icon="bi-hourglass-split"
          iconBg="rgba(245,158,11,.1)"
          iconColor="#f59e0b">
          <app-info-tooltip message="Total de facturas autorizadas que aún no han sido cobradas en este periodo."></app-info-tooltip>
        </app-stat-card>
      </div>
      <div class="col-6 col-lg-3">
        <app-stat-card
          title="Gastos (Mes)"
          [value]="(kpis?.total_gastos | currency:'USD':'symbol':'1.2-2') || '$0.00'"
          [trend]="kpis?.variacion_gastos"
          icon="bi-wallet2"
          iconBg="rgba(239,68,68,.1)"
          iconColor="#ef4444">
          <app-info-tooltip message="Total de gastos registrados en el sistema durante el periodo actual."></app-info-tooltip>
        </app-stat-card>
      </div>

      <!-- Fila 2: Ejecutiva (Solo si hay datos ejecutivos) -->
      <ng-container *ngIf="kpis?.ticket_promedio">
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Ticket Promedio"
            [value]="(kpis?.ticket_promedio | currency:'USD':'symbol':'1.2-2') || '$0.00'"
            icon="bi-cart-check"
            iconBg="rgba(139,92,246,.1)"
            iconColor="#8b5cf6">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Utilidad Neta"
            [value]="(kpis?.utilidad_neta | currency:'USD':'symbol':'1.2-2') || '$0.00'"
            icon="bi-graph-up-arrow"
            iconBg="rgba(16,185,129,.1)"
            iconColor="#10b981">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="% Recuperación"
            [value]="(kpis?.porcentaje_recuperacion?.toFixed(1) + '%') || '0%'"
            icon="bi-arrow-repeat"
            iconBg="rgba(79,70,229,.1)"
            iconColor="#4f46e5">
          </app-stat-card>
        </div>
        <div class="col-6 col-lg-3">
          <app-stat-card
            title="Clientes Activos"
            [value]="kpis?.clientes_activos?.toString() || '0'"
            icon="bi-people"
            iconBg="rgba(244,63,94,.1)"
            iconColor="#f43f5e">
          </app-stat-card>
        </div>
      </ng-container>
    </div>

  `
})
export class DashboardKpisComponent {
  @Input() kpis?: DashboardKPIs;
  @Input() selectedPeriod: 'day' | 'week' | 'month' = 'month';

  getMontoTitle(): string {
    const map = { day: 'Monto de Hoy', week: 'Monto Semanal', month: 'Monto del Mes' };
    return map[this.selectedPeriod];
  }

  getVentasTitle(): string {
    const map = { day: 'Ventas de Hoy', week: 'Ventas Semanales', month: 'Ventas del Mes' };
    return map[this.selectedPeriod];
  }

  getSaldosTitle(): string {
    const map = { day: 'Saldos de Hoy', week: 'Saldos Semanales', month: 'Saldos del Mes' };
    return map[this.selectedPeriod];
  }
}

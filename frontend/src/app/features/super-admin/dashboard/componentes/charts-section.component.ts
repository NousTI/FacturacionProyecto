import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartCardComponent } from '../../../../shared/components/chart-card/chart-card.component';
import { HorizontalBarCardComponent } from '../../../../shared/components/horizontal-bar-card/horizontal-bar-card.component';
import { DashboardGraficos } from '../super-admin-dashboard.service';
import { InfoTooltipComponent } from '../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-super-admin-charts',
  standalone: true,
  imports: [CommonModule, ChartCardComponent, HorizontalBarCardComponent, InfoTooltipComponent],
  template: `
    <ng-container [ngSwitch]="type">
      <!-- Gráfico de Ingresos SaaS -->
      <div *ngSwitchCase="'income'" class="h-100">
        <app-chart-card
          title="Ingresos SaaS ($)"
          barColor="linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
          [data]="charts?.ingresos_saas || []">
          <app-info-tooltip message="Recaudación mensual por suscripciones de todas las empresas activas."></app-info-tooltip>
        </app-chart-card>
      </div>

      <!-- Distribución por Plan -->
      <div *ngSwitchCase="'plans'" class="h-100">
        <app-horizontal-bar-card
          title="Empresas por Plan"
          [data]="charts?.empresas_by_plan || []">
          <app-info-tooltip message="Cantidad de empresas distribuidas según su plan de suscripción actual."></app-info-tooltip>
        </app-horizontal-bar-card>
      </div>

      <!-- Vista por defecto (ambos) -->
      <div *ngSwitchDefault class="row g-3">
        <div class="col-lg-8">
          <app-chart-card
            title="Ingresos SaaS ($)"
            barColor="linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
            [data]="charts?.ingresos_saas || []">
            <app-info-tooltip message="Recaudación mensual por suscripciones de todas las empresas activas."></app-info-tooltip>
          </app-chart-card>
        </div>
        <div class="col-lg-4">
          <app-horizontal-bar-card
            title="Empresas por Plan"
            [data]="charts?.empresas_by_plan || []">
            <app-info-tooltip message="Cantidad de empresas distribuidas según su plan de suscripción actual."></app-info-tooltip>
          </app-horizontal-bar-card>
        </div>
      </div>
    </ng-container>
  `
})
export class SuperAdminChartsComponent implements OnChanges {
  @Input() charts: DashboardGraficos | undefined;
  @Input() type: 'income' | 'plans' | 'all' = 'all';

  ngOnChanges() {
    console.log(`[SuperAdminCharts] ${this.type} updated:`, this.charts);
  }
}

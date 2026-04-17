import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
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
      <div *ngSwitchCase="'income'" class="h-100 chart-container-premium">
        <app-chart-card
          title="Ingresos SaaS ($)"
          [barColor]="incomeGradient"
          [chartType]="activeChartType"
          [data]="charts?.ingresos_saas || []">
          <app-info-tooltip info message="Recaudación mensual por suscripciones de todas las empresas activas."></app-info-tooltip>
          
          <div actions class="d-flex align-items-center gap-3">
            <!-- Selector de Periodo -->
            <div class="period-selector-premium">
              <button class="pill-btn" 
                      [class.active]="selectedPeriod === 'week'"
                      (click)="setPeriod('week')">Semana</button>
              <button class="pill-btn" 
                      [class.active]="selectedPeriod === 'month'"
                      (click)="setPeriod('month')">Mes</button>
              <button class="pill-btn" 
                      [class.active]="selectedPeriod === 'year'"
                      (click)="setPeriod('year')">Año</button>
            </div>
          </div>
        </app-chart-card>
      </div>

      <!-- Distribución por Plan -->
      <div *ngSwitchCase="'plans'" class="h-100 chart-container-premium">
        <app-horizontal-bar-card
          title="Empresas por Plan"
          [barColor]="primaryColor"
          [data]="planData">
          <app-info-tooltip message="Cantidad de empresas distribuidas según su plan de suscripción actual."></app-info-tooltip>
        </app-horizontal-bar-card>
      </div>

      <!-- Vista por defecto (ambos) -->
      <div *ngSwitchDefault class="row g-4">
        <div class="col-lg-8">
          <div class="chart-container-premium">
            <app-chart-card
              title="Ingresos SaaS ($)"
              [barColor]="incomeGradient"
              [chartType]="activeChartType"
              [data]="charts?.ingresos_saas || []">
              <app-info-tooltip info message="Recaudación mensual por suscripciones de todas las empresas activas."></app-info-tooltip>

              <div actions class="d-flex align-items-center gap-3">
                <div class="period-selector-premium">
                  <button class="pill-btn" [class.active]="selectedPeriod === 'week'" (click)="setPeriod('week')">Sem</button>
                  <button class="pill-btn" [class.active]="selectedPeriod === 'month'" (click)="setPeriod('month')">Mes</button>
                  <button class="pill-btn" [class.active]="selectedPeriod === 'year'" (click)="setPeriod('year')">Año</button>
                </div>
              </div>
            </app-chart-card>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="chart-container-premium">
            <app-horizontal-bar-card
              title="Empresas por Plan"
              [barColor]="primaryColor"
              [data]="planData">
              <app-info-tooltip message="Cantidad de empresas distribuidas según su plan de suscripción actual."></app-info-tooltip>
            </app-horizontal-bar-card>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    :host { 
      display: block; 
      width: 100%;
    }
    
    .chart-container-premium {
      background: var(--bg-main, #ffffff);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;
      min-height: 400px;
      height: 400px;
    }
    
    .period-selector-premium {
      display: flex;
      gap: 4px;
      background: var(--border-color);
      padding: 4px;
      border-radius: 12px;
    }

    .view-selector-premium {
      display: flex;
      gap: 2px;
      background: var(--border-color);
      padding: 3px;
      border-radius: 10px;
    }

    .view-btn {
      border: none;
      background: transparent;
      width: 32px;
      height: 32px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
    }

    .view-btn.active {
      background: var(--bg-main);
      color: var(--primary-color);
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .pill-btn {
      border: none;
      background: transparent;
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .pill-btn:hover {
      color: var(--primary-color);
      background: var(--bg-main);
    }

    .pill-btn.active {
      background: var(--primary-color);
      color: white;
    }
  `]
})
export class SuperAdminChartsComponent implements OnChanges {
  @Input() charts: DashboardGraficos | undefined;
  @Input() type: 'income' | 'plans' | 'all' = 'all';
  @Input() selectedPeriod: string = 'month';
  @Output() periodChange = new EventEmitter<string>();

  activeChartType: 'bar' | 'line' = 'bar';

  // Premium Gradient for Income Chart
  incomeGradient = 'linear-gradient(180deg, #A855F7 0%, #6366F1 100%)';

  // Premium Green Gradient for Plan Bars
  successGradient = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';

  // Using successGradient for the plans chart
  primaryColor = this.successGradient;

  ngOnChanges() {
    console.log(`[SuperAdminCharts] ${this.type} updated:`, this.charts);
  }

  get planData() {
    if (!this.charts?.empresas_by_plan) return [];
    
    // Forzamos el color verde ignorando cualquier color previo que venga del servicio
    return this.charts.empresas_by_plan.map((item) => ({
      ...item,
      color: this.successGradient
    }));
  }

  setPeriod(p: string) {
    this.periodChange.emit(p);
  }
}

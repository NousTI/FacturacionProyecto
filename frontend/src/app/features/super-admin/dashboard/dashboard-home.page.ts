import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../../shared/services/ui.service';
import { SuperAdminService, DashboardOverview, DashboardGraficos } from './super-admin-dashboard.service';
import { SuperAdminStatsComponent } from './componentes/stats-grid.component';
import { SuperAdminChartsComponent } from './componentes/charts-section.component';
import { SuperAdminAlertsComponent } from './componentes/system-alerts.component';
import { RecentCompaniesComponent } from './componentes/recent-companies.component';
import { QuickLinksComponent } from './componentes/quick-links.component';
import { PlanDistributionChartComponent } from './componentes/plan-distribution-chart.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    SuperAdminStatsComponent,
    SuperAdminChartsComponent,
    SuperAdminAlertsComponent,
    RecentCompaniesComponent,
    QuickLinksComponent,
    PlanDistributionChartComponent
  ],
  template: `
    <div class="dash-wrap animate__animated animate__fadeIn">
      <!-- KPIs principales -->
      <app-super-admin-stats 
        [kpis]="overview?.kpis"
        [selectedPeriod]="selectedPeriod">
      </app-super-admin-stats>

      <div class="row g-4">
        <!-- COLUMNA PRINCIPAL (Izquierda) -->
        <div class="col-lg-8 d-flex flex-column gap-4">
          
          <!-- Gráfico de Ingresos -->
          <app-super-admin-charts 
            [charts]="charts" 
            type="income"
            [selectedPeriod]="selectedPeriod"
            (periodChange)="onPeriodChange($event)">
          </app-super-admin-charts>

          <!-- Tabla de Empresas Recientes -->
          <app-recent-companies 
            [empresas]="overview?.empresas_recientes || []"
            class="flex-grow-1">
          </app-recent-companies>
        </div>

        <!-- COLUMNA LATERAL (Derecha) -->
        <div class="col-lg-4 d-flex flex-column gap-4">
          
          <!-- Alertas -->
          <app-super-admin-alerts 
            [alertas]="overview?.alertas" 
            *ngIf="overview?.alertas?.criticas?.length || overview?.alertas?.advertencias?.length">
          </app-super-admin-alerts>

          <!-- Gráfico de Distribución por Plan -->
          <app-plan-distribution-chart 
            [data]="charts?.empresas_by_plan || []">
          </app-plan-distribution-chart>

          <!-- Accesos Rápidos -->
          <app-quick-links class="flex-grow-1"></app-quick-links>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash-wrap { padding-bottom: 3rem; }
  `]
})
export class DashboardHomePage implements OnInit {
  overview: DashboardOverview | undefined;
  charts: DashboardGraficos | undefined;
  selectedPeriod: string = 'month';
  loading: boolean = false;

  constructor(
    private uiService: UiService,
    private superAdminService: SuperAdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.uiService.setPageHeader('Dashboard', 'Resumen del sistema SaaS');
    this.loadData();
  }

  onPeriodChange(period: string) {
    this.selectedPeriod = period;
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.superAdminService.getOverview(this.selectedPeriod).subscribe({
      next: (data) => {
        this.overview = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[DashboardHome] Error loading overview:', err);
        this.loading = false;
      }
    });

    this.superAdminService.getCharts(this.selectedPeriod).subscribe({
      next: (data) => {
        this.charts = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('[DashboardHome] Error loading charts:', err)
    });
  }
}

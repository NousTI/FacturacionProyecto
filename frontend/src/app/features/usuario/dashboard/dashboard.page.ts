import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

// Shared Components
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';

// Feature Components
import { PeriodSelectorComponent } from './components/period-selector/period-selector.component';
import { DashboardKpisComponent } from './components/dashboard-kpis/dashboard-kpis.component';
import { RecentInvoicesComponent } from './components/recent-invoices/recent-invoices.component';
import { StatusCardsComponent } from './components/status-cards/status-cards.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { TopProductsComponent } from './components/top-products/top-products.component';

// Services
import { DashboardFeatureService } from './services/dashboard.service';
import { UiService } from '../../../shared/services/ui.service';
import { DashboardOverview } from '../../../shared/services/dashboard.service';

@Component({
  selector: 'app-usuario-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChartCardComponent,
    PeriodSelectorComponent,
    DashboardKpisComponent,
    RecentInvoicesComponent,
    StatusCardsComponent,
    QuickActionsComponent,
    TopProductsComponent
  ],
  template: `
    <div class="dash-wrap p-4">
      
      <!-- Filtro de Periodo -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <app-period-selector 
          [selectedPeriod]="selectedPeriod" 
          (onPeriodChange)="changePeriod($event)">
        </app-period-selector>
      </div>

      <!-- Estado de Carga -->
      <div *ngIf="loading$ | async" class="d-flex justify-content-center align-items-center" style="height: 400px;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <ng-container *ngIf="overview$ | async as overview">
        <!-- ── FILA 1: KPIs ── -->
        <app-dashboard-kpis [kpis]="overview.kpis"></app-dashboard-kpis>

        <!-- ── FILA 2: GRÁFICOS ── -->
        <div class="row g-3 mb-4">
          <div class="col-12">
            <app-chart-card 
              [title]="'Tendencia de Ventas (vs Anterior)'"
              [data]="overview.ventas_tendencia || []"
              barColor="linear-gradient(135deg, #6366f1 0%, #a855f7 100%)">
            </app-chart-card>
          </div>
        </div>

        <!-- ── FILA 3: Últimas facturas + Accesos rápidos ── -->
        <div class="row g-3 mb-4">
          <div class="col-lg-8">
            <app-recent-invoices [facturas]="overview.facturas_recientes || []"></app-recent-invoices>
          </div>

          <div class="col-lg-4">
            <div class="d-flex flex-column gap-3">
              <app-status-cards 
                [firmaInfo]="overview.firma_info" 
                [consumoPlan]="overview.consumo_plan">
              </app-status-cards>
              <app-quick-actions></app-quick-actions>
            </div>
          </div>
        </div>

        <!-- ── FILA 3: Top Ventas ── -->
        <app-top-products [topProductos]="overview.top_productos || []"></app-top-products>
      </ng-container>

    </div>
  `,
  styles: [`
    .dash-wrap { min-height: 100vh; padding-bottom: 2rem; }
  `]
})
export class DashboardPage implements OnInit {
  overview$: Observable<DashboardOverview | null>;
  loading$: Observable<boolean>;
  selectedPeriod: 'day' | 'week' | 'month' = 'month';

  constructor(
    private uiService: UiService,
    private dashboardFeatureService: DashboardFeatureService,
    private cdr: ChangeDetectorRef
  ) {
    this.overview$ = this.dashboardFeatureService.overview$;
    this.loading$ = this.dashboardFeatureService.loading$;
  }

  ngOnInit() {
    this.uiService.setPageHeader('Dashboard', 'Resumen general de tu actividad');
    this.cargarDatos();
  }

  changePeriod(period: 'day' | 'week' | 'month') {
    this.selectedPeriod = period;
    this.cargarDatos();
  }

  cargarDatos() {
    this.dashboardFeatureService.loadOverview(this.selectedPeriod).subscribe();
  }
}

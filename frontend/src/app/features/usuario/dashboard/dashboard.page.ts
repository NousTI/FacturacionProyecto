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
import { AuthFacade } from '../../../core/auth/auth.facade';
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
    <div class="dash-wrap p-0">
      
      <!-- Estado de Carga -->
      <div *ngIf="loading$ | async" class="d-flex justify-content-center align-items-center" style="height: 400px;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <ng-container *ngIf="overview$ | async as overview">
        <div class="row g-3 mx-0">
          
          <!-- ── COLUMNA IZQUIERDA: MÉTRICAS Y ACTIVIDAD (8/12) ── -->
          <div class="col-lg-8">
            <div class="d-flex flex-column gap-3">
              <!-- KPIs -->
              <app-dashboard-kpis [kpis]="overview.kpis" [selectedPeriod]="selectedPeriod" class="mt-2"></app-dashboard-kpis>

              <!-- Análisis de Tendencias (Bajo KPIs como se solicitó) -->
              <app-chart-card 
                [title]="'Tendencia de Ventas (vs Anterior)'"
                [data]="overview.ventas_tendencia || []"
                barColor="linear-gradient(135deg, #6366f1 0%, #a855f7 100%)">
              </app-chart-card>

              <!-- Actividad Reciente -->
              <app-recent-invoices [facturas]="overview.facturas_recientes || []" class="mb-3"></app-recent-invoices>
            </div>
          </div>

          <!-- ── COLUMNA DERECHA: ESTADO Y HERRAMIENTAS (4/12) ── -->
          <div class="col-lg-4">
            <div class="d-flex flex-column gap-3 mt-2 pe-2">
              
              <!-- Filtro de Periodo (Optimización de espacio: se mueve al sidebar superior) -->
              <div class="d-flex justify-content-end mb-1">
                <app-period-selector 
                  [selectedPeriod]="selectedPeriod" 
                  (onPeriodChange)="changePeriod($event)">
                </app-period-selector>
              </div>

              <!-- Estado Critical (Suscripción y Firma) -->
              <app-status-cards 
                [firmaInfo]="overview.firma_info" 
                [consumoPlan]="overview.consumo_plan">
              </app-status-cards>

              <!-- Accesos Rápidos -->
              <app-quick-actions></app-quick-actions>

              <!-- Desempeño de Productos (Ahora más compacto al lateral) -->
              <app-top-products [topProductos]="overview.top_productos || []"></app-top-products>
            </div>
          </div>

        </div>
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
    private authFacade: AuthFacade,
    private cdr: ChangeDetectorRef
  ) {
    this.overview$ = this.dashboardFeatureService.overview$;
    this.loading$ = this.dashboardFeatureService.loading$;
  }

  ngOnInit() {
    // Timeout para evitar NG0100: ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.uiService.setPageHeader('Dashboard', 'Resumen general de tu actividad');
    });
    this.cargarDatos();
  }

  changePeriod(period: 'day' | 'week' | 'month') {
    this.selectedPeriod = period;
    this.cargarDatos();
  }

  cargarDatos() {
    const user = this.authFacade.getUser() as any;
    
    // 1. Evitar llamadas si ya sabemos localmente que el usuario está bloqueado
    const isEmpresaBloqueada = user?.empresa_activa === false;
    const isSuscripcionBloqueada = user?.empresa_suscripcion_estado && user.empresa_suscripcion_estado !== 'ACTIVA';

    if ((isEmpresaBloqueada || isSuscripcionBloqueada) && !user?.is_superadmin && !user?.is_vendedor) {
      console.log('[DashboardPage] Peticiones omitidas por bloqueo de cuenta/suscripción');
      return;
    }

    // 2. Si no, consultamos (el interceptor manejará si el estado cambió en el servidor)
    this.dashboardFeatureService.loadOverview(this.selectedPeriod).subscribe({
      error: () => {} 
    });
  }
}

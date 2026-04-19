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
import { SalesTrendChartComponent } from './components/sales-trend-chart/sales-trend-chart.component';

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
    TopProductsComponent,
    SalesTrendChartComponent
  ],
  template: `
    <div class="dash-wrap p-0 position-relative">
      
      <!-- 1. Spinner de Carga Inicial (Cero datos) -->
      <div *ngIf="(loading$ | async) && !(overview$ | async)" 
           class="d-flex justify-content-center align-items-center initial-loader">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- 2. Overlay de Carga (Actualizando filtros) -->
      <div *ngIf="(loading$ | async) && (overview$ | async)" class="loading-overlay">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <ng-container *ngIf="overview$ | async as overview">
        
        <!-- Banner de Aviso de Renovación (7 días antes) -->
        <div *ngIf="renewalNotice" class="alert-renewal-flat mx-3 mb-4">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3">
              <div class="icon-static">
                <i class="bi bi-calendar-event-fill fs-4 text-warning"></i>
              </div>
              <div>
                <h5 class="m-0 fw-800 text-dark">Tu suscripción vence en {{ renewalNotice.dias }} días</h5>
                <p class="m-0 text-muted fw-500" style="font-size: 0.85rem;">Renueva tu plan ahora para evitar interrupciones en el servicio.</p>
              </div>
            </div>
            <a [href]="renewalWhatsappUrl" target="_blank" class="btn btn-warning fw-800 rounded-pill px-4 py-2">
              <i class="bi bi-whatsapp me-2"></i>Renovar Plan con mi Asesor
            </a>
          </div>
        </div>

        <div class="row g-3 mx-0">
          
          <!-- KPIs a ancho completo -->
          <div class="col-12 px-3">
             <app-dashboard-kpis [kpis]="overview.kpis" [selectedPeriod]="selectedPeriod" class="mt-2"></app-dashboard-kpis>
          </div>

          <!-- ── COLUMNA IZQUIERDA: MÉTRICAS Y ACTIVIDAD (8/12) ── -->
          <div class="col-lg-8">
            <div class="d-flex flex-column gap-3">

              <!-- Análisis de Tendencias Premium -->
              <app-sales-trend-chart
                class="dashboard-main-chart"
                [data]="overview.ventas_tendencia || []"
                [selectedPeriod]="selectedPeriod"
                (onPeriodChange)="changePeriod($event)">
              </app-sales-trend-chart>

              <!-- Actividad Reciente -->
              <app-recent-invoices [facturas]="overview.facturas_recientes || []" class="mb-3"></app-recent-invoices>
            </div>
          </div>

          <!-- ── COLUMNA DERECHA: HERRAMIENTAS (4/12) ── -->
          <div class="col-lg-4">
            <div class="d-flex flex-column gap-3 pe-2">
              
              <!-- Estado Critical (Suscripción y Firma) -->
              <app-status-cards 
                [firmaInfo]="overview.firma_info" 
                [consumoPlan]="overview.consumo_plan">
              </app-status-cards>

              <!-- Accesos Rápidos -->
              <app-quick-actions></app-quick-actions>

              <!-- Desempeño de Productos -->
              <app-top-products [topProductos]="overview.top_productos || []"></app-top-products>
            </div>
          </div>

        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .dash-wrap { height: 100%; overflow-y: auto; padding-bottom: 2rem; position: relative; }
    
    .dashboard-main-chart {
      display: block;
      height: 400px;
    }

    .initial-loader {
      height: 400px;
      width: 100%;
    }

    .loading-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
    }

    .alert-renewal-flat {
      background: var(--status-warning-bg);
      border: 1px solid var(--status-warning-bg);
      border-left: 5px solid var(--status-warning-text);
      border-radius: 20px;
      padding: 1.25rem 2rem;
    }

    .icon-static {
      width: 50px;
      height: 50px;
      background: var(--status-warning-bg);
      color: var(--status-warning-text);
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fw-800 { font-weight: 800; }
    .fw-500 { font-weight: 500; }

    /* Flatten UI Globally for this module */
    :host ::ng-deep {
      .soft-card, .panel, .quick-link, .editorial-card, .chart-card, .info-tooltip-box {
        box-shadow: none !important;
        transition: none !important;
        animation: none !important;
        transform: none !important;
      }
      
      .cursor-help {
        transition: none !important;
        transform: none !important;
      }
    }
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

  get renewalNotice() {
    return (this.authFacade.getUser() as any)?.aviso_renovacion;
  }

  get renewalWhatsappUrl() {
    const notice = this.renewalNotice;
    if (!notice) return '';
    return `https://wa.me/${notice.phone}?text=${encodeURIComponent(notice.message)}`;
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

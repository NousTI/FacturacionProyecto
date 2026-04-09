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
        
        <!-- Banner de Aviso de Renovación (7 días antes) -->
        <div *ngIf="renewalNotice" class="alert-renewal-glass mx-3 mb-4 animate__animated animate__fadeInDown">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div class="d-flex align-items-center gap-3">
              <div class="icon-pulse">
                <i class="bi bi-calendar-event-fill fs-4 text-warning"></i>
              </div>
              <div>
                <h5 class="m-0 fw-800 text-dark">Tu suscripción vence en {{ renewalNotice.dias }} días</h5>
                <p class="m-0 text-muted fw-500" style="font-size: 0.85rem;">Renueva tu plan ahora para evitar interrupciones en el servicio.</p>
              </div>
            </div>
            <a [href]="renewalWhatsappUrl" target="_blank" class="btn btn-warning fw-800 rounded-pill px-4 shadow-sm py-2">
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
    
    .alert-renewal-glass {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-left: 5px solid #f59e0b;
      border-radius: 20px;
      padding: 1.25rem 2rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
    }

    .icon-pulse {
      width: 50px;
      height: 50px;
      background: rgba(245, 158, 11, 0.1);
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: soft-pulse 2s infinite;
    }

    @keyframes soft-pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.2); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
    }

    .fw-800 { font-weight: 800; }
    .fw-500 { font-weight: 500; }
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

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UiService } from '../../../shared/services/ui.service';
import { SuperAdminService, DashboardOverview, DashboardGraficos } from './super-admin-dashboard.service';
import { SuperAdminStatsComponent } from './componentes/stats-grid.component';
import { SuperAdminChartsComponent } from './componentes/charts-section.component';
import { SuperAdminAlertsComponent } from './componentes/system-alerts.component';
import { InfoTooltipComponent } from '../../../shared/components/info-tooltip/info-tooltip.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SuperAdminStatsComponent,
    SuperAdminChartsComponent,
    SuperAdminAlertsComponent,
    InfoTooltipComponent
  ],
  template: `
    <div class="dash-wrap">
      <!-- KPIs principales (Fila de 4) -->
      <app-super-admin-stats [kpis]="overview?.kpis"></app-super-admin-stats>

      <div class="row g-4">
        <!-- COLUMNA PRINCIPAL (Izquierda - 8/12) -->
        <div class="col-lg-8">
          
          <!-- Gráfico de Ingresos SaaS (Largo) -->
          <div class="mb-4">
            <app-super-admin-charts [charts]="charts" type="income"></app-super-admin-charts>
          </div>

          <!-- Tabla de Empresas Recientes -->
          <div class="panel h-100 shadow-sm border-0">
            <div class="panel-header bg-white border-bottom-0 pt-4 px-4">
              <span class="fs-5 fw-bold d-flex align-items-center gap-1">
                <i class="bi bi-building me-2 text-primary"></i>Empresas Recientes
                <app-info-tooltip message="Las últimas empresas que se registraron en la plataforma, ordenadas por fecha de incorporación."></app-info-tooltip>
              </span>
              <a routerLink="/empresas" class="panel-header-link text-decoration-none">Ver todas <i class="bi bi-arrow-right-short"></i></a>
            </div>
            <div class="table-responsive p-3">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                  <tr>
                    <th class="border-0 rounded-start">Empresa</th>
                    <th class="border-0">Plan</th>
                    <th class="border-0">Estado</th>
                    <th class="border-0 text-end rounded-end">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let emp of overview?.empresas_recientes" class="border-bottom-0">
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar-sm bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center">
                          <i class="bi bi-building"></i>
                        </div>
                        <div>
                          <div class="fw-bold text-dark">{{ emp.nombre_comercial }}</div>
                          <div class="text-muted extra-small">{{ emp.id | slice:0:8 }}</div>
                        </div>
                      </div>
                    </td>
                    <td><span class="badge bg-secondary-subtle text-secondary border-0">{{ emp.plan_nombre || 'Sin Plan' }}</span></td>
                    <td>
                      <span class="badge" [ngClass]="emp.activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                        <i class="bi bi-dot fs-4 align-middle"></i>
                        {{ emp.activo ? 'Activa' : 'Inactiva' }}
                      </span>
                    </td>
                    <td class="text-end text-muted small fw-medium">{{ emp.fecha_registro | date:'MMM d, y' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="!overview?.empresas_recientes?.length" class="p-5 text-center text-muted">
              <i class="bi bi-inbox fs-2 d-block mb-2 text-light"></i>
              No hay empresas registradas recientemente.
            </div>
          </div>
        </div>

        <!-- COLUMNA LATERAL (Derecha - 4/12) -->
        <div class="col-lg-4">
          
          <!-- Alertas Críticas (Solo si existen) -->
          <app-super-admin-alerts [alertas]="overview?.alertas" class="mb-4 d-block" *ngIf="overview?.alertas?.criticas?.length || overview?.alertas?.advertencias?.length"></app-super-admin-alerts>

          <!-- Gráfico de Planes (Formato Vertical/Compacto) -->
          <div class="mb-4">
            <app-super-admin-charts [charts]="charts" type="plans"></app-super-admin-charts>
          </div>

          <!-- Accesos Rápidos (Panel Estilizado) -->
          <div class="panel shadow-sm border-0">
            <div class="panel-header bg-white border-bottom-0 pt-4 px-4">
              <span class="fw-bold d-flex align-items-center gap-1">
                <i class="bi bi-lightning-charge me-2 text-warning"></i>Accesos Rápidos
                <app-info-tooltip message="Atajos directos a las acciones más frecuentes: crear empresa, gestionar vendedores y revisar reportes globales."></app-info-tooltip>
              </span>
            </div>
            <div class="quick-links p-3">
              <a routerLink="/empresas" [queryParams]="{ new: 'true' }" class="quick-link rounded-3 mb-2 border-0 bg-light-hover">
                <div class="ql-icon" style="color:#6366f1; background:rgba(99,102,241,.1)">
                  <i class="bi bi-plus-circle"></i>
                </div>
                <span>Nueva Empresa</span>
                <i class="bi bi-chevron-right ms-auto text-muted small"></i>
              </a>
              <a routerLink="/vendedores" class="quick-link rounded-3 mb-2 border-0 bg-light-hover">
                <div class="ql-icon" style="color:#0ea5e9; background:rgba(14,165,233,.1)">
                  <i class="bi bi-person-badge"></i>
                </div>
                <span>Gestionar Vendedores</span>
                <i class="bi bi-chevron-right ms-auto text-muted small"></i>
              </a>
              <a routerLink="/reportes" class="quick-link rounded-3 border-0 bg-light-hover">
                <div class="ql-icon" style="color:#f59e0b; background:rgba(245,158,11,.1)">
                  <i class="bi bi-file-earmark-bar-graph"></i>
                </div>
                <span>Reportes Globales</span>
                <i class="bi bi-chevron-right ms-auto text-muted small"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash-wrap { min-height: 100vh; padding-bottom: 2rem; }
    .panel {
      background: white; border: 1px solid #f1f5f9;
      border-radius: 14px; overflow: hidden;
      display: flex; flex-direction: column;
    }
    .panel-header {
      padding: 1rem 1.25rem; font-size: 0.85rem;
      font-weight: 800; color: #1e293b;
      border-bottom: 1px solid #f1f5f9; background: #f8fafc;
      display: flex; justify-content: space-between; align-items: center;
    }
    .panel-header-link { font-size: 0.75rem; font-weight: 700; color: #6366f1; text-decoration: none; }
    
    .table thead th {
      font-size: 0.7rem; font-weight: 800; color: #94a3b8;
      text-transform: uppercase; border-bottom: 1px solid #f1f5f9;
      padding: 0.8rem 1.25rem; background: white;
    }
    .table tbody td { padding: 1rem 1.25rem; vertical-align: middle; font-size: 0.875rem; }
    
    .avatar-sm { width: 32px; height: 32px; font-size: 0.9rem; }
    
    .quick-links { display: flex; flex-direction: column; }
    .quick-link {
      display: flex; align-items: center; gap: 0.85rem;
      padding: 0.85rem 1.25rem; font-size: 0.875rem;
      font-weight: 600; color: #334155;
      text-decoration: none; border-bottom: 1px solid #f8fafc;
      transition: all 0.2s;
    }
    .quick-link:hover { background: #f8fafc; color: #161d35; transform: translateX(4px); }
    .quick-link:last-child { border-bottom: none; }
    .ql-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0;
    }
    .badge { font-weight: 700; padding: 5px 8px; border-radius: 6px; }
    
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .btn-white { background: white; border: none; color: #64748b; }
    .btn-white:hover { background: #f8fafc; color: #1e293b; }
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

  loadData() {
    this.loading = true;
    this.superAdminService.getOverview(this.selectedPeriod).subscribe({
      next: (data) => {
        console.log('[DashboardHome] Overview received:', data);
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
        console.log('[DashboardHome] Charts received:', data);
        this.charts = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('[DashboardHome] Error loading charts:', err)
    });
  }
}

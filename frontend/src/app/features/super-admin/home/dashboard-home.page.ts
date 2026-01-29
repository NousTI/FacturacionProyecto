import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { AlertCardComponent, DashboardAlert } from '../../../shared/components/alert-card/alert-card.component';
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';
import { HorizontalBarCardComponent } from '../../../shared/components/horizontal-bar-card/horizontal-bar-card.component';
import { DashboardService, DashboardKPIs, DashboardAlertas } from '../../../shared/services/dashboard.service';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { UserRole } from '../../../domain/enums/role.enum';

@Component({
  selector: 'app-dashboard-home',
  template: `
    <div class="dashboard-container">
      <!-- Maintenance Card for non-Superadmins -->
      <ng-container *ngIf="isSuperadmin$ | async; else maintenance">
        <!-- Main KPIs -->
      <!-- Main KPIs -->
      <div *ngIf="error" class="row mb-5">
        <div class="col-12">
            <div class="alert alert-danger px-4 py-3 rounded-4 border-0 d-flex align-items-center">
                <i class="bi bi-exclamation-octagon-fill fs-4 me-3"></i>
                <div>
                    <h5 class="mb-1 fw-bold">Error de conexión</h5>
                    <p class="mb-0">No se pudieron cargar los datos del dashboard.</p>
                </div>
            </div>
        </div>
      </div>

      <div class="row g-4 mb-5" *ngIf="!error">
        <ng-container *ngIf="kpis; else loadingCheck">
            <div class="col-md-3">
            <app-stat-card 
                title="Empresas Activas" 
                [value]="kpis.empresas_activas" 
                icon="bi-building-check" 
                iconBg="rgba(16, 185, 129, 0.1)" 
                iconColor="#10b981">
            </app-stat-card>
            </div>
            <div class="col-md-3">
            <app-stat-card 
                title="Ingresos Mensuales" 
                [value]="(kpis.ingresos_mensuales | currency) || ''" 
                icon="bi-wallet2" 
                iconBg="rgba(99, 102, 241, 0.1)" 
                iconColor="#6366f1"
                [trend]="kpis.variacion_ingresos">
            </app-stat-card>
            </div>
            <div class="col-md-3">
            <app-stat-card 
                title="Comisiones Pendientes" 
                [value]="(kpis.comisiones_pendientes | currency) || ''" 
                icon="bi-percent" 
                iconBg="rgba(245, 158, 11, 0.1)" 
                iconColor="#f59e0b">
            </app-stat-card>
            </div>
            <div class="col-md-3">
            <app-stat-card 
                title="Pagos Atrasados" 
                [value]="kpis.pagos_atrasados" 
                icon="bi-clock-history" 
                iconBg="rgba(239, 68, 68, 0.1)" 
                iconColor="#ef4444">
            </app-stat-card>
            </div>
        </ng-container>
        <ng-template #loadingCheck>
            <div *ngIf="loading" class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        </ng-template>
      </div>

      <!-- Alerts and charts row -->
      <div class="row g-4">
        <div class="col-lg-4">
          <app-alert-card [alerts]="criticalAlerts"></app-alert-card>
        </div>
        <div class="col-lg-4">
          <app-chart-card 
            title="Ingresos Mensuales ($)" 
            barColor="var(--primary-gradient)"
            [data]="incomeData">
          </app-chart-card>
        </div>
        <div class="col-lg-4">
          <app-horizontal-bar-card 
            title="Empresas por Plan" 
            [data]="plansData">
          </app-horizontal-bar-card>
        </div>
      </div>
      </ng-container>

      <ng-template #maintenance>
        <app-maintenance></app-maintenance>
      </ng-template>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      animation: fadeIn 0.8s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  standalone: true,
  imports: [CommonModule, StatCardComponent, AlertCardComponent, ChartCardComponent, HorizontalBarCardComponent, MaintenanceComponent]
})
export class DashboardHomePage implements OnInit {
  // KPIs
  kpis: DashboardKPIs | null = null;
  loading = true;
  error = false;

  // Alerts
  criticalAlerts: DashboardAlert[] = [];

  // Charts
  incomeData: { label: string, value: number }[] = [];
  plansData: { label: string, value: number, percent: number, color?: string }[] = [];
  isSuperadmin$: Observable<boolean>;

  constructor(
    private dashboardService: DashboardService,
    private authFacade: AuthFacade,
    private cdr: ChangeDetectorRef
  ) {
    this.isSuperadmin$ = this.authFacade.user$.pipe(map(user => user?.role === UserRole.SUPERADMIN));
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.loading = true;

    // Load Overview (KPIs + Alerts)
    this.dashboardService.getOverview().pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (data) => {
        try {
          console.log('Dashboard data received:', data);
          this.kpis = data.kpis;
          // Transform backend alerts to frontend structure if necessary
          // Backend: { criticas: [], advertencias: [], informativas: [] }
          // Frontend AlertCard expects a flat list with types mapable to styles
          this.processAlerts(data.alertas);
          this.cdr.markForCheck();
        } catch (e) {
          console.error('Error processing dashboard data:', e);
          this.error = true;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error loading dashboard kpis:', err);
        this.error = true;
        this.cdr.markForCheck();
      }
    });

    // Load Charts
    this.dashboardService.getChartsData().subscribe({
      next: (data) => {
        this.incomeData = data.ingresos_saas;
        // Transform plan data 
        // Backend: {name, count, percent, color}
        this.plansData = data.empresas_by_plan.map(p => ({
          label: p.name,
          value: p.count,
          percent: p.percent,
          color: p.color
        }));
        // Sort by percent descending just in case
        this.plansData.sort((a, b) => b.percent - a.percent);
      },
      error: (err) => console.error('Error loading charts:', err)
    });
  }

  private processAlerts(alertas: DashboardAlertas) {
    // Combine all alerts into one list for the AlertCard component
    // Map backend 'nivel' to frontend 'type' if they differ, but they seem aligned (critical/warning/info vs danger/warning/info)
    const criticas = alertas.criticas.map(a => ({
      type: 'danger' as const,
      message: a.mensaje,
      count: a.cantidad
    }));

    const advertencias = alertas.advertencias.map(a => ({
      type: 'warning' as const,
      message: a.mensaje,
      count: a.cantidad
    }));

    const informativas = alertas.informativas.map(a => ({
      type: 'info' as const,
      message: a.mensaje,
      count: a.cantidad
    }));

    this.criticalAlerts = [...criticas, ...advertencias, ...informativas];
  }
}

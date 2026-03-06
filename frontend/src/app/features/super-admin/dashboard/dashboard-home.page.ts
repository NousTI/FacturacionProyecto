import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { PremiumAlertComponent } from '../../../shared/components/premium-alert/premium-alert.component';
import { ChartCardComponent } from '../../../shared/components/chart-card/chart-card.component';
import { HorizontalBarCardComponent } from '../../../shared/components/horizontal-bar-card/horizontal-bar-card.component';
import { UiService } from '../../../shared/services/ui.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatCardComponent,
    PremiumAlertComponent,
    ChartCardComponent,
    HorizontalBarCardComponent,
  ],
  template: `
    <div class="dash-wrap">

      <!-- ── FILA 1: KPIs estáticos ── -->
      <div class="row g-3 mb-4">

        <div class="col-6 col-lg-3">
          <div class="kpi-card">
            <div class="kpi-icon" style="color:#10b981; background:rgba(16,185,129,.1)">
              <i class="bi bi-building-check"></i>
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Empresas Activas</span>
              <span class="kpi-value">24</span>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="kpi-card">
            <div class="kpi-icon" style="color:#6366f1; background:rgba(99,102,241,.1)">
              <i class="bi bi-wallet2"></i>
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Ingresos del Mes</span>
              <span class="kpi-value">$4,820</span>
              <span class="kpi-trend up"><i class="bi bi-arrow-up-short"></i>12%</span>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="kpi-card">
            <div class="kpi-icon" style="color:#f59e0b; background:rgba(245,158,11,.1)">
              <i class="bi bi-percent"></i>
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Comisiones Pendientes</span>
              <span class="kpi-value">$640</span>
            </div>
          </div>
        </div>

        <div class="col-6 col-lg-3">
          <div class="kpi-card">
            <div class="kpi-icon" style="color:#ef4444; background:rgba(239,68,68,.1)">
              <i class="bi bi-clock-history"></i>
            </div>
            <div class="kpi-body">
              <span class="kpi-label">Pagos Atrasados</span>
              <span class="kpi-value text-danger">3</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ── FILA 2: Alerta + Gráficos ── -->
      <div class="row g-3 mb-4">

        <div class="col-lg-4">
          <app-premium-alert
            title="Sistema Saludable"
            message="Todos los servicios operan con normalidad."
            type="success"
            icon="bi-shield-check">
          </app-premium-alert>
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

      <!-- ── FILA 3: Actividad reciente + Accesos rápidos ── -->
      <div class="row g-3">

        <div class="col-lg-8">
          <div class="panel">
            <div class="panel-header">
              <span><i class="bi bi-activity me-2"></i>Actividad Reciente</span>
              <a routerLink="/auditoria" class="panel-header-link">Ver auditoría</a>
            </div>
            <table class="table table-sm table-hover mb-0">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Empresa / Actor</th>
                  <th class="text-end">Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ev of mockActividad">
                  <td><span class="ev-badge" [ngClass]="ev.cls">{{ ev.tipo }}</span></td>
                  <td class="text-muted small">{{ ev.actor }}</td>
                  <td class="text-end text-muted small">{{ ev.fecha }}</td>
                </tr>
              </tbody>
            </table>
            <div class="panel-footer text-center">
              <a routerLink="/auditoria" class="text-primary small fw-bold text-decoration-none">
                Ver log completo <i class="bi bi-arrow-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="panel h-100">
            <div class="panel-header">
              <span><i class="bi bi-lightning-charge me-2"></i>Accesos Rápidos</span>
            </div>
            <div class="quick-links">
              <a routerLink="/empresas" class="quick-link">
                <div class="ql-icon" style="color:#6366f1; background:rgba(99,102,241,.1)">
                  <i class="bi bi-building-add"></i>
                </div>
                <span>Nueva Empresa</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
              <a routerLink="/vendedores" class="quick-link">
                <div class="ql-icon" style="color:#0ea5e9; background:rgba(14,165,233,.1)">
                  <i class="bi bi-person-badge"></i>
                </div>
                <span>Vendedores</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
              <a routerLink="/suscripciones" class="quick-link">
                <div class="ql-icon" style="color:#f59e0b; background:rgba(245,158,11,.1)">
                  <i class="bi bi-credit-card"></i>
                </div>
                <span>Suscripciones</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
              <a routerLink="/comisiones" class="quick-link">
                <div class="ql-icon" style="color:#10b981; background:rgba(16,185,129,.1)">
                  <i class="bi bi-percent"></i>
                </div>
                <span>Comisiones</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
              <a routerLink="/reportes" class="quick-link">
                <div class="ql-icon" style="color:#ec4899; background:rgba(236,72,153,.1)">
                  <i class="bi bi-file-earmark-bar-graph"></i>
                </div>
                <span>Reportes</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
              <a routerLink="/auditoria" class="quick-link">
                <div class="ql-icon" style="color:#64748b; background:rgba(100,116,139,.1)">
                  <i class="bi bi-shield-check"></i>
                </div>
                <span>Auditoría</span>
                <i class="bi bi-chevron-right ms-auto text-muted"></i>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dash-wrap { min-height: 100vh; padding-bottom: 2rem; }

    .kpi-card {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .kpi-icon {
      width: 46px; height: 46px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem; flex-shrink: 0;
    }
    .kpi-body { display: flex; flex-direction: column; }
    .kpi-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
    .kpi-value { font-size: 1.4rem; font-weight: 800; color: #161d35; line-height: 1.2; }
    .kpi-trend { font-size: 0.75rem; font-weight: 700; }
    .kpi-trend.up   { color: #10b981; }
    .kpi-trend.down { color: #ef4444; }

    .panel {
      background: white; border: 1px solid #f1f5f9;
      border-radius: 14px; overflow: hidden;
      display: flex; flex-direction: column;
    }
    .panel-header {
      padding: 0.9rem 1.25rem; font-size: 0.85rem;
      font-weight: 800; color: #1e293b;
      border-bottom: 1px solid #f1f5f9; background: #f8fafc;
      display: flex; justify-content: space-between; align-items: center;
    }
    .panel-header-link { font-size: 0.75rem; font-weight: 700; color: #6366f1; text-decoration: none; }
    .panel-footer { padding: 0.75rem; border-top: 1px solid #f1f5f9; background: #f8fafc; }

    .table thead th {
      font-size: 0.7rem; font-weight: 800; color: #94a3b8;
      text-transform: uppercase; border-bottom: 1px solid #f1f5f9;
      padding: 0.6rem 1rem; background: white;
    }
    .table tbody td { padding: 0.75rem 1rem; vertical-align: middle; font-size: 0.875rem; }

    .ev-badge {
      font-size: 0.68rem; font-weight: 800;
      padding: 3px 8px; border-radius: 6px;
      text-transform: uppercase;
    }
    .ev-success   { background: #ecfdf5; color: #10b981; }
    .ev-warning   { background: #fff7ed; color: #f59e0b; }
    .ev-danger    { background: #fef2f2; color: #ef4444; }
    .ev-info      { background: #eff6ff; color: #3b82f6; }
    .ev-secondary { background: #f1f5f9; color: #64748b; }

    .quick-links { display: flex; flex-direction: column; }
    .quick-link {
      display: flex; align-items: center; gap: 0.85rem;
      padding: 0.85rem 1.25rem; font-size: 0.875rem;
      font-weight: 600; color: #334155;
      text-decoration: none; border-bottom: 1px solid #f8fafc;
      transition: background 0.15s;
    }
    .quick-link:hover { background: #f8fafc; color: #161d35; }
    .quick-link:last-child { border-bottom: none; }
    .ql-icon {
      width: 34px; height: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
  `]
})
export class DashboardHomePage implements OnInit {

  // Datos mock estáticos — sin llamadas al backend
  incomeData = [
    { label: 'Oct', value: 3200 },
    { label: 'Nov', value: 4100 },
    { label: 'Dic', value: 3800 },
    { label: 'Ene', value: 4600 },
    { label: 'Feb', value: 4200 },
    { label: 'Mar', value: 4820 },
  ];

  plansData = [
    { label: 'Plan Pro',    value: 14, percent: 58, color: '#6366f1' },
    { label: 'Plan Básico', value: 7,  percent: 29, color: '#10b981' },
    { label: 'Plan Free',   value: 3,  percent: 13, color: '#94a3b8' },
  ];

  mockActividad = [
    { tipo: 'PLAN ACTIVADO',   cls: 'ev-badge ev-success',   actor: 'Empresa ABC',        fecha: 'Hoy, 10:34' },
    { tipo: 'PAGO PENDIENTE',  cls: 'ev-badge ev-warning',   actor: 'Empresa XYZ',        fecha: 'Hoy, 09:10' },
    { tipo: 'EMPRESA CREADA',  cls: 'ev-badge ev-info',      actor: 'Demo Corp',           fecha: 'Ayer, 16:22' },
    { tipo: 'PLAN VENCIDO',    cls: 'ev-badge ev-danger',    actor: 'Inversiones SA',     fecha: 'Ayer, 08:00' },
    { tipo: 'COMISIÓN PAGADA', cls: 'ev-badge ev-secondary', actor: 'Vendedor: J. Pérez', fecha: '02/03, 14:00' },
  ];

  constructor(private uiService: UiService) {}

  ngOnInit() {
    this.uiService.setPageHeader('Dashboard', 'Resumen del sistema SaaS');
  }
}

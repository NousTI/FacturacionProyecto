import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatCardComponent } from '../widgets/stat-card/stat-card.component';
import { DashboardService, DashboardSummary, ChartData } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-resumen-general',
  standalone: true,
  imports: [CommonModule, StatCardComponent],
  template: `
    <div class="resumen-content">

      <!-- KPIs Section -->
      <div class="row g-4 mb-4">
        <div class="col-12 col-md-6 col-lg-3">
          <app-stat-card 
            icon="🏢" 
            title="Empresas Totales" 
            [value]="summary()?.total_empresas?.toString() || '0'" 
            [trend]="summary()?.trend_empresas || '+0%'" 
            [subtext]="(summary()?.empresas_activas || 0) + ' activas / ' + (summary()?.empresas_inactivas || 0) + ' inactivas'"
            [fullColor]="true">
          </app-stat-card>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <app-stat-card 
            icon="👥" 
            title="Usuarios Totales" 
            [value]="summary()?.total_usuarios?.toString()  || '0'" 
            [trend]="summary()?.trend_usuarios || '+0%'" 
            subtext="Crecimiento mensual">
          </app-stat-card>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <app-stat-card 
            icon="📄" 
            title="Facturas Emitidas" 
            [value]="summary()?.total_facturas?.toString()  || '0'" 
            [trend]="summary()?.trend_facturas || '+0%'" 
            subtext="Acumulado global">
          </app-stat-card>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <app-stat-card 
            icon="💰" 
            title="Ingresos Sistema" 
            [value]="'$' + (summary()?.ingresos_totales | number:'1.2-2')" 
            [trend]="summary()?.trend_ingresos || '+0%'" 
            subtext="Mes actual vs anterior">
          </app-stat-card>
        </div>
        <div class="col-12 col-md-6 col-lg-4">
          <app-stat-card 
            icon="⏳" 
            title="Comisiones Pendientes" 
            [value]="'$' + (summary()?.comisiones_pendientes_monto | number:'1.2-2')" 
            trend="Por cobrar" 
            [subtext]="(summary()?.comisiones_pendientes_count || 0) + ' pagos por liquidar'">
          </app-stat-card>
        </div>
        <div class="col-12 col-md-6 col-lg-4">
          <app-stat-card 
            icon="⚠️" 
            title="Errores SRI" 
            [value]="summary()?.errores_sri_msg || '0'" 
            trend="-" 
            subtext="Últimos 7 días"
            [fullColor]="false">
          </app-stat-card>
        </div>
        <div class="col-12 col-md-6 col-lg-4">
          <app-stat-card 
            icon="📜" 
            title="Certificados por Vencer" 
            [value]="summary()?.certificados_msg || '0'" 
            trend="-" 
            subtext="Próximos 30 días">
          </app-stat-card>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="row g-4 mb-4">
        <!-- 📈 Facturas Emitidas -->
        <div class="col-12 col-lg-6">
          <div class="chart-card bg-white p-4 rounded-5 shadow-sm h-100">
            <h5 class="fw-bold mb-4 d-flex align-items-center">
                <span class="me-2 text-primary">📈</span> Facturas emitidas por mes
            </h5>
            <div class="d-flex" style="height: 200px;">
                <!-- Y-Axis Labels -->
                <div class="d-flex flex-column justify-content-between text-end pe-2 text-secondary small" style="width: 40px; font-size: 0.7rem;">
                    <span>100</span>
                    <span>75</span>
                    <span>50</span>
                    <span>25</span>
                    <span>0</span>
                </div>
                <!-- Chart Area -->
                <div class="chart-box d-flex align-items-end justify-content-between px-2 flex-grow-1 border-start border-bottom">
                  @for (bar of charts()?.facturas_mes; track $index) {
                    <div class="bar-container d-flex flex-column align-items-center" style="width: 12%;">
                      <!-- Scale height relative to max expected (e.g. 100 for now, or dynamic?) Using fixed 100 max for visual consistency per user request -->
                      <div class="bar rounded-pill" [style.height.%]="(bar.value > 100 ? 100 : bar.value)" [style.background]="'#4f46e5'" 
                           title="{{bar.value}} facturas"></div>
                      <span class="small text-secondary mt-2 text-truncate w-100 text-center" style="font-size: 0.7rem;">{{ bar.label }}</span>
                    </div>
                  }
                </div>
            </div>
          </div>
        </div>

        <!-- 💰 Ingresos SaaS -->
        <div class="col-12 col-lg-6">
          <div class="chart-card bg-white p-4 rounded-5 shadow-sm h-100">
            <h5 class="fw-bold mb-4 d-flex align-items-center">
                <span class="me-2 text-success">💰</span> Ingresos del SaaS mensual
            </h5>
            <div class="d-flex" style="height: 200px;">
                <!-- Y-Axis Labels -->
                <div class="d-flex flex-column justify-content-between text-end pe-2 text-secondary small" style="width: 40px; font-size: 0.7rem;">
                    <span>$1k</span>
                    <span>$750</span>
                    <span>$500</span>
                    <span>$250</span>
                    <span>$0</span>
                </div>
                <!-- Chart Area -->
                <div class="chart-box d-flex align-items-end justify-content-between px-2 flex-grow-1 border-start border-bottom">
                  @for (item of charts()?.ingresos_saas; track $index) {
                    <div class="bar-container d-flex flex-column align-items-center" style="width: 12%;">
                      <!-- Assuming max scale 1000 for demo, or we can make it dynamic later. User requested visual fix. -->
                      <div class="bar rounded-pill" [style.height.%]="(item.value > 1000 ? 100 : (item.value / 10))" [style.background]="'linear-gradient(180deg, #10b981 0%, #059669 100%)'"
                           title="$ {{item.value}}"></div>
                      <span class="small text-secondary mt-2 text-truncate w-100 text-center" style="font-size: 0.7rem;">{{ item.label }}</span>
                    </div>
                  }
                </div>
            </div>
          </div>
        </div>

        <!-- 📊 Empresas por Plan -->
        <div class="col-12 col-lg-6">
          <div class="chart-card bg-white p-4 rounded-5 shadow-sm">
            <h5 class="fw-bold mb-4 d-flex align-items-center">
                <span class="me-2 text-warning">📊</span> Empresas por plan
            </h5>
            <div class="d-flex flex-column gap-3">
                @for (plan of charts()?.empresas_by_plan; track $index) {
                    <div>
                        <div class="d-flex justify-content-between mb-1">
                            <span class="small fw-semibold text-dark">{{ plan.name }}</span>
                            <span class="small text-secondary">{{ plan.count }} empresas ({{ plan.percent }}%)</span>
                        </div>
                        <div class="progress rounded-pill bg-light" style="height: 12px;">
                            <div class="progress-bar rounded-pill" [style.width.%]="plan.percent" [style.background]="plan.color"></div>
                        </div>
                    </div>
                }
            </div>
          </div>
        </div>

        <!-- ⚠️ Errores SRI Tendencia -->
        <div class="col-12 col-lg-6">
          <div class="chart-card bg-white p-4 rounded-5 shadow-sm">
            <h5 class="fw-bold mb-4 d-flex align-items-center">
                <span class="me-2 text-danger">⚠️</span> Errores SRI (Tendencia)
            </h5>
            <div class="d-flex align-items-end gap-2" style="height: 120px;">
                @for (val of charts()?.sri_trend; track $index) {
                    <div class="flex-grow-1 bg-danger bg-opacity-10 rounded-top" [style.height.%]="val * 2" [style.opacity]="0.3 + (val/100)"></div>
                }
            </div>
            <div class="d-flex justify-content-between mt-2 text-secondary small">
                <span>Hace 30 días</span>
                <span>Hoy</span>
            </div>
            <div class="mt-3 p-3 rounded-4 bg-danger bg-opacity-10 text-danger border border-danger border-opacity-10 d-flex align-items-center gap-2">
                <i class="bi bi-info-circle-fill"></i>
                <span class="small fw-bold">Se registra una reducción del 15% en errores de validación este mes.</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .resumen-content {
      display: block;
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .rounded-5 {
      border-radius: 32px !important;
    }
    .chart-box {
      border-bottom: 2px solid #f8f9fa;
    }
    .bar {
      width: 100%;
      min-height: 4px;
      transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .bar:hover {
      transform: scaleY(1.1);
      filter: brightness(1.1);
      cursor: pointer;
    }
    .progress {
        overflow: visible;
    }
    .progress-bar {
        transition: width 1s ease-in-out;
    }
  `]
})
export class ResumenGeneralComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  summary = signal<DashboardSummary | null>(null);
  charts = signal<ChartData | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Load summary
    this.dashboardService.getSummary().subscribe({
      next: (data) => this.summary.set(data),
      error: (err) => console.error('Error loading dashboard summary', err)
    });

    // Load charts
    this.dashboardService.getCharts().subscribe({
      next: (data) => this.charts.set(data),
      error: (err) => console.error('Error loading dashboard charts', err)
    });
  }
}

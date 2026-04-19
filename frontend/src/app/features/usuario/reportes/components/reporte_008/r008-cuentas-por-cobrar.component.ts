import { Component, Input, OnChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsReceivableReport } from '../../services/financial-reports.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ResponsableTooltipComponent } from './responsable-tooltip.component';

Chart.register(...registerables);

@Component({
  selector: 'app-r008-cuentas-por-cobrar',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, PercentPipe, FormsModule, ResponsableTooltipComponent],
  template: `
    <div class="fade-in">

      <!-- KPIs Superiores -->
      <div class="kpi-grid mb-4">

        <div class="kpi-card highlight">
          <span class="label">Total por Cobrar</span>
          <span class="value">{{ data.kpis.total_por_cobrar | currency }}</span>
          <span class="subtext">Saldo pendiente global</span>
        </div>

        <div class="kpi-card amber">
          <span class="label">Vencido < 30 días</span>
          <span class="value">{{ data.kpis.vencido_menor_30 | currency }}</span>
          <span class="subtext">Requiere gestión</span>
        </div>

        <div class="kpi-card red">
          <span class="label">Cartera Crítica > 30 días</span>
          <span class="value">{{ data.kpis.cartera_critica | currency }}</span>
          <span class="subtext">En riesgo de pérdida</span>
        </div>

        <div class="kpi-card morosidad" [class.high-risk]="data.kpis.indice_morosidad > 50">
          <span class="label">Índice de Morosidad</span>
          <span class="value">{{ data.kpis.indice_morosidad / 100 | percent:'1.2-2' }}</span>
          <span class="subtext">De riesgo total</span>
        </div>

      </div>

      <div class="row g-4">

        <!-- Gráfica de Anillo -->
        <div class="col-lg-4">
          <div class="section-card h-100">
            <div class="section-header">
              <h5>Análisis de Cartera</h5>
              <p>Vencido vs Crítico</p>
            </div>
            <div *ngIf="data.kpis.total_por_cobrar > 0; else noChart" class="chart-wrapper">
              <canvas #doughnutChart></canvas>
              <div class="chart-center-text">
                <span class="percentage">{{ data.kpis.indice_morosidad | number:'1.1-1' }}%</span>
                <span class="desc">Morosidad</span>
              </div>
            </div>
            <ng-template #noChart>
              <p class="text-muted text-center py-4">Sin saldos pendientes para graficar</p>
            </ng-template>
          </div>
        </div>

        <!-- Tabla Top Clientes -->
        <div class="col-lg-8">
          <div class="section-card-table h-100">
            <div class="section-header px-4 pt-4">
              <h5>Top Clientes con Saldo Pendiente</h5>
              <p>Principales deudores y estado de antigüedad</p>
            </div>
            <div class="tabla-scroll">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th># Factura</th>
                    <th>Saldo Pendiente</th>
                    <th>Días Vencido</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of paginatedClientes" class="hover-row">
                    <td class="font-medium">
                      <div class="d-flex align-items-center">
                        {{ c.cliente }}
                        <app-responsable-tooltip [responsable]="c.responsable"></app-responsable-tooltip>
                      </div>
                    </td>
                    <td class="font-mono">{{ c.numero_factura }}</td>
                    <td class="font-bold">{{ c.saldo_total | currency }}</td>
                    <td>
                      <span [class.text-danger]="c.dias_vencido > 30" [class.text-warning]="c.dias_vencido > 0 && c.dias_vencido <= 30">
                        {{ c.dias_vencido }} días
                      </span>
                    </td>
                    <td>{{ c.responsable }}</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'bg-danger-subtle text-danger': c.estado === 'CRÍTICO',
                        'bg-warning-subtle text-warning': c.estado === 'VENCIDO',
                        'bg-success-subtle text-success': c.estado === 'VIGENTE'
                      }">
                        {{ c.estado }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="!data.top_clientes.length">
                    <td colspan="6" class="text-center py-4 text-muted">No se encontraron clientes con deuda pendiente</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Paginación footer -->
            <div class="pagination-premium-container">
              <div class="d-flex align-items-center justify-content-between px-4 py-3">
                <div class="d-flex align-items-center gap-3">
                  <span class="pag-label">Registros por página:</span>
                  <select class="form-select-premium-sm" [(ngModel)]="pageSize" (change)="onPageSizeChange($event)">
                    <option [value]="10">10</option>
                    <option [value]="25">25</option>
                    <option [value]="50">50</option>
                    <option [value]="100">100</option>
                  </select>
                </div>
                <div class="text-center">
                  <span class="pag-info">
                    Mostrando <strong>{{ startItem }} - {{ endItem }}</strong> de <strong>{{ data.top_clientes.length }}</strong> registros
                  </span>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <button class="btn-nav-premium" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">
                    <i class="bi bi-chevron-left"></i>
                  </button>
                  <div class="page-indicator-premium">{{ currentPage }}</div>
                  <button class="btn-nav-premium" [disabled]="currentPage === totalPages" (click)="currentPage = currentPage + 1">
                    <i class="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
    .kpi-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 0.85rem 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 0.3rem;
      min-height: 95px; transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #e2e8f0; }
    .kpi-card.highlight {
      background: var(--gradient-highlight); border-color: transparent;
      box-shadow: 0 4px 18px rgba(168,85,247,0.35);
    }
    .kpi-card.highlight .label   { color: rgba(255,255,255,0.8); }
    .kpi-card.highlight .value   { color: #fff; }
    .kpi-card.highlight .subtext { color: rgba(255,255,255,0.75); }

    .label   { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .value   { font-size: 1.7rem; font-weight: 800; color: #0f172a; }
    .subtext { font-size: 0.72rem; color: #94a3b8; }

    .section-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 1.75rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .section-card-table { background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
    .section-header h5 { font-weight: 800; color: #1e293b; margin-bottom: 0.2rem; }
    .section-header p  { font-size: 0.83rem; color: #64748b; margin-bottom: 1.25rem; }
    .tabla-scroll { max-height: 530px; overflow-y: auto; overflow-x: auto; }
    .pagination-premium-container { background: #fff; border-top: 1px solid #f1f5f9; }
    .pag-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; }
    .pag-info  { font-size: 0.85rem; color: #64748b; }
    .form-select-premium-sm { padding: 0.4rem 2rem 0.4rem 1rem; border-radius: 10px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 0.85rem; font-weight: 600; color: #475569; cursor: pointer; }
    .btn-nav-premium { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-nav-premium:hover:not(:disabled) { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
    .btn-nav-premium:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-indicator-premium { min-width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #161d35; color: white; font-weight: 700; font-size: 0.9rem; padding: 0 0.75rem; }

    .chart-wrapper { position: relative; height: 280px; display: flex; align-items: center; justify-content: center; }
    .chart-center-text {
      position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center;
      top: 55%; transform: translateY(-50%);
    }
    .chart-center-text .percentage { font-size: 1.5rem; font-weight: 800; color: #1e293b; line-height: 1; }
    .chart-center-text .desc       { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

    .modern-table thead th { background: #f8fafc; border: none; font-size: 0.7rem; text-transform: uppercase; color: #64748b; padding: 0.9rem 1rem; position: sticky; top: 0; z-index: 1; }
    .modern-table tbody td { border-bottom: 1px solid #f1f5f9; padding: 1rem; vertical-align: middle; font-size: 0.9rem; }
    .hover-row:hover { background: #f8fafc; }
    .font-medium { font-weight: 600; color: #334155; }
    .font-bold   { font-weight: 800; color: #1e293b; }
    .font-mono   { font-family: monospace; font-size: 0.85rem; color: #334155; }

    .badge { padding: 0.5rem 0.75rem; border-radius: 8px; font-weight: 600; font-size: 0.75rem; }
    .bg-danger-subtle { background-color: #fef2f2 !important; }
    .bg-warning-subtle { background-color: #fffbeb !important; }
    .bg-success-subtle { background-color: #f0fdf4 !important; }
  `]
})
export class R008CuentasPorCobrarComponent implements OnChanges, OnDestroy {
  @Input() data!: AccountsReceivableReport;
  @ViewChild('doughnutChart') doughnutChart?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private colors = ['#f59e0b', '#ef4444'];
  private pendingRender = false;

  currentPage = 1;
  pageSize = 10;

  get paginatedClientes() {
    if (!this.data?.top_clientes) return [];
    const start = (this.currentPage - 1) * this.pageSize;
    return this.data.top_clientes.slice(start, start + this.pageSize);
  }
  get totalPages() { return Math.ceil((this.data?.top_clientes?.length || 0) / this.pageSize) || 1; }
  get startItem() { return this.data?.top_clientes?.length ? (this.currentPage - 1) * this.pageSize + 1 : 0; }
  get endItem() { return Math.min(this.currentPage * this.pageSize, this.data?.top_clientes?.length || 0); }
  onPageSizeChange(e: Event) { this.pageSize = +(e.target as HTMLSelectElement).value; this.currentPage = 1; }

  ngOnChanges() {
    this.currentPage = 1;
    // Destruir chart anterior inmediatamente si existe
    this.chart?.destroy();
    this.chart = undefined;
    this.pendingRender = true;
    // Esperar a que Angular procese el *ngIf y monte el canvas
    setTimeout(() => {
      if (this.pendingRender) {
        this.pendingRender = false;
        this.renderChart();
      }
    }, 0);
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  private renderChart() {
    if (!this.doughnutChart?.nativeElement || !this.data?.kpis) return;
    if (this.data.kpis.total_por_cobrar <= 0) return;

    const kpis = this.data.kpis;
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Vencido < 30d', 'Crítico > 30d'],
        datasets: [{
          data: [kpis.vencido_menor_30, kpis.cartera_critica],
          backgroundColor: this.colors,
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 4,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11, weight: '600' }, padding: 20, usePointStyle: true, color: '#64748b' } as any
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => ` $${(ctx.parsed as number).toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
            }
          }
        }
      }
    };

    this.chart = new Chart(this.doughnutChart.nativeElement, config);
  }
}

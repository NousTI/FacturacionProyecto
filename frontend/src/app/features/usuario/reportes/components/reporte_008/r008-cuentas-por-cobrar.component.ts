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
      
      <!-- Seccion Superior: KPIs y Grafico -->
      <div class="row g-4 mb-4">
        
        <!-- KPIs 2x2 -->
        <div class="col-lg-6">
          <div class="kpi-2x2-grid h-100">
            <div class="kpi-card highlight">
              <span class="label">Total por Cobrar</span>
              <span class="value">{{ data.kpis.total_por_cobrar | currency }}</span>
              <span class="subtext">Saldo pendiente global</span>
            </div>

            <div class="kpi-card amber">
              <span class="label">Vencido < 30 días</span>
              <span class="value">{{ data.kpis.vencido_menor_30 | currency }}</span>
              <span class="subtext">Requiere gestión inmediata</span>
            </div>

            <div class="kpi-card red">
              <span class="label">Cartera Crítica > 30 días</span>
              <span class="value">{{ data.kpis.cartera_critica | currency }}</span>
              <span class="subtext">En riesgo de pérdida</span>
            </div>

            <div class="kpi-card morosidad" [class.high-risk]="data.kpis.indice_morosidad > 50">
              <span class="label">Índice de Morosidad</span>
              <span class="value">{{ data.kpis.indice_morosidad / 100 | percent:'1.2-2' }}</span>
              <span class="subtext">Riesgo sobre el total</span>
            </div>
          </div>
        </div>

        <!-- Grafico de Anillo -->
        <div class="col-lg-6">
          <div class="section-card h-100 d-flex flex-column">
            <div class="section-header">
              <h5>Análisis de Cartera</h5>
              <p class="mb-0">Distribución de saldos</p>
            </div>
            <div *ngIf="data.kpis.total_por_cobrar > 0; else noChart" class="chart-wrapper flex-grow-1">
              <canvas #doughnutChart></canvas>
              <div class="chart-center-text">
                <span class="percentage">{{ data.kpis.indice_morosidad | number:'1.1-1' }}%</span>
                <span class="desc">Morosidad</span>
              </div>
            </div>
            <ng-template #noChart>
              <div class="flex-grow-1 d-flex align-items-center justify-content-center">
                <p class="text-muted text-center py-4">Sin saldos pendientes</p>
              </div>
            </ng-template>
          </div>
        </div>

      </div>

      <!-- Seccion Inferior: Tabla Full Width -->
      <div class="row">
        <div class="col-12">
          <div class="section-card-table">
            <div class="section-header px-4 pt-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5>Puntaje de Cartera por Cliente</h5>
                  <p class="mb-0">Listado detallado de facturas vencidas y vigentes</p>
                </div>
              </div>
            </div>
            
            <div class="tabla-scroll">
              <table class="table modern-table mb-0">
                <thead>
                  <tr>
                    <th class="ps-4">Cliente</th>
                    <th class="text-center"># Factura</th>
                    <th class="text-end">Saldo Pendiente</th>
                    <th class="text-center">Días Vencido</th>
                    <th class="ps-4">Responsable</th>
                    <th class="text-center pe-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of paginatedClientes" class="hover-row">
                    <td class="font-medium ps-4">
                      <div class="d-flex align-items-center">
                        <span class="client-dot me-2" [ngClass]="{
                          'bg-danger': c.estado === 'CRÍTICO',
                          'bg-warning': c.estado === 'VENCIDO',
                          'bg-success': c.estado === 'VIGENTE'
                        }"></span>
                        {{ c.cliente }}
                        <app-responsable-tooltip [responsable]="c.responsable"></app-responsable-tooltip>
                      </div>
                    </td>
                    <td class="text-center font-mono">{{ c.numero_factura }}</td>
                    <td class="text-end font-bold">{{ c.saldo_total | currency }}</td>
                    <td class="text-center">
                      <span class="days-badge" [ngClass]="{
                        'vencido-critico': c.dias_vencido > 30,
                        'vencido-alerta': c.dias_vencido > 0 && c.dias_vencido <= 30,
                        'vigente': c.dias_vencido <= 0
                      }">
                        {{ c.dias_vencido > 0 ? c.dias_vencido + ' días' : 'A tiempo' }}
                      </span>
                    </td>
                    <td class="ps-4">
                      <div class="d-flex align-items-center gap-2">
                        <div class="responsable-avatar">{{ (c.responsable || 'U')[0] | uppercase }}</div>
                        <span class="small fw-600">{{ c.responsable }}</span>
                      </div>
                    </td>
                    <td class="text-center pe-4">
                      <span class="badge-status-v2" [ngClass]="{
                        'critico': c.estado === 'CRÍTICO',
                        'vencido': c.estado === 'VENCIDO',
                        'vigente': c.estado === 'VIGENTE'
                      }">
                        {{ c.estado }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="!data.top_clientes.length">
                    <td colspan="6" class="text-center py-5">
                      <div class="text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                        No se encontraron cuentas por cobrar
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación footer -->
            <div class="pagination-premium-container">
              <div class="d-flex align-items-center justify-content-between px-4 py-3">
                <div class="d-flex align-items-center gap-3">
                  <span class="pag-label">Filas:</span>
                  <select class="form-select-premium-sm" [(ngModel)]="pageSize" (change)="onPageSizeChange($event)">
                    <option [value]="10">10</option>
                    <option [value]="25">25</option>
                    <option [value]="50">50</option>
                  </select>
                </div>
                <div>
                  <span class="pag-info">
                    <strong>{{ startItem }}-{{ endItem }}</strong> de <strong>{{ data.top_clientes.length }}</strong>
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
    .kpi-2x2-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 1rem;
    }
    .kpi-card {
      background: #fff; border: none; border-radius: 16px; padding: 1.25rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: center; gap: 0.4rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .kpi-card:hover { transform: translateY(-3px); box-shadow: 0 12px 20px -10px rgba(0,0,0,0.08); border-color: #e2e8f0; }
    
    .kpi-card.highlight {
      background: var(--gradient-highlight); border-color: transparent;
      box-shadow: 0 4px 18px rgba(168,85,247,0.35);
    }
    .kpi-card.highlight .label   { color: rgba(255,255,255,0.8); }
    .kpi-card.highlight .value   { color: #fff; }
    .kpi-card.highlight .subtext { color: rgba(255,255,255,0.75); }

    .kpi-card.amber { /* Removido borde lateral */ }
    .kpi-card.red { /* Removido borde lateral */ }

    .label   { font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .value   { font-size: 1.6rem; font-weight: 800; color: black; line-height: 1.2; }
    .subtext { font-size: 0.7rem; color: #94a3b8; font-weight: 500; }

    .section-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .section-card-table { background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; flex-direction: column; }
    .section-header h5 { font-weight: 800; color: black; margin-bottom: 0.2rem; font-size: 1.1rem; }
    .section-header p  { font-size: 0.8rem; color: #64748b; }
    
    .tabla-scroll { max-height: 500px; overflow-y: auto; overflow-x: auto; }
    .pagination-premium-container { background: #f8fafc; border-top: 1px solid #f1f5f9; }
    .pag-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 700; }
    .pag-info  { font-size: 0.8rem; color: #475569; }
    .form-select-premium-sm { padding: 0.3rem 1.8rem 0.3rem 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #fff; font-size: 0.8rem; font-weight: 700; color: #475569; outline: none; }
    
    .btn-nav-premium { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.2s; }
    .btn-nav-premium:hover:not(:disabled) { background: var(--primary-color); color: white; border-color: black; }
    .page-indicator-premium { min-width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: black; font-weight: 800; font-size: 0.85rem; padding: 0 0.5rem; }

    .chart-wrapper { position: relative; height: 240px; }
    .chart-center-text {
      position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center;
      top: 48%; left: 50%; transform: translate(-50%, -50%);
    }
    .chart-center-text .percentage { font-size: 1.4rem; font-weight: 800; color: black; }
    .chart-center-text .desc       { font-size: 0.6rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

    .modern-table thead th { background: #f8fafc; border-bottom: 1px solid #f1f5f9; font-size: 0.65rem; text-transform: uppercase; color: #94a3b8; font-weight: 800; padding: 1rem; letter-spacing: 0.05em; }
    .modern-table tbody td { border-bottom: 1px solid #f8fafc; padding: 0.85rem 1rem; vertical-align: middle; font-size: 0.85rem; }
    
    .client-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .responsable-avatar { width: 24px; height: 24px; border-radius: 6px; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; }
    .days-badge { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .days-badge.vencido-critico { color: #ef4444; background: #fef2f2; }
    .days-badge.vencido-alerta { color: #f59e0b; background: #fffbeb; }
    .days-badge.vigente { color: #10b981; background: #f0fdf4; }

    .badge-status-v2 { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 0.35rem 0.75rem; border-radius: 10px; }
    .badge-status-v2.critico { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .badge-status-v2.vencido { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .badge-status-v2.vigente { background: var(--status-success-bg); color: var(--status-success-text); }
    
    .fw-600 { font-weight: 600; }
    .font-mono { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }
    .font-bold { font-weight: 800; color: black; }
    .hover-row:hover { background: #f8fafc; }
    .font-medium { font-weight: 600; color: #334155; }
    .font-bold   { font-weight: 800; color: black; }
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
            backgroundColor: 'var(--primary-color)',
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



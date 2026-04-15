import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ExecutiveSummary } from '../services/financial-reports.service';
import { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-executive-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="fade-in">
      <!-- KPIs Row 1: Finance -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card glass purple">
          <div class="kpi-info">
            <span class="label">Total Facturado</span>
            <span class="value">{{ data.total_facturado.valor | currency }}</span>
            <div class="trend" [class.up]="data.total_facturado.variacion >= 0" [class.down]="data.total_facturado.variacion < 0">
              <i class="bi" [class.bi-arrow-up-short]="data.total_facturado.variacion >= 0" [class.bi-arrow-down-short]="data.total_facturado.variacion < 0"></i>
              {{ data.total_facturado.variacion }}% <span>vs mes prev.</span>
            </div>
          </div>
          <div class="kpi-icon"><i class="bi bi-wallet2"></i></div>
        </div>

        <div class="kpi-card glass emerald">
          <div class="kpi-info">
            <span class="label">Ingreso Efectivo</span>
            <span class="value">{{ data.ingreso_efectivo.valor | currency }}</span>
            <div class="trend" [class.up]="data.ingreso_efectivo.variacion >= 0">
              {{ data.ingreso_efectivo.variacion }}% <span>crecido</span>
            </div>
          </div>
          <div class="kpi-icon"><i class="bi bi-cash"></i></div>
        </div>

        <div class="kpi-card glass blue">
          <div class="kpi-info">
            <span class="label">Ingreso Tarjeta</span>
            <span class="value">{{ data.ingreso_tarjeta.valor | currency }}</span>
            <div class="trend up">{{ data.ingreso_tarjeta.variacion }}% <span>vs prev.</span></div>
          </div>
          <div class="kpi-icon"><i class="bi bi-credit-card"></i></div>
        </div>

        <div class="kpi-card glass amber">
          <div class="kpi-info">
            <span class="label">Otros Pagos</span>
            <span class="value">{{ data.ingreso_otras.valor | currency }}</span>
            <div class="trend up">{{ data.ingreso_otras.variacion }}% <span>uso</span></div>
          </div>
          <div class="kpi-icon"><i class="bi bi-phone"></i></div>
        </div>
      </div>

      <!-- KPIs Row 2: Management -->
      <div class="kpi-grid mb-5">
        <div class="kpi-card glass red">
          <div class="kpi-info">
            <span class="label">Por Cobrar</span>
            <span class="value">{{ data.por_cobrar.total | currency }}</span>
            <span class="subtext text-danger">Mora: {{ data.por_cobrar.en_mora | currency }} (>30d)</span>
          </div>
        </div>
        <div class="kpi-card glass indigo">
          <div class="kpi-info">
            <span class="label">Clientes Nuevos</span>
            <span class="value">{{ data.clientes_nuevos.valor }}</span>
            <span class="trend up">+{{ data.clientes_nuevos.variacion }}% <span>captación</span></span>
          </div>
        </div>
        <div class="kpi-card glass gold">
          <div class="kpi-info">
            <span class="label">Clientes VIP</span>
            <span class="value">{{ data.clientes_vip.valor }}</span>
            <span class="subtext">{{ data.clientes_vip.periodo }}</span>
          </div>
          <div class="kpi-icon"><i class="bi bi-star-fill"></i></div>
        </div>
        <div class="kpi-card glass dark">
          <div class="kpi-info">
            <span class="label">Utilidad Neta</span>
            <span class="value white">{{ data.utilidad_neta.valor | currency }}</span>
            <span class="trend up">Margen: {{ data.utilidad_neta.margen }}%</span>
          </div>
          <div class="kpi-icon"><i class="bi bi-graph-up-arrow"></i></div>
        </div>
      </div>

      <!-- CHARTS ROW -->
      <div class="row g-4 mb-5">
        <!-- Facturación Anual -->
        <div class="col-lg-6">
          <div class="section-card glass shadow-lg">
            <div class="section-header">
              <div class="title-with-icon">
                <i class="bi bi-graph-up"></i>
                <div>
                  <h5>Facturación Este Año</h5>
                  <p>Comparativa mes actual vs año anterior</p>
                </div>
              </div>
            </div>
            <div class="chart-wrapper">
              <canvas #annualChart class="chart-canvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Gastos vs Utilidad -->
        <div class="col-lg-6">
          <div class="section-card glass shadow-lg">
            <div class="section-header">
              <div class="title-with-icon">
                <i class="bi bi-pie-chart"></i>
                <div>
                  <h5>Gastos vs Utilidad (Mes)</h5>
                  <p>Desglose de costos e ingresos netos</p>
                </div>
              </div>
            </div>
            <div class="chart-wrapper">
              <canvas #profitChart class="chart-canvas"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 mb-5">
        <!-- Radar de Gestión -->
        <div class="col-lg-6">
          <div class="section-card glass shadow-lg">
            <div class="section-header">
              <div class="title-with-icon">
                <i class="bi bi-radar"></i>
                <div>
                  <h5>Radar de Gestión Inmediata</h5>
                  <p>Facturación vencida y alertas críticas de stock</p>
                </div>
              </div>
            </div>
            <div *ngIf="!data.radar_gestion || data.radar_gestion.length === 0" class="empty-radar py-5 text-center">
              <i class="bi bi-check-circle text-success mb-3" style="font-size: 2rem;"></i>
              <p class="text-muted">Todo está bajo control, sin alertas pendientes</p>
            </div>
            <div *ngIf="data.radar_gestion && data.radar_gestion.length > 0" class="table-responsive">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>Origen</th>
                    <th>Detalle</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Resp.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of data.radar_gestion" class="hover-row">
                    <td><span class="badge-dot" [class.venta]="item.origen === 'Venta'" [class.inventario]="item.origen === 'Inventario'" [class.caja]="item.origen === 'Caja'"></span> {{ item.origen }}</td>
                    <td class="font-medium">{{ item.detalle }}</td>
                    <td class="font-bold">{{ (item.monto ?? 0) > 0 ? (item.monto! | currency) : '—' }}</td>
                    <td><span class="status-chip" [class.danger]="item.estado.includes('Mora') || item.estado.includes('Crítico')" [class.warning]="item.estado.includes('Pendiente')">{{ item.estado }}</span></td>
                    <td class="text-muted">{{ item.responsable }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Monitor de Rentabilidad -->
        <div class="col-lg-6">
          <div class="section-card glass shadow-lg">
            <div class="section-header">
              <div class="title-with-icon">
                <i class="bi bi-display"></i>
                <div>
                  <h5>Monitor de Rentabilidad</h5>
                  <p>Top 5 productos con mayor rotación</p>
                </div>
              </div>
            </div>
            <div *ngIf="!data.monitor_rentabilidad || data.monitor_rentabilidad.length === 0" class="empty-monitor py-5 text-center">
              <i class="bi bi-inbox text-muted mb-3" style="font-size: 2rem;"></i>
              <p class="text-muted">Sin datos de productos en este período</p>
            </div>
            <div *ngIf="data.monitor_rentabilidad && data.monitor_rentabilidad.length > 0" class="table-responsive">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="text-center">Vendidos</th>
                    <th class="text-center">Stock</th>
                    <th class="text-end">Utilidad</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let prod of data.monitor_rentabilidad" class="hover-row">
                    <td class="font-medium">{{ prod.productos }}</td>
                    <td class="text-center">{{ prod.vendidos }} und.</td>
                    <td class="text-center"><strong>{{ prod.existencias }}</strong></td>
                    <td class="text-end text-success font-bold">{{ prod.utilidad_neta | currency }}</td>
                    <td class="text-center"><span class="status-chip" [class.warning]="prod.estado.includes('Alerta')" [class.danger]="prod.estado.includes('Crítico')" [class.success]="prod.estado.includes('saludable')">{{ prod.estado }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.5rem; }
    
    /* Glassmorphism Styles */
    .glass {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 28px;
      padding: 1.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
    }
    .glass:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08); }

    /* Colors and Accents */
    .purple { border-bottom: 4px solid #818cf8; }
    .emerald { border-bottom: 4px solid #10b981; }
    .blue { border-bottom: 4px solid #3b82f6; }
    .amber { border-bottom: 4px solid #f59e0b; }
    .red { border-bottom: 4px solid #ef4444; }
    .indigo { border-bottom: 4px solid #6366f1; }
    .gold { border-bottom: 4px solid #fbbf24; }
    .dark { background: #1e293b; color: white; }
    .dark .label { color: #94a3b8; }
    .dark .value { color: white; }

    .label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.5rem; }
    .value { font-size: 1.6rem; font-weight: 800; color: #1e293b; display: block; }
    .trend { font-size: 0.85rem; font-weight: 600; margin-top: 0.5rem; display: flex; align-items: center; gap: 4px; }
    .trend.up { color: #059669; }
    .trend.down { color: #dc2626; }
    .trend span { font-weight: 400; color: #94a3b8; }
    .subtext { font-size: 0.8rem; margin-top: 0.4rem; display: block; }

    .kpi-icon {
      float: right; width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      background: #f8fafc; color: #64748b; font-size: 1.2rem; margin-top: -3.5rem;
    }

    /* Section Cards */
    .section-card { padding: 2rem; }
    .section-header { margin-bottom: 1.5rem; }
    .title-with-icon { display: flex; gap: 1rem; align-items: center; }
    .title-with-icon i { font-size: 1.8rem; color: #6366f1; background: #eef2ff; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 14px; }
    .title-with-icon h5 { margin: 0; font-weight: 800; color: #1e293b; }
    .title-with-icon p { margin: 0; font-size: 0.85rem; color: #64748b; }

    /* Tables */
    .modern-table { border-collapse: separate; border-spacing: 0 8px; margin-top: -8px; }
    .modern-table thead th { border: none; font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; padding: 1rem; font-weight: 700; }
    .modern-table tbody tr { transition: all 0.2s; }
    .modern-table tbody td { background: rgba(248, 250, 252, 0.5); border: none; padding: 1rem; vertical-align: middle; }
    .modern-table tbody td:first-child { border-radius: 12px 0 0 12px; }
    .modern-table tbody td:last-child { border-radius: 0 12px 12px 0; }
    .hover-row:hover td { background: #f1f5f9; transform: scale(1.005); }

    .status-chip { 
      padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; background: #dcfce7; color: #166534; white-space: nowrap;
    }
    .status-chip.danger { background: #fee2e2; color: #991b1b; }
    .status-chip.warning { background: #fef3c7; color: #92400e; }

    .badge-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; background: #3b82f6; margin-right: 6px; }
    .badge-dot.venta { background: #818cf8; }
    .badge-dot.inventario { background: #f59e0b; }
    .badge-dot.caja { background: #06b6d4; }

    .status-chip.success { background: #dcfce7; color: #166534; }

    .empty-radar, .empty-monitor {
      border-radius: 12px; background: rgba(248, 250, 252, 0.5);
    }

    .font-medium { font-weight: 500; }
    .font-bold { font-weight: 700; }
    .text-center { text-align: center; }
    .text-end { text-align: right; }

    .chart-wrapper { position: relative; height: 320px; }
    .chart-canvas { max-height: 320px; }

    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ExecutiveSummaryComponent implements AfterViewInit {
  @Input() data!: ExecutiveSummary;
  @ViewChild('annualChart') annualChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('profitChart') profitChart?: ElementRef<HTMLCanvasElement>;

  private annualChartInstance?: Chart;
  private profitChartInstance?: Chart;

  ngAfterViewInit() {
    if (this.data) {
      if (this.annualChart) this.renderAnnualChart();
      if (this.profitChart) this.renderProfitChart();
    }
  }

  private renderAnnualChart() {
    if (!this.annualChart?.nativeElement) return;

    const facturadoActual = this.data.total_facturado.valor;
    const facturadoAnterior = this.data.total_facturado.valor / (1 + this.data.total_facturado.variacion / 100);

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Este Año', 'Año Anterior'],
        datasets: [{
          data: [facturadoActual, facturadoAnterior],
          backgroundColor: ['#818cf8', '#cbd5e1'],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11, weight: 600 }, padding: 12, usePointStyle: true } as any
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              label: (ctx) => `$${(ctx.parsed as number).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`
            }
          }
        }
      }
    };

    this.annualChartInstance?.destroy();
    this.annualChartInstance = new Chart(this.annualChart.nativeElement, config);
  }

  private renderProfitChart() {
    if (!this.profitChart?.nativeElement) return;

    // Estimamos gastos como 75% de utilidad para el ejemplo
    const utilidad = this.data.utilidad_neta.valor;
    const gastos = utilidad / 0.233; // Basado en margen del 23.3%

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: ['Utilidad Neta', 'Gastos'],
        datasets: [{
          data: [utilidad, gastos],
          backgroundColor: ['#10b981', '#f59e0b'],
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverBorderWidth: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11, weight: 600 }, padding: 12, usePointStyle: true } as any
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              label: (ctx) => `$${(ctx.parsed as number).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`
            }
          }
        }
      }
    };

    this.profitChartInstance?.destroy();
    this.profitChartInstance = new Chart(this.profitChart.nativeElement, config);
  }

  getRadarOriginBadgeClass(origen: string): string {
    if (origen === 'Venta') return 'venta';
    if (origen === 'Inventario') return 'inventario';
    if (origen === 'Caja') return 'caja';
    return '';
  }

  isRadarEmpty(): boolean {
    return !this.data.radar_gestion || this.data.radar_gestion.length === 0 ||
           (this.data.radar_gestion.length === 1 && this.data.radar_gestion[0].detalle.includes('Sin'));
  }

  isMonitorEmpty(): boolean {
    return !this.data.monitor_rentabilidad || this.data.monitor_rentabilidad.length === 0;
  }
}

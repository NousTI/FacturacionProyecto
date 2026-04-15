import { Component, Input, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ExecutiveSummary } from '../../services/financial-reports.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { SRI_FORMAS_PAGO } from '../../../../../core/constants/sri-iva.constants';
import { FormasPagoTooltipComponent } from './formas-pago-tooltip.component';

Chart.register(...registerables);

@Component({
  selector: 'app-r028-resumen-ejecutivo',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, FormasPagoTooltipComponent],
  template: `
    <div class="fade-in">

      <!-- ── FILA 1 KPIs FINANCIEROS ── -->
      <div class="kpi-grid mb-4">

        <div class="kpi-card emerald">
          <div class="kpi-body">
            <span class="label">
              Dinero Recaudado
              <app-formas-pago-tooltip [rows]="todosLosMetodosRows" tooltipTitle="Total Recaudado"></app-formas-pago-tooltip>
            </span>
            <span class="value">{{ data.total_recaudado.valor | currency }}</span>
            <span class="trend" [class.up]="data.total_recaudado.variacion >= 0" [class.down]="data.total_recaudado.variacion < 0">
              <i class="bi" [class.bi-arrow-up-short]="data.total_recaudado.variacion >= 0" [class.bi-arrow-down-short]="data.total_recaudado.variacion < 0"></i>
              {{ data.total_recaudado.variacion | number:'1.1-1' }}% vs periodo anterior
            </span>
          </div>
          <div class="kpi-icon"><i class="bi bi-piggy-bank"></i></div>
        </div>

        <div class="kpi-card purple">
          <div class="kpi-body">
            <span class="label">Total Facturado (Ventas)</span>
            <span class="value">{{ data.total_facturado.valor | currency }}</span>
            <span class="trend" [class.up]="data.total_facturado.variacion >= 0" [class.down]="data.total_facturado.variacion < 0">
              <i class="bi" [class.bi-arrow-up-short]="data.total_facturado.variacion >= 0" [class.bi-arrow-down-short]="data.total_facturado.variacion < 0"></i>
              {{ data.total_facturado.variacion | number:'1.1-1' }}% vs periodo anterior
            </span>
          </div>
          <div class="kpi-icon"><i class="bi bi-file-earmark-text"></i></div>
        </div>

        <div class="kpi-card light-emerald">
          <div class="kpi-body">
            <span class="label">Ingreso Efectivo</span>
            <span class="value">{{ data.ingreso_efectivo.valor | currency }}</span>
            <span class="trend" [class.up]="data.ingreso_efectivo.variacion >= 0" [class.down]="data.ingreso_efectivo.variacion < 0">
              <i class="bi" [class.bi-arrow-up-short]="data.ingreso_efectivo.variacion >= 0" [class.bi-arrow-down-short]="data.ingreso_efectivo.variacion < 0"></i>
              {{ data.ingreso_efectivo.variacion | number:'1.1-1' }}% vs ant.
            </span>
          </div>
          <div class="kpi-icon"><i class="bi bi-cash-stack"></i></div>
        </div>

        <div class="kpi-card blue">
          <div class="kpi-body">
            <span class="label">
              Ingreso con Tarjeta
              <app-formas-pago-tooltip [rows]="tarjetaFormasPagoRows" tooltipTitle="Desglose Tarjetas"></app-formas-pago-tooltip>
            </span>
            <span class="value">{{ data.ingreso_tarjeta.valor | currency }}</span>
            <span class="trend" [class.up]="data.ingreso_tarjeta.variacion >= 0" [class.down]="data.ingreso_tarjeta.variacion < 0">
              <i class="bi" [class.bi-arrow-up-short]="data.ingreso_tarjeta.variacion >= 0" [class.bi-arrow-down-short]="data.ingreso_tarjeta.variacion < 0"></i>
              {{ data.ingreso_tarjeta.variacion | number:'1.1-1' }}% vs mes anterior
            </span>
          </div>
          <div class="kpi-icon"><i class="bi bi-credit-card"></i></div>
        </div>

        <!-- Otras formas de pago con tooltip custom -->
        <div class="kpi-card amber">
          <div class="kpi-body">
            <span class="label">
              Otras Formas de Pago
              <app-formas-pago-tooltip [rows]="otrasFormasPagoRows" tooltipTitle="Sist. Financiero (Otros)"></app-formas-pago-tooltip>
            </span>
            <span class="value">{{ data.ingreso_otras.valor | currency }}</span>
            <span class="trend" [class.up]="data.ingreso_otras.variacion >= 0" [class.down]="data.ingreso_otras.variacion < 0">
              <i class="bi" [class.bi-arrow-up-short]="data.ingreso_otras.variacion >= 0" [class.bi-arrow-down-short]="data.ingreso_otras.variacion < 0"></i>
              {{ data.ingreso_otras.variacion | number:'1.1-1' }}%
            </span>
          </div>
          <div class="kpi-icon"><i class="bi bi-phone"></i></div>
        </div>

      </div>

      <!-- ── FILA 2 KPIs GESTIÓN ── -->
      <div class="kpi-grid mb-5">

        <div class="kpi-card red">
          <div class="kpi-body">
            <span class="label">Por Cobrar</span>
            <span class="value">{{ data.por_cobrar.total | currency }}</span>
            <span class="subtext text-danger">{{ data.por_cobrar.en_mora | currency }} en mora &gt;30 días</span>
          </div>
          <div class="kpi-icon"><i class="bi bi-hourglass-split"></i></div>
        </div>

        <div class="kpi-card indigo">
          <div class="kpi-body">
            <span class="label">Clientes Nuevos</span>
            <span class="value">{{ data.clientes_nuevos.valor }}</span>
            <span class="trend" [class.up]="data.clientes_nuevos.variacion >= 0" [class.down]="data.clientes_nuevos.variacion < 0">
              <i class="bi" [class.bi-arrow-up-short]="data.clientes_nuevos.variacion >= 0" [class.bi-arrow-down-short]="data.clientes_nuevos.variacion < 0"></i>
              {{ data.clientes_nuevos.variacion | number:'1.1-1' }}% vs mes anterior
            </span>
          </div>
          <div class="kpi-icon"><i class="bi bi-person-plus"></i></div>
        </div>

        <div class="kpi-card gold">
          <div class="kpi-body">
            <span class="label">Clientes VIP</span>
            <span class="value">{{ data.clientes_vip.valor }}</span>
            <span class="subtext">{{ data.clientes_vip.periodo }}</span>
          </div>
          <div class="kpi-icon"><i class="bi bi-star-fill" style="color:#fbbf24;"></i></div>
        </div>

        <div class="kpi-card dark">
          <div class="kpi-body">
            <span class="label" style="color:#94a3b8;">Utilidad Neta</span>
            <span class="value" style="color:#fff;">{{ data.utilidad_neta.valor | currency }}</span>
            <span class="trend up">Margen: {{ data.utilidad_neta.margen | number:'1.1-1' }}%</span>
          </div>
          <div class="kpi-icon dark-icon"><i class="bi bi-graph-up-arrow"></i></div>
        </div>

      </div>

      <!-- ── GRÁFICAS ── -->
      <div class="row g-4 mb-5">

        <div class="col-lg-6">
          <div class="section-card">
            <div class="section-header">
              <div class="title-icon-row">
                <i class="bi bi-donut icon-badge purple-bg"></i>
                <div>
                  <h5>Facturación — Este Año vs Anterior</h5>
                  <p>Comparativa acumulada del período seleccionado</p>
                </div>
              </div>
            </div>
            <div class="chart-wrapper">
              <canvas #annualChart></canvas>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="section-card">
            <div class="section-header">
              <div class="title-icon-row">
                <i class="bi bi-pie-chart icon-badge emerald-bg"></i>
                <div>
                  <h5>Gastos vs Utilidad Neta (Mes)</h5>
                  <p>Desglose de costos e ingresos netos del período</p>
                </div>
              </div>
            </div>
            <div class="chart-wrapper">
              <canvas #profitChart></canvas>
            </div>
          </div>
        </div>

      </div>

      <!-- ── DESGLOSE DETALLADO DE PAGOS (SRI) ── -->
      <div class="row g-4 mb-5">
        <div class="col-12">
          <div class="section-card">
            <div class="section-header">
              <div class="title-icon-row">
                <i class="bi bi-list-check icon-badge gold-bg"></i>
                <div>
                  <h5>Desglose Detallado por Método de Pago (Caja)</h5>
                  <p>Listado completo de todos los métodos oficiales del SRI con sus montos acumulados</p>
                </div>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>Código SRI</th>
                    <th>Método de Pago</th>
                    <th class="text-end">Monto Total</th>
                    <th class="text-center">Participación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let fp of todosLosMetodosRowsFull" class="hover-row">
                    <td class="text-muted">#{{ fp.codigo }}</td>
                    <td class="font-medium">{{ fp.label }}</td>
                    <td class="text-end font-bold">{{ fp.total | currency }}</td>
                    <td class="text-center">
                      <div class="progress-container">
                        <div class="progress-bar" [style.width.%]="(fp.total / (data.total_recaudado.valor || 1)) * 100"></div>
                        <span class="progress-label">{{ (fp.total / (data.total_recaudado.valor || 1)) | percent:'1.1-1' }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ── RADAR DE GESTIÓN + MONITOR ROTACIÓN ── -->
      <div class="row g-4 mb-5">

        <!-- Radar de Gestión -->
        <div class="col-lg-6">
          <div class="section-card">
            <div class="section-header">
              <div class="title-icon-row">
                <i class="bi bi-exclamation-triangle icon-badge red-bg"></i>
                <div>
                  <h5>Radar de Gestión Inmediata</h5>
                  <p>Ventas en mora y alertas críticas de inventario</p>
                </div>
              </div>
            </div>
            <div *ngIf="!data.radar_gestion?.length" class="empty-state">
              <i class="bi bi-check-circle-fill text-success"></i>
              <p>Sin alertas pendientes. Todo bajo control.</p>
            </div>
            <div *ngIf="data.radar_gestion?.length" class="table-responsive">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>Origen</th>
                    <th>Detalle</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of data.radar_gestion" class="hover-row">
                    <td>
                      <span class="origin-dot"
                        [class.dot-venta]="item.origen === 'Venta'"
                        [class.dot-inventario]="item.origen === 'Inventario'">
                      </span>
                      {{ item.origen }}
                    </td>
                    <td class="font-medium">{{ item.detalle }}</td>
                    <td class="font-bold">{{ item.monto != null ? (item.monto | currency) : '—' }}</td>
                    <td>
                      <span class="status-chip"
                        [class.danger]="item.estado.includes('Mora') || item.estado.includes('Crítico')"
                        [class.warning]="item.estado.includes('alerta')">
                        {{ item.estado }}
                      </span>
                    </td>
                    <td class="text-muted small">{{ item.responsable }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Monitor de Rentabilidad y Rotación -->
        <div class="col-lg-6">
          <div class="section-card">
            <div class="section-header">
              <div class="title-icon-row">
                <i class="bi bi-display icon-badge blue-bg"></i>
                <div>
                  <h5>Monitor de Rentabilidad y Rotación</h5>
                  <p>Top 5 productos más vendidos y con mayor utilidad</p>
                </div>
              </div>
              <!-- Toggle tabs -->
              <div class="monitor-tabs">
                <button class="mtab" [class.active]="monitorTab === 'vendidos'" (click)="monitorTab='vendidos'">Más vendidos</button>
                <button class="mtab" [class.active]="monitorTab === 'utilidad'" (click)="monitorTab='utilidad'">Mayor utilidad</button>
              </div>
            </div>
            <div *ngIf="!currentMonitor?.length" class="empty-state">
              <i class="bi bi-inbox text-muted"></i>
              <p>Sin datos de productos en este período</p>
            </div>
            <div *ngIf="currentMonitor?.length" class="table-responsive">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="text-center">Vendidos</th>
                    <th class="text-center">Existencias</th>
                    <th class="text-end">Utilidad Neta</th>
                    <th class="text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of currentMonitor" class="hover-row">
                    <td class="font-medium">{{ p.productos }}</td>
                    <td class="text-center">{{ p.vendidos }} und.</td>
                    <td class="text-center font-bold">{{ p.existencias }}</td>
                    <td class="text-end text-success font-bold">{{ p.utilidad_neta | currency }}</td>
                    <td class="text-center">
                      <span class="status-chip"
                        [class.danger]="p.estado === 'Stock Crítico'"
                        [class.warning]="p.estado === 'Stock en alerta'"
                        [class.success]="p.estado === 'Stock saludable'">
                        {{ p.estado }}
                      </span>
                    </td>
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
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.5rem; }
    .kpi-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 24px; padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; justify-content: space-between;
      align-items: flex-start;
    }
    .kpi-card:hover { box-shadow: 0 12px 20px -5px rgba(0,0,0,0.08); }
    .kpi-card.emerald { border-bottom: 4px solid #10b981; }
    .kpi-card.light-emerald { border-bottom: 4px solid #34d399; }
    .kpi-card.purple  { border-bottom: 4px solid #818cf8; }
    .kpi-card.blue    { border-bottom: 4px solid #3b82f6; }
    .kpi-card.amber   { border-bottom: 4px solid #f59e0b; }
    .kpi-card.red     { border-bottom: 4px solid #ef4444; }
    .kpi-card.indigo  { border-bottom: 4px solid #6366f1; }
    .kpi-card.gold    { border-bottom: 4px solid #fbbf24; }
    .kpi-card.dark    { background: #1e293b; border-bottom: 4px solid #475569; }

    .kpi-body { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
    .label  { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .value  { font-size: 1.65rem; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .trend  { font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 2px; }
    .trend.up   { color: #059669; }
    .trend.down { color: #dc2626; }
    .subtext { font-size: 0.75rem; color: #94a3b8; }

    .kpi-icon {
      width: 40px; height: 40px; border-radius: 12px; background: #f8fafc;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; color: #64748b; flex-shrink: 0;
    }
    .dark-icon { background: #334155; color: #94a3b8; }


    /* Section Cards */
    .section-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 24px; padding: 1.75rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); height: 100%;
    }
    .section-header { margin-bottom: 1.25rem; }
    .title-icon-row { display: flex; gap: 0.9rem; align-items: center; margin-bottom: 0.5rem; }
    .title-icon-row h5 { margin: 0; font-weight: 800; color: #1e293b; font-size: 1rem; }
    .title-icon-row p  { margin: 0; font-size: 0.8rem; color: #64748b; }
    .icon-badge {
      width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center;
      justify-content: center; font-size: 1.3rem; flex-shrink: 0;
    }
    .purple-bg  { background: #eef2ff; color: #6366f1; }
    .emerald-bg { background: #d1fae5; color: #059669; }
    .red-bg     { background: #fee2e2; color: #dc2626; }
    .blue-bg    { background: #dbeafe; color: #3b82f6; }

    /* Charts */
    .chart-wrapper { position: relative; height: 300px; }

    /* Monitor tabs */
    .monitor-tabs { display: flex; gap: 0.4rem; margin-top: 0.5rem; }
    .mtab {
      background: #f1f5f9; border: none; border-radius: 8px; padding: 0.3rem 0.8rem;
      font-size: 0.75rem; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.15s;
    }
    .mtab.active { background: #1e293b; color: #fff; }

    /* Tables */
    .modern-table { border-collapse: separate; border-spacing: 0 6px; margin-top: -6px; }
    .modern-table thead th {
      border: none; font-size: 0.68rem; text-transform: uppercase;
      color: #94a3b8; padding: 0.6rem 0.75rem; font-weight: 700;
    }
    .modern-table tbody td {
      background: #f8fafc; border: none; padding: 0.75rem; vertical-align: middle; font-size: 0.85rem;
    }
    .modern-table tbody td:first-child { border-radius: 10px 0 0 10px; }
    .modern-table tbody td:last-child  { border-radius: 0 10px 10px 0; }
    .hover-row:hover td { background: #f1f5f9; }

    .font-medium { font-weight: 600; color: #334155; }
    .font-bold   { font-weight: 800; color: #1e293b; }
    .text-center { text-align: center; }
    .text-end    { text-align: right; }
    .text-muted  { color: #94a3b8 !important; }
    .small       { font-size: 0.8rem; }

    .origin-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; background: #94a3b8; }
    .dot-venta      { background: #818cf8; }
    .dot-inventario { background: #f59e0b; }

    .status-chip {
      display: inline-block; padding: 3px 10px; border-radius: 20px;
      font-size: 0.72rem; font-weight: 700; background: #dcfce7; color: #166534; white-space: nowrap;
    }
    .status-chip.danger  { background: #fee2e2; color: #991b1b; }
    .status-chip.warning { background: #fef3c7; color: #854d0e; }
    .status-chip.success { background: #dcfce7; color: #166534; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 2.5rem; color: #94a3b8; gap: 0.5rem;
    }
    .empty-state i { font-size: 2rem; }
    .empty-state p { font-size: 0.85rem; margin: 0; }
    /* Progress Bar */
    .progress-container { display: flex; align-items: center; gap: 8px; justify-content: center; }
    .progress-bar { height: 6px; background: #818cf8; border-radius: 4px; min-width: 4px; }
    .progress-label { font-size: 0.7rem; color: #64748b; font-weight: 700; width: 35px; text-align: right; }
  `]
})
export class R028ResumenEjecutivoComponent implements OnChanges {
  @Input() data!: ExecutiveSummary;
  @ViewChild('annualChart') annualChart?: ElementRef<HTMLCanvasElement>;
  @ViewChild('profitChart') profitChart?: ElementRef<HTMLCanvasElement>;

  private annualChartInstance?: Chart;
  private profitChartInstance?: Chart;

  monitorTab: 'vendidos' | 'utilidad' = 'vendidos';

  get currentMonitor() {
    return this.monitorTab === 'vendidos'
      ? this.data?.monitor_rentabilidad
      : this.data?.monitor_rentabilidad_por_utilidad;
  }

  get tarjetaFormasPagoRows(): Array<{ label: string; value: string }> {
    return (this.data?.ingreso_otras?.formas_pago_detalle ?? [])
      .filter(fp => ['16', '18', '19'].includes(fp.metodo_pago))
      .map(fp => ({
        label: fp.label,
        value: `$${(fp.total).toFixed(2)}`
      }));
  }

  get otrasFormasPagoRows(): Array<{ label: string; value: string }> {
    return (this.data?.ingreso_otras?.formas_pago_detalle ?? [])
      .filter(fp => !['01', '16', '18', '19'].includes(fp.metodo_pago))
      .map(fp => ({
        label: fp.label,
        value: `$${(fp.total).toFixed(2)}`
      }));
  }

  get todosLosMetodosRows(): Array<{ label: string; value: string }> {
    return (this.data?.ingreso_otras?.formas_pago_detalle ?? [])
      .filter(fp => fp.total > 0)
      .map(fp => ({
        label: fp.label,
        value: `$${(fp.total).toFixed(2)}`
      }));
  }

  get todosLosMetodosRowsFull() {
    return (this.data?.ingreso_otras?.formas_pago_detalle ?? [])
      .map(fp => ({
        codigo: fp.metodo_pago,
        label: fp.label,
        total: fp.total
      }))
      .sort((a, b) => b.total - a.total);
  }

  ngOnChanges() {
    setTimeout(() => {
      this.renderAnnualChart();
      this.renderProfitChart();
    }, 50);
  }

  private renderAnnualChart() {
    if (!this.annualChart?.nativeElement || !this.data?.graficas) return;

    const { año_actual, año_anterior } = this.data.graficas.anillo_ventas;
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Este Año', 'Año Anterior'],
        datasets: [{
          data: [año_actual, año_anterior],
          backgroundColor: ['#818cf8', '#cbd5e1'],
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 4,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11, weight: '600' }, padding: 18, usePointStyle: true, color: '#64748b' } as any
          },
          tooltip: {
            backgroundColor: '#1e293b', padding: 12, cornerRadius: 10,
            callbacks: {
              label: (ctx) => ` $${(ctx.parsed as number).toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
            }
          }
        }
      }
    };

    this.annualChartInstance?.destroy();
    this.annualChartInstance = new Chart(this.annualChart.nativeElement, config);
  }

  private renderProfitChart() {
    if (!this.profitChart?.nativeElement || !this.data?.graficas) return;

    const { gastos, utilidad_neta } = this.data.graficas.gastos_vs_utilidad;
    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: ['Gastos', 'Utilidad Neta'],
        datasets: [{
          data: [gastos, utilidad_neta > 0 ? utilidad_neta : 0],
          backgroundColor: ['#f59e0b', '#10b981'],
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11, weight: '600' }, padding: 18, usePointStyle: true, color: '#64748b' } as any
          },
          tooltip: {
            backgroundColor: '#1e293b', padding: 12, cornerRadius: 10,
            callbacks: {
              label: (ctx) => ` $${(ctx.parsed as number).toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
            }
          }
        }
      }
    };

    this.profitChartInstance?.destroy();
    this.profitChartInstance = new Chart(this.profitChart.nativeElement, config);
  }
}

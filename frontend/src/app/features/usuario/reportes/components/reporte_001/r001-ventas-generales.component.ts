import { Component, Input, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { R001Report } from '../../services/financial-reports.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-r001-ventas-generales',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="fade-in">

      <!-- KPIs -->
      <div class="kpi-grid mb-4">

        <div class="kpi-card indigo">
          <span class="label">Facturas Emitidas</span>
          <span class="value">{{ data.facturas_emitidas.valor }}</span>
          <div class="trend" [class.up]="data.facturas_emitidas.variacion >= 0" [class.down]="data.facturas_emitidas.variacion < 0">
            <i class="bi" [class.bi-arrow-up]="data.facturas_emitidas.variacion >= 0" [class.bi-arrow-down]="data.facturas_emitidas.variacion < 0"></i>
            {{ data.facturas_emitidas.variacion | number:'1.1-1' }}% vs anterior
          </div>
        </div>

        <div class="kpi-card blue">
          <span class="label">Subtotal Sin IVA</span>
          <span class="value">{{ data.subtotal_sin_iva | currency }}</span>
          <span class="subtext">Base imponible</span>
        </div>

        <div class="kpi-card green" *ngFor="let iva of ivaOrdenado">
          <span class="label">IVA Cobrado ({{ iva.tarifa }})</span>
          <span class="value">{{ iva.iva_cobrado | currency }}</span>
          <span class="subtext">A declarar al SRI</span>
        </div>

        <div class="kpi-card amber">
          <span class="label">Ticket Promedio</span>
          <span class="value">{{ data.ticket_promedio.valor | currency }}</span>
          <div class="trend" [class.up]="data.ticket_promedio.variacion >= 0" [class.down]="data.ticket_promedio.variacion < 0">
            <i class="bi" [class.bi-arrow-up]="data.ticket_promedio.variacion >= 0" [class.bi-arrow-down]="data.ticket_promedio.variacion < 0"></i>
            {{ data.ticket_promedio.variacion | number:'1.1-1' }}% vs anterior
          </div>
        </div>

      </div>

      <!-- IVA DESGLOSADO -->
      <div class="row g-4 mb-4">
        <div class="col-12">
          <div class="section-card">
            <div class="section-header">
              <h5>IVA Cobrado por Tarifa — A declarar al SRI</h5>
              <p>Desglose de bases imponibles y valores de IVA por cada tarifa</p>
            </div>
            <div class="iva-grid">
              <div class="iva-item" *ngFor="let iva of data.iva_desglosado">
                <span class="iva-tarifa">IVA {{ iva.tarifa }}</span>
                <span class="iva-monto">{{ iva.iva_cobrado | currency }}</span>
                <span class="iva-base">Base: {{ iva.base_imponible | currency }}</span>
              </div>
              <div *ngIf="!data.iva_desglosado.length" class="text-muted py-3">
                Sin datos de IVA para el período
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLA USUARIOS + GRÁFICA PIE -->
      <div class="row g-4">

        <!-- Gráfica pastel top 5 -->
        <div class="col-lg-4">
          <div class="section-card h-100">
            <div class="section-header">
              <h5>Top 5 Vendedores</h5>
              <p>Por total de ventas</p>
            </div>
            <div *ngIf="data.top_usuarios.length > 0; else noChart" class="chart-wrapper">
              <canvas #pieChart></canvas>
            </div>
            <ng-template #noChart>
              <p class="text-muted text-center py-4">Sin datos para la gráfica</p>
            </ng-template>
          </div>
        </div>

        <!-- Tabla ventas por usuario -->
        <div class="col-lg-8">
          <div class="section-card h-100">
            <div class="section-header">
              <h5>Ventas por Usuario</h5>
              <p>Facturas, totales, ticket promedio, anuladas y devoluciones</p>
            </div>
            <div class="table-responsive">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Facturas</th>
                    <th>Total Ventas</th>
                    <th>Ticket Prom.</th>
                    <th>Anuladas</th>
                    <th>Devoluciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let u of data.ventas_por_usuario" class="hover-row">
                    <td class="font-medium">{{ u.usuario }}</td>
                    <td>{{ u.facturas }}</td>
                    <td class="font-bold">{{ u.total_ventas | currency }}</td>
                    <td>{{ u.ticket_promedio | currency }}</td>
                    <td><span [class.text-danger]="u.anuladas > 0">{{ u.anuladas }}</span></td>
                    <td>{{ u.devoluciones }}</td>
                  </tr>
                  <tr *ngIf="!data.ventas_por_usuario.length">
                    <td colspan="6" class="text-center py-4 text-muted">Sin datos para el período seleccionado</td>
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

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
    .kpi-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 0.4rem;
    }
    .kpi-card.indigo { border-top: 4px solid #6366f1; }
    .kpi-card.blue   { border-top: 4px solid #3b82f6; }
    .kpi-card.amber  { border-top: 4px solid #f59e0b; }
    .kpi-card.green  { border-top: 4px solid #10b981; }
    .label   { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .value   { font-size: 1.7rem; font-weight: 800; color: #0f172a; }
    .subtext { font-size: 0.72rem; color: #94a3b8; }
    .trend   { font-size: 0.78rem; font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .trend.up   { color: #10b981; }
    .trend.down { color: #ef4444; }

    .section-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 1.75rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .section-header h5 { font-weight: 800; color: #1e293b; margin-bottom: 0.2rem; }
    .section-header p  { font-size: 0.83rem; color: #64748b; margin-bottom: 1.25rem; }

    .iva-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .iva-item {
      background: #f8fafc; border-radius: 14px; padding: 1rem 1.25rem;
      display: flex; flex-direction: column; gap: 0.3rem; border: 1px solid #e2e8f0;
    }
    .iva-tarifa { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .iva-monto  { font-size: 1.3rem; font-weight: 800; color: #1e293b; }
    .iva-base   { font-size: 0.72rem; color: #94a3b8; }

    .chart-wrapper { position: relative; height: 280px; }

    .modern-table thead th { background: #f8fafc; border: none; font-size: 0.7rem; text-transform: uppercase; color: #64748b; padding: 0.9rem 1rem; }
    .modern-table tbody td { border-bottom: 1px solid #f1f5f9; padding: 1rem; vertical-align: middle; font-size: 0.9rem; }
    .hover-row:hover { background: #f8fafc; }
    .font-medium { font-weight: 600; color: #334155; }
    .font-bold   { font-weight: 800; color: #1e293b; }
  `]
})
export class R001VentasGeneralesComponent implements OnChanges {
  @Input() data!: R001Report;
  @ViewChild('pieChart') pieChart?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  private ivaOrder = ['15%', '8%', '5%', '0%'];

  get ivaOrdenado() {
    if (!this.data?.iva_desglosado) return [];
    return [...this.data.iva_desglosado].sort(
      (a, b) => this.ivaOrder.indexOf(a.tarifa) - this.ivaOrder.indexOf(b.tarifa)
    );
  }

  ngOnChanges() {
    setTimeout(() => this.renderChart(), 50);
  }

  private renderChart() {
    if (!this.pieChart?.nativeElement || !this.data?.top_usuarios?.length) return;

    const top5 = this.data.top_usuarios.slice(0, 5);
    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: top5.map(u => u.usuario),
        datasets: [{
          data: top5.map(u => u.total_ventas),
          backgroundColor: this.colors,
          borderColor: '#ffffff',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11 }, padding: 12, usePointStyle: true } as any
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` $${(ctx.parsed as number).toLocaleString('es-ES', { maximumFractionDigits: 2 })}`
            }
          }
        }
      }
    };

    this.chart?.destroy();
    this.chart = new Chart(this.pieChart.nativeElement, config);
  }
}

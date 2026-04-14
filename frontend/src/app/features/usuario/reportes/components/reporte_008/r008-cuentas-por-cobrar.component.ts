import { Component, Input, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { AccountsReceivableReport } from '../../services/financial-reports.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

Chart.register(...registerables);

@Component({
  selector: 'app-r008-cuentas-por-cobrar',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, PercentPipe, InfoTooltipComponent],
  template: `
    <div class="fade-in">

      <!-- KPIs Superiores -->
      <div class="kpi-grid mb-4">

        <div class="kpi-card indigo">
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
          <div class="section-card h-100">
            <div class="section-header">
              <h5>Top Clientes con Saldo Pendiente</h5>
              <p>Principales deudores y estado de antigüedad</p>
            </div>
            <div class="table-responsive">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Saldo Total</th>
                    <th>Días Vencido</th>
                    <th># Fact. Pend.</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of data.top_clientes" class="hover-row">
                    <td class="font-medium">{{ c.cliente }}</td>
                    <td class="font-bold">{{ c.saldo_total | currency }}</td>
                    <td>
                      <span [class.text-danger]="c.dias_vencido > 30" [class.text-warning]="c.dias_vencido > 0 && c.dias_vencido <= 30">
                        {{ c.dias_vencido }} días
                      </span>
                    </td>
                    <td>{{ c.facturas_pendientes }}</td>
                    <td>
                      <div class="d-flex align-items-center">
                        <span class="text-truncate" style="max-width: 120px;">{{ c.responsable }}</span>
                        <app-info-tooltip [message]="'Vendedor responsable: ' + c.responsable"></app-info-tooltip>
                      </div>
                    </td>
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
    .kpi-card.amber  { border-top: 4px solid #f59e0b; }
    .kpi-card.red    { border-top: 4px solid #ef4444; }
    .kpi-card.morosidad { border-top: 4px solid #10b981; }
    .kpi-card.morosidad.high-risk { border-top: 4px solid #ef4444; }

    .label   { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .value   { font-size: 1.7rem; font-weight: 800; color: #0f172a; }
    .subtext { font-size: 0.72rem; color: #94a3b8; }

    .section-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 1.75rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .section-header h5 { font-weight: 800; color: #1e293b; margin-bottom: 0.2rem; }
    .section-header p  { font-size: 0.83rem; color: #64748b; margin-bottom: 1.25rem; }

    .chart-wrapper { position: relative; height: 280px; display: flex; align-items: center; justify-content: center; }
    .chart-center-text {
      position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center;
      top: 55%; transform: translateY(-50%);
    }
    .chart-center-text .percentage { font-size: 1.5rem; font-weight: 800; color: #1e293b; line-height: 1; }
    .chart-center-text .desc       { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

    .modern-table thead th { background: #f8fafc; border: none; font-size: 0.7rem; text-transform: uppercase; color: #64748b; padding: 0.9rem 1rem; }
    .modern-table tbody td { border-bottom: 1px solid #f1f5f9; padding: 1rem; vertical-align: middle; font-size: 0.9rem; }
    .hover-row:hover { background: #f8fafc; }
    .font-medium { font-weight: 600; color: #334155; }
    .font-bold   { font-weight: 800; color: #1e293b; }

    .badge { padding: 0.5rem 0.75rem; border-radius: 8px; font-weight: 600; font-size: 0.75rem; }
    .bg-danger-subtle { background-color: #fef2f2 !important; }
    .bg-warning-subtle { background-color: #fffbeb !important; }
    .bg-success-subtle { background-color: #f0fdf4 !important; }
  `]
})
export class R008CuentasPorCobrarComponent implements OnChanges {
  @Input() data!: AccountsReceivableReport;
  @ViewChild('doughnutChart') doughnutChart?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private colors = ['#f59e0b', '#ef4444']; // Amber for Vencido, Red for Critico

  ngOnChanges() {
    setTimeout(() => this.renderChart(), 50);
  }

  private renderChart() {
    if (!this.doughnutChart?.nativeElement || !this.data?.kpis) return;

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

    this.chart?.destroy();
    this.chart = new Chart(this.doughnutChart.nativeElement, config);
  }
}

import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AccountsReceivableReport } from '../services/financial-reports.service';
import { Chart, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-accounts-receivable',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="fade-in">
      <!-- KPI GRID -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card glass primary">
          <div class="kpi-info">
            <span class="label">Cartera Total</span>
            <span class="value">{{ data.kpis.total_por_cobrar | currency }}</span>
            <span class="subtext">Sumatoria de saldos pendientes</span>
          </div>
          <div class="kpi-icon"><i class="bi bi-person-lines-fill"></i></div>
        </div>

        <div class="kpi-card glass warning">
          <div class="kpi-info">
            <span class="label">Vencido (< 30 días)</span>
            <span class="value">{{ data.kpis.vencido_menor_30 | currency }}</span>
            <span class="subtext">En proceso de gestión</span>
          </div>
          <div class="kpi-icon"><i class="bi bi-clock"></i></div>
        </div>

        <div class="kpi-card glass danger">
          <div class="kpi-info">
            <span class="label">Cartera Crítica (> 30 días)</span>
            <span class="value">{{ data.kpis.cartera_critica | currency }}</span>
            <span class="subtext text-danger font-bold">Riesgo de incobrabilidad</span>
          </div>
          <div class="kpi-icon"><i class="bi bi-exclamation-octagon"></i></div>
        </div>

        <div class="kpi-card glass morosidad">
          <div class="kpi-info">
            <span class="label">Índice de Morosidad</span>
            <span class="value">{{ data.kpis.indice_morosidad }}%</span>
            <span class="status-indicator" [class.high]="data.kpis.indice_morosidad > 20">
              {{ data.kpis.indice_morosidad > 20 ? 'Riesgo Alto' : 'Saludable' }}
            </span>
          </div>
        </div>
      </div>

      <!-- AGING CHART & SUMMARY -->
      <div class="row g-4 mb-5">
        <div class="col-lg-4">
          <div class="section-card glass shadow-sm h-100">
            <div class="section-header">
              <h5>Distribución de Cartera</h5>
              <p>Antigüedad de saldos acumulados</p>
            </div>
            <div class="chart-wrapper">
              <canvas #donutChart class="chart-canvas"></canvas>
            </div>
          </div>
        </div>

        <!-- TOP CLIENTS TABLE -->
        <div class="col-lg-8">
          <div class="section-card glass shadow-sm h-100">
            <div class="section-header d-flex justify-content-between align-items-center">
              <div>
                <h5>Clientes con Mayor Deuda</h5>
                <p>Top 10 clientes por saldo pendiente acumulado</p>
              </div>
              <i class="bi bi-filter-circle text-muted fs-4"></i>
            </div>

            <div class="table-responsive">
              <table class="table modern-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Saldo</th>
                    <th>Vencimiento</th>
                    <th>Responsable</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let client of data.top_clientes" class="hover-row">
                    <td>
                      <div class="client-cell">
                        <div class="avatar-sm">{{ client.cliente.substring(0,1) }}</div>
                        <span class="font-medium">{{ client.cliente }}</span>
                      </div>
                    </td>
                    <td class="font-bold">{{ client.saldo_total | currency }}</td>
                    <td>{{ client.dias_vencido }} días</td>
                    <td><span class="badge-resp">{{ client.responsable }}</span></td>
                    <td>
                      <span class="status-chip" [class.danger]="client.estado === 'CRÍTICO'" [class.warning]="client.estado === 'VENCIDO'">
                        {{ client.estado }}
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
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.5rem; }
    .glass {
      background: #ffffff; border: 1px solid #f1f5f9; border-radius: 28px; padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s;
    }
    .label { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.5rem; }
    .value { font-size: 1.7rem; font-weight: 850; color: black; display: block; }
    .subtext { font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; display: block; }

    .primary { border-left: 5px solid #6366f1; }
    .warning { border-left: 5px solid #f59e0b; }
    .danger { border-left: 5px solid #ef4444; }
    .morosidad { background: #f8fafc; border: 1px dashed #cbd5e1; }
    
    .status-indicator {
      display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;
      background: #dcfce7; color: #15803d; margin-top: 0.5rem;
    }
    .status-indicator.high { background: #fee2e2; color: #b91c1c; }

    .kpi-icon {
      float: right; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      background: #f1f5f9; color: #475569; font-size: 1.3rem; margin-top: -3.8rem;
    }

    .section-card { padding: 1.75rem; border-radius: 28px; }
    .dark-sidebar { background: var(--primary-color); color: white; }
    
    .aging-summary-list { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1.5rem; }
    .aging-item { display: flex; justify-content: space-between; font-size: 0.9rem; color: #cbd5e1; }
    
    .progress-track { height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden; }
    .progress-fill.indigo { height: 100%; background: #6366f1; }

    .modern-table thead th { border: none; font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; padding: 1rem; }
    .modern-table tbody td { border-bottom: 1px solid #f1f5f9; padding: 1rem; vertical-align: middle; }
    
    .client-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar-sm { 
      width: 32px; height: 32px; background: #eef2ff; color: #6366f1; 
      border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800;
    }

    .badge-resp { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; }
    
    .status-chip { 
      padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 750; background: #f1f5f9; color: #64748b;
    }
    .status-chip.danger { background: #fee2e2; color: #991b1b; }
    .status-chip.warning { background: #fef3c7; color: #92400e; }

    .chart-wrapper { position: relative; height: 300px; }
    .chart-canvas { max-height: 300px; }

    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AccountsReceivableComponent implements AfterViewInit {
  @Input() data!: AccountsReceivableReport;
  @ViewChild('donutChart') donutChart?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  ngAfterViewInit() {
    if (this.data && this.donutChart) {
      this.renderDonutChart();
    }
  }

  private renderDonutChart() {
    if (!this.donutChart?.nativeElement) return;

    const vencido = this.data.grafica_morosidad.vencido_30;
    const critico = this.data.grafica_morosidad.critico_30;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Vencido (< 30 días)', 'Crítico (> 30 días)'],
        datasets: [{
          data: [vencido, critico],
          backgroundColor: ['#f59e0b', '#ef4444'],
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

    this.chart?.destroy();
    this.chart = new Chart(this.donutChart.nativeElement, config);
  }
}



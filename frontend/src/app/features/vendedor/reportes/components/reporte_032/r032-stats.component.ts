import { Component, Input, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-r032-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-row">

      <!-- KPIs 2x2 -->
      <div class="kpis-grid">
        <!-- DESTACADO: Total histórico -->
        <div class="stat-card indigo highlight">
          <div class="stat-header">
            <span class="stat-label">Total histórico</span>
            <div class="stat-icon"><i class="bi bi-graph-up-arrow"></i></div>
          </div>
          <div class="stat-body">
            <h2 class="stat-value">{{ (data?.total_historico || 0) | currency }}</h2>
            <div class="stat-badge indigo">acumulado</div>
          </div>
        </div>

        <div class="stat-card success">
          <div class="stat-header">
            <span class="stat-label">Por cobrar</span>
            <div class="stat-icon"><i class="bi bi-wallet2"></i></div>
          </div>
          <div class="stat-body">
            <h2 class="stat-value">{{ (data?.ya_depositado || 0) | currency }}</h2>
            <div class="stat-badge success">ya depositado</div>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-header">
            <span class="stat-label">Pendiente aprobación</span>
            <div class="stat-icon"><i class="bi bi-clock-history"></i></div>
          </div>
          <div class="stat-body">
            <h2 class="stat-value">{{ (data?.pendiente_aprobacion || 0) | currency }}</h2>
            <div class="stat-badge warning">en revisión</div>
          </div>
        </div>

        <div class="stat-card danger">
          <div class="stat-header">
            <span class="stat-label">Futuras comisiones en riesgo</span>
            <div class="stat-icon"><i class="bi bi-exclamation-octagon"></i></div>
          </div>
          <div class="stat-body">
            <h2 class="stat-value">{{ (data?.comisiones_en_riesgo || 0) | currency }}</h2>
            <div class="stat-badge danger">por planes que vencen en &lt;30 días</div>
          </div>
        </div>
      </div>

      <!-- Gráfica Rendimiento -->
      <div class="chart-panel">
        <div class="chart-panel-header">
          <h4 class="chart-title">Rendimiento: Este Mes vs Mes Anterior</h4>
          <p class="chart-subtitle">Comparativa de comisiones generadas</p>
        </div>
        <div class="canvas-container">
          <canvas #chartCanvas></canvas>
        </div>
        <div class="chart-legend">
          <span class="legend-dot" style="background:#10b981"></span>
          <span class="legend-label">Este Mes</span>
          <span class="legend-value">{{ (data?.grafica_comparativa?.total_actual || 0) | currency }}</span>
          <span class="legend-dot" style="background:#cbd5e1; margin-left:1rem"></span>
          <span class="legend-label">Mes Anterior</span>
          <span class="legend-value">{{ (data?.grafica_comparativa?.total_anterior || 0) | currency }}</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .dashboard-row {
      display: grid;
      grid-template-columns: 1fr 48%;
      gap: 1rem;
      margin-bottom: 1.25rem;
      align-items: stretch;
    }

    /* KPIs 2x2 */
    .kpis-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .stat-card {
      background: white;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      min-height: 95px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      overflow: hidden;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border-color: #e2e8f0;
    }

    .stat-header { display: flex; justify-content: space-between; align-items: center; }
    .stat-label { color: #64748b; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }

    .stat-body { display: flex; flex-direction: column; gap: 0.4rem; }
    .stat-value { font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.03em; }

    .stat-badge {
      display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.65rem;
      font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 8px; width: fit-content;
      text-transform: lowercase;
    }

    /* Highlight card */
    .stat-card.highlight {
      background: var(--gradient-highlight);
      border-color: transparent;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
    }
    .stat-card.highlight .stat-label { color: rgba(255,255,255,0.8); }
    .stat-card.highlight .stat-value { color: #fff; }
    .stat-card.highlight .stat-icon  { background: rgba(255,255,255,0.2); color: #fff; }
    .stat-card.highlight .stat-badge { background: rgba(255,255,255,0.2); color: #fff; border: none; }

    /* THEMES */
    .success .stat-icon { background: var(--status-success-bg); color: var(--status-success); }
    .stat-badge.success { background: var(--status-success-bg); color: var(--status-success-text); border: 1px solid var(--status-success-bg); }
    .warning .stat-icon { background: var(--status-warning-bg); color: var(--status-warning); }
    .stat-badge.warning { background: var(--status-warning-bg); color: var(--status-warning-text); border: 1px solid var(--status-warning-bg); }
    .indigo .stat-icon  { background: var(--status-info-bg); color: var(--status-info); }
    .stat-badge.indigo  { background: var(--status-info-bg); color: var(--status-info-text); border: 1px solid var(--status-info-bg); }
    .danger .stat-icon  { background: var(--status-danger-bg); color: var(--status-danger); }
    .stat-badge.danger  { background: var(--status-danger-bg); color: var(--status-danger-text); border: 1px solid var(--status-danger-bg); }

    /* Chart panel */
    .chart-panel {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .chart-panel-header { }
    .chart-title { font-size: 0.85rem; font-weight: 800; color: #1e293b; margin: 0; }
    .chart-subtitle { font-size: 0.72rem; color: #64748b; margin: 0.15rem 0 0; }

    .canvas-container { position: relative; flex: 1; min-height: 140px; max-height: 160px; }

    .chart-legend {
      display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;
      font-size: 0.72rem; color: #475569;
    }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .legend-label { font-weight: 600; }
    .legend-value { font-weight: 700; color: #0f172a; }
  `]
})
export class R032StatsComponent implements AfterViewInit, OnChanges {
  @Input() data: any = null;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  ngAfterViewInit() { this.buildChart(); }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) setTimeout(() => this.buildChart(), 0);
  }

  private buildChart() {
    if (!this.chartCanvas) return;
    if (this.chart) { this.chart.destroy(); this.chart = null; }

    const actual = this.data?.grafica_comparativa?.total_actual ?? 0;
    const anterior = this.data?.grafica_comparativa?.total_anterior ?? 0;

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Este Mes', 'Mes Anterior'],
        datasets: [{
          data: [actual, anterior],
          backgroundColor: ['#10b981', '#cbd5e1'],
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b', padding: 10, cornerRadius: 10,
            callbacks: {
              label: (ctx: any) => ' $' + Number(ctx.raw ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
            }
          }
        }
      }
    });
  }
}

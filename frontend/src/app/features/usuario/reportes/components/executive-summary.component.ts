import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ExecutiveSummary } from '../services/financial-reports.service';

@Component({
  selector: 'app-executive-summary',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="fade-in">
      <div class="kpi-grid mb-4">
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="label">Ventas Totales</span>
            <span class="value">{{ data.ventas.total_facturado | currency }}</span>
            <span class="trend" [class.up]="data.ventas.variacion_porcentual >= 0" [class.down]="data.ventas.variacion_porcentual < 0">
              <i class="bi" [class.bi-arrow-up-short]="data.ventas.variacion_porcentual >= 0" [class.bi-arrow-down-short]="data.ventas.variacion_porcentual < 0"></i>
              {{ data.ventas.variacion_porcentual }}% vs prev.
            </span>
          </div>
          <div class="kpi-icon"><i class="bi bi-cart-check"></i></div>
        </div>
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="label">Facturado (Docs)</span>
            <span class="value">{{ data.ventas.facturas_emitidas }}</span>
            <span class="subtext">{{ data.ventas.clientes_activos }} Clientes Activos</span>
          </div>
          <div class="kpi-icon blue"><i class="bi bi-file-earmark-text"></i></div>
        </div>
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="label">Total Cobrado</span>
            <span class="value">{{ data.cobros.total_cobrado | currency }}</span>
            <span class="trend up">
              Recuperación: {{ data.cobros.porcentaje_recuperacion }}%
            </span>
          </div>
          <div class="kpi-icon green"><i class="bi bi-cash-stack"></i></div>
        </div>
        <div class="kpi-card glass">
          <div class="kpi-info">
            <span class="label">Pendiente Cobro</span>
            <span class="value text-danger">{{ data.cobros.pendiente_cobro | currency }}</span>
            <span class="subtext">Por cobrar a clientes</span>
          </div>
          <div class="kpi-icon red"><i class="bi bi-clock-history"></i></div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-md-6">
          <div class="card glass-card h-100">
            <div class="card-body">
              <h6 class="card-title mb-4">Eficiencia de Cobro</h6>
              <div class="progress-section mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <span class="small font-bold">Porcentaje de Recuperación</span>
                  <span class="small font-bold">{{ data.cobros.porcentaje_recuperacion }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="data.cobros.porcentaje_recuperacion"></div>
                </div>
              </div>
              <p class="text-muted small">Este porcentaje indica qué parte de las ventas totales del período ya han sido efectivamente recaudadas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
    .kpi-card {
      background: #fff; border: 1px solid #f1f5f9; border-radius: 24px; padding: 1.75rem;
      display: flex; justify-content: space-between; align-items: flex-start; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
    }
    .label { font-size: 0.82rem; font-weight: 750; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 0.5rem; }
    .value { font-size: 1.85rem; font-weight: 900; color: #0f172a; display: block; line-height: 1; }
    .trend { font-size: 0.85rem; font-weight: 700; margin-top: 0.75rem; display: inline-flex; align-items: center; }
    .trend.up { color: #10b981; }
    .trend.down { color: #ef4444; }
    .subtext { font-size: 0.8rem; color: #94a3b8; margin-top: 0.5rem; display: block; }
    .kpi-icon {
      width: 52px; height: 52px; border-radius: 16px; background: #fef3c7; color: #d97706;
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
    }
    .kpi-icon.blue { background: #e0f2fe; color: #0284c7; }
    .kpi-icon.green { background: #dcfce7; color: #059669; }
    .kpi-icon.red { background: #fee2e2; color: #dc2626; }
    .progress-track { height: 12px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 6px; transition: width 0.6s ease-out; }
    .glass-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ExecutiveSummaryComponent {
  @Input() data!: ExecutiveSummary;
}

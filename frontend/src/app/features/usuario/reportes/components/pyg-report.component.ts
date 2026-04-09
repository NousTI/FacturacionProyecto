import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { PyGReport } from '../services/financial-reports.service';

@Component({
  selector: 'app-pyg-report',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="card glass-card fade-in">
      <div class="card-body p-0">
        <div class="pyg-header p-4">
          <h5 class="fw-bold mb-0">Estado de Resultados</h5>
          <span class="text-muted small">Valores expresados en USD</span>
        </div>
        <div class="pyg-table">
          <div class="pyg-row header">INGRESOS</div>
          <div class="pyg-row indent">
            <span>Ventas Brutas</span>
            <span>{{ data.estructura.ingresos.ventas | currency }}</span>
          </div>
          <div class="pyg-row indent text-danger">
            <span>(-) Descuentos</span>
            <span>({{ data.estructura.ingresos.descuentos | currency }})</span>
          </div>
          <div class="pyg-row subtotal">
            <span>INGRESOS NETOS</span>
            <span>{{ data.estructura.ingresos.ingresos_netos | currency }}</span>
          </div>

          <div class="pyg-row header mt-3">COSTOS</div>
          <div class="pyg-row indent text-danger">
            <span>Costo de Ventas</span>
            <span>({{ data.estructura.costos_y_gastos.costo_de_ventas | currency }})</span>
          </div>
          <div class="pyg-row total-bruto">
            <span>UTILIDAD BRUTA</span>
            <span>{{ data.estructura.costos_y_gastos.utilidad_bruta | currency }}</span>
          </div>

          <div class="pyg-row indent text-muted mt-2 fst-italic">
            <span class="small">Nota: Gastos operativos no registrados aún.</span>
          </div>

          <div class="pyg-row final-utilidad mt-4">
            <span>UTILIDAD DEL EJERCICIO</span>
            <span>{{ data.estructura.utilidad_neta | currency }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-card { background: #fff; border: 1px solid #f1f5f9; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .pyg-row { display: flex; justify-content: space-between; padding: 0.85rem 1.5rem; font-size: 0.95rem; }
    .pyg-row.header { background: #f8fafc; font-weight: 850; color: #1e293b; font-size: 0.82rem; text-transform: uppercase; }
    .pyg-row.indent { padding-left: 3rem; font-weight: 500; border-bottom: 1px solid #f1f5f9; }
    .pyg-row.subtotal { font-weight: 800; border-top: 2px solid #e2e8f0; padding-top: 1rem; border-bottom: 1px solid #f1f5f9; }
    .pyg-row.total-bruto { font-weight: 900; background: #f1f5f9; border-radius: 0 0 12px 12px; }
    .pyg-row.final-utilidad { background: #1e293b; color: #fff; border-radius: 12px; font-weight: 900; font-size: 1.15rem; }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class PygReportComponent {
  @Input() data!: PyGReport;
}

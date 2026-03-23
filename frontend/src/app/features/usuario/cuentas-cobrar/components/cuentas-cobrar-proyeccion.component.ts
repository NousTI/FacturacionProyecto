import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProyeccionCobro } from '../../../../domain/models/cuentas-cobrar.model';
import { ChartCardComponent } from '../../../../shared/components/chart-card/chart-card.component';

@Component({
  selector: 'app-cuentas-cobrar-proyeccion',
  standalone: true,
  imports: [CommonModule, ChartCardComponent],
  template: `
    <div class="proyeccion-container">
      <div class="row g-3 mb-4">
        <div class="col-lg-8">
          <div class="soft-card p-4 rounded-4 shadow-sm border-0 bg-white">
            <div class="d-flex flex-column mb-4">
              <h5 class="fw-bold mb-1">Proyección Mensual de Cobros</h5>
              <small class="text-muted">Análisis basado en fechas de vencimiento de facturas actuales</small>
            </div>
            
            <div class="table-responsive">
              <table class="table table-hover align-middle custom-table">
                <thead>
                  <tr>
                    <th>Mes Estimado</th>
                    <th class="text-center">Cant. Facturas</th>
                    <th class="text-end">Monto Proyectado</th>
                    <th class="text-end fw-bold bg-light">Balance Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of data; let i = index">
                    <td class="fw-bold text-dark font-inter">{{ item.mes | uppercase }}</td>
                    <td class="text-center"><span class="badge bg-light text-dark rounded-circle px-3 py-2 border mb-0">{{ item.facturas_vencen }}</span></td>
                    <td class="text-end fw-bold text-primary">{{ item.monto_total | currency }}</td>
                    <td class="text-end fw-bold text-dark border-start bg-light">{{ getCumulative(i) | currency }}</td>
                  </tr>
                  <tr *ngIf="data.length === 0">
                    <td colspan="4" class="text-center py-5 text-muted">
                      No hay facturas proyectadas para los próximos meses.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
           <app-chart-card 
             title="Evolución Proyectada" 
             [data]="chartData"
             barColor="linear-gradient(180deg, #6366f1 0%, #a855f7 100%)">
           </app-chart-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-table th { 
      background: #f8fafc; 
      color: #64748b; 
      font-weight: 600; 
      text-transform: uppercase; 
      font-size: 0.75rem; 
      letter-spacing: 0.025em;
    }
    .custom-table td { border-bottom-color: #f1f5f9; }
  `]
})
export class CuentasCobrarProyeccionComponent {
  @Input() data: ProyeccionCobro[] = [];

  getCumulative(index: number): number {
    return this.data.slice(0, index + 1).reduce((acc, curr) => acc + curr.monto_total, 0);
  }

  get chartData() {
    return this.data.map(d => ({
      label: d.mes,
      value: d.monto_total
    }));
  }
}

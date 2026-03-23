import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AntiguedadCliente } from '../../../../domain/models/cuentas-cobrar.model';

@Component({
  selector: 'app-cuentas-cobrar-antiguedad',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="antiguedad-container">
      <div class="soft-card p-4 rounded-4 shadow-sm border-0 bg-white">
        <div class="d-flex flex-column mb-4">
          <h5 class="fw-bold mb-1">Antigüedad de Saldos</h5>
          <small class="text-muted">Análisis detallado de cartera por cliente y rangos de morosidad</small>
        </div>
        
        <div class="table-responsive">
          <table class="table table-hover align-middle custom-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th class="text-end">Vigente</th>
                <th class="text-end">1-30 días</th>
                <th class="text-end">31-60 días</th>
                <th class="text-end">+60 días</th>
                <th class="text-end fw-bold">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of data">
                <td class="fw-medium font-inter">{{ item.cliente }}</td>
                <td class="text-end text-success">{{ item.vigente | currency }}</td>
                <td class="text-end text-warning">{{ item.vencido_1_30 | currency }}</td>
                <td class="text-end text-orange">{{ item.vencido_31_60 | currency }}</td>
                <td class="text-end text-danger">{{ item.vencido_mas_60 | currency }}</td>
                <td class="text-end fw-bold text-dark border-start bg-light">{{ item.total | currency }}</td>
              </tr>
              <tr *ngIf="data.length === 0">
                <td colspan="6" class="text-center py-5 text-muted">
                  No hay datos de antigüedad disponibles.
                </td>
              </tr>
            </tbody>
            <tfoot *ngIf="data.length > 0">
               <tr class="table-light fw-bold text-dark">
                  <td>TOTALES CARTERA</td>
                  <td class="text-end">{{ totals.vigente | currency }}</td>
                  <td class="text-end">{{ totals.vencido_1_30 | currency }}</td>
                  <td class="text-end">{{ totals.vencido_31_60 | currency }}</td>
                  <td class="text-end">{{ totals.vencido_mas_60 | currency }}</td>
                  <td class="text-end border-start bg-primary text-white">{{ totals.total | currency }}</td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-orange { color: #f97316; }
    .custom-table th { 
      background: #f8fafc; 
      color: #64748b; 
      font-weight: 600; 
      text-transform: uppercase; 
      font-size: 0.75rem; 
      letter-spacing: 0.025em;
    }
  `]
})
export class CuentasCobrarAntiguedadComponent {
  @Input() data: AntiguedadCliente[] = [];

  get totals() {
    return this.data.reduce((acc, curr) => ({
      vigente: acc.vigente + curr.vigente,
      vencido_1_30: acc.vencido_1_30 + curr.vencido_1_30,
      vencido_31_60: acc.vencido_31_60 + curr.vencido_31_60,
      vencido_mas_60: acc.vencido_mas_60 + curr.vencido_mas_60,
      total: acc.total + curr.total,
    }), { vigente: 0, vencido_1_30: 0, vencido_31_60: 0, vencido_mas_60: 0, total: 0 });
  }
}

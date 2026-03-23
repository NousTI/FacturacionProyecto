import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialPago } from '../../../../domain/models/cuentas-cobrar.model';

@Component({
  selector: 'app-cuentas-cobrar-pagos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagos-container">
      <div class="soft-card p-4 rounded-4 shadow-sm border-0 bg-white">
        <div class="d-flex flex-column mb-4">
          <h5 class="fw-bold mb-1">Historial de Pagos Recibidos</h5>
          <small class="text-muted">Desglose de actividad económica reciente por facturas</small>
        </div>

        <div class="table-responsive">
          <table class="table table-hover align-middle custom-table">
            <thead>
              <tr>
                <th>Fecha Pago</th>
                <th>Cliente</th>
                <th class="text-center">Factura</th>
                <th class="text-center">Recibo #</th>
                <th class="text-end">Monto Pagado</th>
                <th class="text-center">Método</th>
                <th class="text-center">Usuario</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of data">
                <td class="small">{{ item.fecha_pago | date:'shortTime' }} <br> <span class="fw-bold">{{ item.fecha_pago | date:'mediumDate' }}</span></td>
                <td class="fw-medium text-dark">{{ item.cliente }}</td>
                <td class="text-center small"><code class="bg-light text-primary px-2 py-1 rounded">{{ item.numero_factura }}</code></td>
                <td class="text-center text-muted small">{{ item.numero_recibo || 'N/A' }}</td>
                <td class="text-end fw-bold text-success">{{ item.monto_pagado | currency }}</td>
                <td class="text-center">
                  <span class="badge rounded-pill bg-secondary text-white small px-2 py-1">
                    {{ item.metodo_pago || 'DEPOSITADO' }}
                  </span>
                </td>
                <td class="text-center small"><i class="bi bi-person-fill small me-1"></i>{{ item.usuario_registro || 'Admin' }}</td>
              </tr>
              <tr *ngIf="data.length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  No se han registrado pagos en este rango de fechas.
                </td>
              </tr>
            </tbody>
          </table>
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
export class CuentasCobrarPagosComponent {
  @Input() data: HistorialPago[] = [];
}

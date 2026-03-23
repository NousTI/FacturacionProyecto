import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClienteMoroso } from '../../../../domain/models/cuentas-cobrar.model';

@Component({
  selector: 'app-cuentas-cobrar-morosos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="morosos-container">
      <div class="soft-card p-4 rounded-4 shadow-sm border-0 bg-white">
        <div class="table-responsive">
          <span class="badge bg-danger-subtle text-danger rounded-pill border border-danger-subtle mb-2 small fw-normal">
             {{ data.length }} CLIENTES MOROSOS IDENTIFICADOS
          </span>
          <table class="table table-hover align-middle custom-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th class="text-center">Facturas Vencidas</th>
                <th class="text-end">Monto Adeudado</th>
                <th class="text-center">Mayor Antigüedad (días)</th>
                <th class="text-start">Último Pago</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of data">
                <td class="fw-medium">
                  <div class="d-flex flex-column">
                    <span>{{ item.cliente }}</span>
                    <small class="text-muted" *ngIf="item.email || item.telefono">
                      <i class="bi bi-envelope-fill me-1" *ngIf="item.email"></i>{{ item.email }}
                      <span class="mx-1" *ngIf="item.email && item.telefono">|</span>
                      <i class="bi bi-telephone-fill me-1" *ngIf="item.telefono"></i>{{ item.telefono }}
                    </small>
                  </div>
                </td>
                <td class="text-center">
                  <span class="badge bg-light text-dark rounded-circle px-3 py-2 border mb-0">{{ item.total_facturas_vencidas }}</span>
                </td>
                <td class="text-end fw-bold text-danger">{{ item.monto_total_adeudado | currency }}</td>
                <td class="text-center">
                  <span class="fw-bold text-orange">{{ item.mayor_antiguedad_dias }} días</span>
                </td>
                <td class="text-start">
                   <span class="text-muted small" *ngIf="item.ultima_fecha_pago">{{ item.ultima_fecha_pago | date:'shortDate' }}</span>
                   <span class="text-muted small italic" *ngIf="!item.ultima_fecha_pago">Nunca registrado</span>
                </td>
              </tr>
              <tr *ngIf="data.length === 0">
                <td colspan="5" class="text-center py-5 text-success fw-medium">
                  <i class="bi bi-check2-circle fs-3 d-block mb-2"></i>
                  ¡Enhorabuena! No se detectaron clientes morosos en este momento.
                </td>
              </tr>
            </tbody>
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
    .custom-table td { border-bottom-color: #f1f5f9; }
  `]
})
export class CuentasCobrarMorososComponent {
  @Input() data: ClienteMoroso[] = [];
}

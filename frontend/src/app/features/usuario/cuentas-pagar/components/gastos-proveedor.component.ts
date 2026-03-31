import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GastoProveedorDetalle } from '../../../../domain/models/cuentas-pagar.model';

@Component({
  selector: 'app-gastos-proveedor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="data" class="animate-in">
        <div class="card border-0 shadow-sm rounded-4">
            <div class="card-header bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
              <h6 class="mb-0 fw-bold">Top 10 Proveedores</h6>
              <span class="badge bg-primary rounded-pill small fw-medium">{{ data.length }} Aliados</span>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                      <thead class="bg-light">
                        <tr>
                          <th class="px-4 border-0 small text-muted">Proveedor</th>
                          <th class="border-0 small text-muted text-center">Facturas</th>
                          <th class="border-0 small text-muted text-end">Total Compras</th>
                          <th class="border-0 small text-muted text-end">Promedio x Factura</th>
                          <th class="px-4 border-0 small text-muted text-end">Última Compra</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of data">
                          <td class="px-4 border-0 fw-medium text-corporate">{{ item.proveedor }}</td>
                          <td class="border-0 text-center">
                            <span class="badge bg-light text-dark fw-medium rounded-pill">{{ item.cantidad_facturas }}</span>
                          </td>
                          <td class="border-0 text-end fw-bold">{{ item.total_compras | currency }}</td>
                          <td class="border-0 text-end small text-muted">{{ item.promedio_factura | currency }}</td>
                          <td class="px-4 border-0 text-end small text-muted">
                            {{ item.ultima_compra ? (item.ultima_compra | date:'dd/MM/yyyy') : '-' }}
                          </td>
                        </tr>
                        <tr *ngIf="data.length === 0">
                            <td colspan="5" class="text-center py-5 text-muted">Sin movimientos de compras</td>
                        </tr>
                      </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  `
})
export class GastosProveedorComponent {
  @Input() data: GastoProveedorDetalle[] = [];
}

import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagoGasto } from '../../../../../domain/models/pago-gasto.model';
import { Gasto } from '../../../../../domain/models/gasto.model';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { SRI_FORMAS_PAGO } from '../../../../../core/constants/sri-iva.constants';
import { EmpresaPaginacionComponent, PaginationState } from '../../../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-pagos-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HasPermissionDirective, EmpresaPaginacionComponent],
  template: `
    <section class="module-table-premium">
      <div class="table-container-premium">
        <div class="table-responsive-premium">
          <table class="table-editorial">
            <thead>
              <tr>
                <th style="width: 250px">Gasto / Factura</th>
                <th style="width: 150px">Monto</th>
                <th style="width: 150px">Fecha</th>
                <th style="width: 150px">Método</th>
                <th style="width: 150px">Referencia</th>
                <th class="text-center" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pago of pagos">
                <td>
                  <div class="d-flex flex-column text-truncate" style="max-width: 230px;">
                    <span class="fw-bold text-dark text-truncate">{{ getGastoInfo(pago.gasto_id) }}</span>
                  </div>
                </td>
                <td>
                  <span class="fw-bold text-success">\${{ pago.monto | number:'1.2-2' }}</span>
                </td>
                <td>
                  <span class="text-muted" style="font-size: 0.85rem;">{{ pago.fecha_pago | date:'mediumDate' }}</span>
                </td>
                <td>
                  <span class="text-capitalize badge-method-editorial">{{ getMetodoPagoLabel(pago.metodo_pago) }}</span>
                </td>
                <td>
                  <code class="text-muted">{{ pago.numero_referencia || '-' }}</code>
                </td>
                <td class="text-center">
                  <div class="dropdown d-flex justify-content-center">
                    <button 
                      class="btn-action-trigger-editorial" 
                      type="button" 
                      [id]="'actions-pago-' + pago.id" 
                      data-bs-toggle="dropdown" 
                      data-bs-boundary="viewport"
                      data-bs-popper-config='{"strategy":"fixed"}'
                      aria-expanded="false"
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4 shadow-sm" [attr.aria-labelledby]="'actions-pago-' + pago.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'view', data: pago})">
                          <i class="bi bi-eye"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      
                      <ng-container *hasPermission="'GESTIONAR_PAGOS'">
                        <li *ngIf="isPagoEditable(pago)">
                          <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'edit', data: pago})">
                            <i class="bi bi-pencil-square"></i>
                            <span class="ms-2">Editar</span>
                          </a>
                        </li>
                      </ng-container>

                      <li *hasPermission="'GESTIONAR_PAGOS'"><hr class="dropdown-divider mx-2"></li>
                      
                      <li *hasPermission="'GESTIONAR_PAGOS'">
                        <a class="dropdown-item rounded-3 py-2 text-danger" (click)="onAction.emit({type: 'delete', data: pago})">
                          <i class="bi bi-trash"></i>
                          <span class="ms-2">Anular Pago</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="pagos.length === 0">
                <td colspan="6" class="text-center p-5 text-muted small">No hay pagos registrados aún</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <app-empresa-paginacion
        [pagination]="pagination"
        (pageChange)="pageChange.emit($event)"
        (pageSizeChange)="pageSizeChange.emit($event)"
      ></app-empresa-paginacion>
    </section>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; }
    .module-table-premium { flex: 1; display: flex; flex-direction: column; min-height: 0; background: white; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; }
    .table-container-premium { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .table-responsive-premium { flex: 1; overflow-y: auto; overflow-x: auto; }
    
    .table-editorial { width: 100%; border-collapse: separate; border-spacing: 0; }
    .table-editorial th {
      padding: 1.25rem 1.5rem; background: #f8fafc; font-size: 0.85rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9;
    }
    .table-editorial td { padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; transition: all 0.2s; }
    .table-editorial tbody tr:hover td { background-color: #f8fafc; }

    .badge-method-editorial {
      background: #f1f5f9; color: #475569; padding: 0.35rem 0.6rem; border-radius: 8px; font-weight: 600; font-size: 0.75rem;
    }

    .btn-action-trigger-editorial {
      width: 32px; height: 32px; border-radius: 8px; border: none; background: transparent; color: #94a3b8; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;
    }
    .btn-action-trigger-editorial:hover { background: #f1f5f9; color: #1e293b; }

    .dropdown-menu {
      z-index: 1050; border: 1px solid #f1f5f9 !important; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
    }
    .dropdown-item {
      font-size: 0.9rem; font-weight: 500; color: #64748b; padding: 0.5rem 1rem; display: flex; align-items: center; cursor: pointer;
    }
    .dropdown-item:hover { background: #f8fafc; color: #1e293b; }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    .dropdown-item.text-danger:hover { background: #fef2f2; }
  `]
})
export class PagosTableComponent {
  @Input() pagos: PagoGasto[] = [];
  @Input() gastos: Gasto[] = [];
  @Input() pagination: PaginationState = {
    currentPage: 1,
    pageSize: 25,
    totalItems: 0
  };
  
  @Output() onAction = new EventEmitter<{
    type: 'view' | 'edit' | 'delete';
    data: PagoGasto;
  }>();

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  getGastoInfo(id: string): string {
    const g = this.gastos.find(x => x.id === id);
    return g ? `${g.concepto} (${g.numero_factura || 'S/N'})` : `Gasto #${id.substring(0,8)}`;
  }

  getGastoStatus(id: string): string {
    return this.gastos.find(x => x.id === id)?.estado_pago || 'pendiente';
  }

  isPagoEditable(pago: PagoGasto): boolean {
    const status = this.getGastoStatus(pago.gasto_id);
    if (status !== 'pagado') return true;

    // Si el gasto está totalmente pagado, analizamos la naturaleza del método de pago
    const isEfectivo = pago.metodo_pago === '01' || pago.metodo_pago?.toLowerCase() === 'efectivo';
    
    if (isEfectivo) {
      // El efectivo no requiere datos bancarios. Una vez pagada la factura, este registro queda blindado.
      return false; 
    }

    // Si es un método bancarizado (transferencia, tarjeta, etc), solo es editable 
    // si AÚN faltan los comprobantes requeridos
    const lacksReferencia = !pago.numero_referencia || pago.numero_referencia.trim() === '';
    const lacksComprobante = !pago.numero_comprobante || pago.numero_comprobante.trim() === '';

    return lacksReferencia || lacksComprobante;
  }

  getMetodoPagoLabel(codigo: string): string {
    if (!codigo) return '-';
    const method = SRI_FORMAS_PAGO.find(fp => fp.codigo === codigo);
    return method ? method.label : codigo.replace(/_/g, ' ');
  }
}

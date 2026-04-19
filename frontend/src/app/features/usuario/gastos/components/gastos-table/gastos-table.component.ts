import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Gasto } from '../../../../../domain/models/gasto.model';
import { CategoriaGasto } from '../../../../../domain/models/categoria-gasto.model';
import { Proveedor } from '../../../../../domain/models/proveedor.model';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { EmpresaPaginacionComponent, PaginationState } from '../../../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-gastos-table',
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
                <th style="width: 150px">Factura</th>
                <th style="width: 250px">Concepto / Proveedor</th>
                <th style="width: 180px">Categoría</th>
                <th style="width: 120px">Total</th>
                <th class="text-center" style="width: 130px">Estado</th>
                <th style="width: 120px">Fecha</th>
                <th class="text-center" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let gasto of gastos">
                <td>
                  <span class="badge-code-editorial">{{ gasto.numero_factura || 'S/N' }}</span>
                </td>
                <td>
                  <div class="d-flex flex-column text-truncate" style="max-width: 230px;">
                    <span class="fw-bold text-dark text-truncate" [title]="gasto.concepto">{{ gasto.concepto }}</span>
                    <small class="text-muted text-truncate">{{ getProveedorName(gasto.proveedor_id) }}</small>
                  </div>
                </td>
                <td>
                  <span class="badge-category-editorial">{{ getCategoriaName(gasto.categoria_gasto_id) }}</span>
                </td>
                <td>
                  <span class="fw-bold text-dark">\${{ gasto.total | number:'1.2-2' }}</span>
                </td>
                <td class="text-center">
                  <span class="badge-status-editorial" [ngClass]="gasto.estado_pago">
                    <i class="bi" [ngClass]="{
                      'bi-check-circle-fill': gasto.estado_pago === 'pagado',
                      'bi-clock-history': gasto.estado_pago === 'pendiente',
                      'bi-exclamation-circle-fill': gasto.estado_pago === 'vencido'
                    }"></i>
                    {{ gasto.estado_pago }}
                  </span>
                </td>
                <td>
                  <span class="text-muted" style="font-size: 0.85rem;">{{ gasto.fecha_emision | date:'shortDate' }}</span>
                </td>
                <td class="text-center">
                  <div class="dropdown d-flex justify-content-center">
                    <button 
                      class="btn-action-trigger-editorial" 
                      type="button" 
                      [id]="'actions-' + gasto.id" 
                      data-bs-toggle="dropdown" 
                      data-bs-boundary="viewport"
                      data-bs-popper-config='{"strategy":"fixed"}'
                      aria-expanded="false"
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4 shadow-sm" [attr.aria-labelledby]="'actions-' + gasto.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'view', data: gasto})">
                          <i class="bi bi-eye"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      
                      <ng-container *hasPermission="'GESTIONAR_GASTOS'">
                        <li *ngIf="gasto.estado_pago !== 'pagado'">
                          <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'edit', data: gasto})">
                            <i class="bi bi-pencil-square"></i>
                            <span class="ms-2">Editar</span>
                          </a>
                        </li>
                      </ng-container>

                      <ng-container *hasPermission="'GESTIONAR_PAGOS'">
                        <li *ngIf="gasto.estado_pago !== 'pagado'">
                          <a class="dropdown-item rounded-3 py-2 text-success" (click)="onAction.emit({type: 'pay', data: gasto})">
                            <i class="bi bi-cash"></i>
                            <span class="ms-2">Registrar Pago</span>
                          </a>
                        </li>
                      </ng-container>

                      <li *hasPermission="['GESTIONAR_GASTOS', 'GESTIONAR_PAGOS']"><hr class="dropdown-divider mx-2"></li>
                      
                      <li *hasPermission="'GESTIONAR_GASTOS'">
                        <a class="dropdown-item rounded-3 py-2 text-danger" (click)="onAction.emit({type: 'delete', data: gasto})">
                          <i class="bi bi-trash"></i>
                          <span class="ms-2">Eliminar</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="gastos.length === 0">
                <td colspan="7" class="text-center p-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                  No se encontraron egresos con los filtros aplicados.
                </td>
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
    .module-table-premium { flex: 1; display: flex; flex-direction: column; min-height: 0; background: white; border-radius: 24px; border: 1px solid var(--border-color); overflow: hidden; }
    .table-container-premium { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .table-responsive-premium { flex: 1; overflow-y: auto; overflow-x: auto; }

    .table-editorial { width: 100%; border-collapse: separate; border-spacing: 0; }
    .table-editorial th {
      padding: 1.25rem 1.5rem; background: var(--bg-main); font-size: 0.85rem;
      color: var(--text-muted); font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.5px; border-bottom: 1px solid var(--border-color);
    }
    .table-editorial td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; transition: all 0.2s; }
    .table-editorial tbody tr:hover td { background-color: #f8fafc; }

    .badge-code-editorial {
      background: var(--status-neutral-bg); color: var(--status-neutral-text);
      padding: 0.35rem 0.6rem; border-radius: 8px; font-weight: 700; font-size: 0.75rem;
    }
    .badge-category-editorial {
      background: var(--status-info-bg); color: var(--status-info-text);
      padding: 0.35rem 0.6rem; border-radius: 8px; font-weight: 600; font-size: 0.75rem;
    }

    .badge-status-editorial {
      display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem;
      border-radius: 10px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
    }
    .badge-status-editorial.pendiente { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .badge-status-editorial.pagado    { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-editorial.vencido   { background: var(--status-danger-bg);  color: var(--status-danger-text); }

    .btn-action-trigger-editorial {
      width: 32px; height: 32px; border-radius: 8px; border: none; background: transparent;
      color: var(--text-muted); transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;
    }
    .btn-action-trigger-editorial:hover { background: var(--status-neutral-bg); color: var(--text-main); }

    .dropdown-menu {
      z-index: 1050; border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08) !important;
    }
    .dropdown-item {
      font-size: 0.9rem; font-weight: 500; color: var(--text-muted);
      padding: 0.5rem 1rem; display: flex; align-items: center; cursor: pointer;
    }
    .dropdown-item:hover { background: var(--primary-color); color: #ffffff; }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    .dropdown-item.text-success:hover { background: var(--status-success-bg); color: var(--status-success-text); }
    .dropdown-item.text-danger:hover  { background: var(--status-danger-bg);  color: var(--status-danger-text); }
  `]
})
export class GastosTableComponent {
  @Input() gastos: Gasto[] = [];
  @Input() categorias: CategoriaGasto[] = [];
  @Input() proveedores: Proveedor[] = [];
  @Input() pagination: PaginationState = {
    currentPage: 1,
    pageSize: 25,
    totalItems: 0
  };
  
  @Output() onAction = new EventEmitter<{
    type: 'view' | 'edit' | 'delete' | 'pay';
    data: Gasto;
  }>();

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  getCategoriaName(id: string): string {
    return this.categorias.find(c => c.id === id)?.nombre || 'S/N';
  }

  getProveedorName(id?: string): string {
    if (!id) return '';
    return this.proveedores.find(p => p.id === id)?.razon_social || '';
  }
}

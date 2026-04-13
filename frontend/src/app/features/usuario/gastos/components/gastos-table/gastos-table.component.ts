import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Gasto } from '../../../../../domain/models/gasto.model';
import { CategoriaGasto } from '../../../../../domain/models/categoria-gasto.model';
import { Proveedor } from '../../../../../domain/models/proveedor.model';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-gastos-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HasPermissionDirective],
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
                      
                      <li *ngIf="gasto.estado_pago !== 'pagado'">
                        <a *hasPermission="'GASTOS_EDITAR'" class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'edit', data: gasto})">
                          <i class="bi bi-pencil-square"></i>
                          <span class="ms-2">Editar</span>
                        </a>
                      </li>

                      <li *ngIf="gasto.estado_pago !== 'pagado'">
                        <a *hasPermission="'PAGO_GASTO_CREAR'" class="dropdown-item rounded-3 py-2 text-success" (click)="onAction.emit({type: 'pay', data: gasto})">
                          <i class="bi bi-cash"></i>
                          <span class="ms-2">Registrar Pago</span>
                        </a>
                      </li>

                      <li><hr class="dropdown-divider mx-2"></li>
                      
                      <li>
                        <a *hasPermission="'GASTOS_ELIMINAR'" class="dropdown-item rounded-3 py-2 text-danger" (click)="onAction.emit({type: 'delete', data: gasto})">
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
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .module-table-premium {
      background: white; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden;
    }
    .table-container-premium { display: flex; flex-direction: column; }
    .table-responsive-premium { overflow-x: auto; }
    
    .table-editorial { width: 100%; border-collapse: separate; border-spacing: 0; }
    .table-editorial th {
      padding: 1.25rem 1.5rem; background: #f8fafc; font-size: 0.85rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9;
    }
    .table-editorial td { padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; transition: all 0.2s; }
    .table-editorial tbody tr:hover td { background-color: #f8fafc; }

    .badge-code-editorial {
      background: #f1f5f9; color: #475569; padding: 0.35rem 0.6rem; border-radius: 8px; font-weight: 700; font-size: 0.75rem;
    }
    .badge-category-editorial {
      background: rgba(99, 102, 241, 0.1); color: #6366f1; padding: 0.35rem 0.6rem; border-radius: 8px; font-weight: 600; font-size: 0.75rem;
    }

    .badge-status-editorial {
      display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
    }
    .badge-status-editorial.pendiente { background: #fff7ed; color: #9a3412; }
    .badge-status-editorial.pagado { background: #f0fdf4; color: #166534; }
    .badge-status-editorial.vencido { background: #fef2f2; color: #991b1b; }

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
    .dropdown-item.text-success:hover { background: #f0fdf4; }
    .dropdown-item.text-danger:hover { background: #fef2f2; }
  `]
})
export class GastosTableComponent {
  @Input() gastos: Gasto[] = [];
  @Input() categorias: CategoriaGasto[] = [];
  @Input() proveedores: Proveedor[] = [];
  
  @Output() onAction = new EventEmitter<{
    type: 'view' | 'edit' | 'delete' | 'pay';
    data: Gasto;
  }>();

  getCategoriaName(id: string): string {
    return this.categorias.find(c => c.id === id)?.nombre || 'S/N';
  }

  getProveedorName(id?: string): string {
    if (!id) return '';
    return this.proveedores.find(p => p.id === id)?.razon_social || '';
  }
}

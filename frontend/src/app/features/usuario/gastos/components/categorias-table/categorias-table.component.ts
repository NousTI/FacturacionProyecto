import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriaGasto } from '../../../../../domain/models/categoria-gasto.model';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { EmpresaPaginacionComponent, PaginationState } from '../../../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-categorias-table',
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
                <th style="width: 150px">Código</th>
                <th style="width: 300px">Nombre</th>
                <th style="width: 150px">Tipo</th>
                <th class="text-center" style="width: 130px">Estado</th>
                <th class="text-center" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cat of categorias">
                <td>
                  <span class="badge-code-editorial">{{ cat.codigo }}</span>
                </td>
                <td>
                  <span class="fw-bold text-dark">{{ cat.nombre }}</span>
                </td>
                <td>
                  <span class="text-muted text-capitalize" style="font-size: 0.9rem;">{{ cat.tipo }}</span>
                </td>
                <td class="text-center">
                  <span class="badge-status-editorial" [ngClass]="cat.activo ? 'activo' : 'inactivo'">
                    <i class="bi" [ngClass]="cat.activo ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ cat.activo ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td class="text-center">
                  <div class="dropdown d-flex justify-content-center">
                    <button 
                      class="btn-action-trigger-editorial" 
                      type="button" 
                      [id]="'actions-cat-' + cat.id" 
                      data-bs-toggle="dropdown" 
                      data-bs-boundary="viewport"
                      data-bs-popper-config='{"strategy":"fixed"}'
                      aria-expanded="false"
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4 shadow-sm" [attr.aria-labelledby]="'actions-cat-' + cat.id">
                      <li *hasPermission="'GESTIONAR_CATEGORIA_GASTO'">
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'edit', data: cat})">
                          <i class="bi bi-pencil-square"></i>
                          <span class="ms-2">Editar</span>
                        </a>
                      </li>
                      
                      <li *hasPermission="'GESTIONAR_CATEGORIA_GASTO'"><hr class="dropdown-divider mx-2"></li>
                      
                      <li *hasPermission="'GESTIONAR_CATEGORIA_GASTO'">
                        <a class="dropdown-item rounded-3 py-2 text-danger" (click)="onAction.emit({type: 'delete', data: cat})">
                          <i class="bi bi-trash"></i>
                          <span class="ms-2">Eliminar</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="categorias.length === 0">
                <td colspan="5" class="text-center p-5 text-muted small">No hay categorías registradas aún</td>
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

    .badge-code-editorial {
      background: #f1f5f9; color: #475569; padding: 0.35rem 0.6rem; border-radius: 8px; font-weight: 700; font-size: 0.75rem;
    }

    .badge-status-editorial {
      display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem;
      border-radius: 10px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
    }
    .badge-status-editorial.activo { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-editorial.inactivo { background: var(--status-neutral-bg); color: var(--status-neutral-text); }

    .btn-action-trigger-editorial {
      width: 32px; height: 32px; border-radius: 8px; border: none; background: transparent; color: #94a3b8; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center;
    }
    .btn-action-trigger-editorial:hover { background: #f1f5f9; color: black; }

    .dropdown-menu {
      z-index: 1050; border: 1px solid #f1f5f9 !important; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
    }
    .dropdown-item {
      font-size: 0.9rem; font-weight: 500; color: #64748b; padding: 0.5rem 1rem; display: flex; align-items: center; cursor: pointer;
    }
    .dropdown-item:hover { background: #f8fafc; color: black; }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    .dropdown-item.text-danger:hover { background: #fef2f2; }
  `]
})
export class CategoriasTableComponent {
  @Input() categorias: CategoriaGasto[] = [];
  @Input() pagination: PaginationState = {
    currentPage: 1,
    pageSize: 25,
    totalItems: 0
  };
  
  @Output() onAction = new EventEmitter<{
    type: 'edit' | 'delete';
    data: CategoriaGasto;
  }>();

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
}



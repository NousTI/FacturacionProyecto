import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaPaginacionComponent, PaginationState } from '../../../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-vendedor-clientes-table',
  standalone: true,
  imports: [CommonModule, EmpresaPaginacionComponent],
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 250px">Cliente</th>
                <th style="width: 180px">Empresa</th>
                <th style="width: 150px">Rol</th>
                <th style="width: 130px; text-align: center;">Estado</th>
                <th style="width: 160px">Último Acceso</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cliente of clientes">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-3">
                      {{ getInitials(cliente.nombres + ' ' + cliente.apellidos) }}
                    </div>
                    <div class="text-truncate" style="max-width: 180px;">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate">{{ cliente.nombres }} {{ cliente.apellidos }}</span>
                      <small class="text-muted d-block text-truncate" style="font-size: 0.72rem;">{{ cliente.email }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="text-corporate fw-700" style="font-size: 0.85rem;">{{ cliente.empresa_nombre || 'N/A' }}</span>
                </td>
                <td>
                  <span class="badge-role-premium">
                    {{ cliente.rol_nombre || 'Sin Rol' }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="cliente.activo ? 'activo' : 'inactivo'">
                    {{ cliente.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-600 text-muted" style="font-size: 0.82rem;">
                      {{ cliente.ultimo_acceso ? (cliente.ultimo_acceso | date:'dd/MM/yyyy HH:mm') : 'Sin registro' }}
                    </span>
                  </div>
                </td>
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + cliente.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-bs-popper-config='{"strategy":"fixed"}'
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" 
                        [attr.aria-labelledby]="'actions-' + cliente.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" 
                           (click)="onAction.emit({type: 'view_details', cliente})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li>
                        <div class="px-3 py-1 text-muted" style="font-size: 0.65rem;">
                          <i class="bi bi-lock-fill me-1"></i> Solo lectura (Vendedor)
                        </div>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="clientes.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-person-x fs-1 d-block mb-3"></i>
            No se encontraron usuarios para mostrar.
          </div>
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
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-height: 0;
    }
    .module-table { 
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .table-container {
      background: var(--bg-main, #ffffff);
      border-radius: 20px;
      border: 1px solid var(--border-color, #f1f5f9);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    .table-responsive-premium { 
      flex: 1;
      overflow-y: auto; 
      overflow-x: auto;
      position: relative; 
    }
    .table thead th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bg-main);
      padding: 1rem 1.25rem;
      font-size: var(--text-base);
      color: var(--text-main);
      font-weight: 800;
      border-bottom: 2px solid var(--border-color);
      vertical-align: middle;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .table tbody td {
      padding: 1.25rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: var(--text-md);
      vertical-align: middle;
    }
    
    .avatar-soft-premium {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1rem;
      background: var(--primary-color);
      color: #ffffff;
      flex-shrink: 0;
    }
    
    .badge-status-premium {
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      font-size: var(--text-xs);
      font-weight: 800;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .activo { background: var(--status-success-bg); color: var(--status-success-text); }
    .inactivo { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .badge-role-premium {
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      font-size: var(--text-xs);
      font-weight: 800;
      background: var(--status-neutral-bg);
      color: var(--text-main);
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: var(--text-muted);
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: var(--status-info-bg); color: var(--status-info-text);
    }
    
    .dropdown-menu {
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 1050 !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--text-main); padding: 0.5rem 1rem;
      display: flex; align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover { background: var(--status-info-bg); color: var(--status-info-text); }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    
    .fw-600 { font-weight: 600; }
    .fw-700 { font-weight: 700; }
    .fw-800 { font-weight: 800; }
    .text-corporate { color: var(--primary-color) !important; }
  `]
})
export class VendedorClientesTableComponent {
  @Input() clientes: any[] = [];
  @Input() pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };
  @Output() onAction = new EventEmitter<{ type: string, cliente: any }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getOrigenClass(origen?: string): string {
    if (!origen) return 'sistema';
    return origen.toLowerCase();
  }

  getOrigenIcon(origen?: string): string {
    switch (origen?.toLowerCase()) {
      case 'superadmin': return 'bi-shield-check';
      case 'vendedor': return 'bi-person-badge';
      default: return 'bi-cpu';
    }
  }
}

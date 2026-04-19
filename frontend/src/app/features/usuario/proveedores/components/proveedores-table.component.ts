import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../../domain/models/proveedor.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { GET_IDENTIFICACION_LABEL } from '../../../../core/constants/sri-iva.constants';
import { EmpresaPaginacionComponent, PaginationState } from '../../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-proveedores-table',
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
                <th style="width: 280px">Proveedor</th>
                <th style="width: 160px">Identificación</th>
                <th style="width: 140px" class="text-center">Estado</th>
                <th style="width: 250px">Contacto / Ubicación</th>
                <th style="width: 120px">Crédito</th>
                <th class="text-center" style="width: 100px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of proveedores">
                <!-- PROVEEDOR -->
                <td>
                  <div class="client-info-editorial">
                    <div class="avatar-editorial">
                      {{ getInitials(p.razon_social) }}
                    </div>
                    <div class="details-editorial">
                      <span class="name-editorial">{{ p.razon_social }}</span>
                      <span class="sub-editorial">{{ p.nombre_comercial || 'Sin nombre comercial' }}</span>
                    </div>
                  </div>
                </td>

                <!-- IDENTIFICACIÓN -->
                <td>
                  <div class="id-info-editorial">
                    <span class="id-value-editorial">{{ p.identificacion }}</span>
                    <span class="id-type-editorial">{{ getTipoIdLabel(p.tipo_identificacion) }}</span>
                  </div>
                </td>

                <!-- ESTADO -->
                <td class="text-center">
                  <span class="badge-status-editorial" [ngClass]="p.activo ? 'activo' : 'inactivo'">
                    <i class="bi" [ngClass]="p.activo ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ p.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>

                <!-- CONTACTO -->
                <td>
                  <div class="contact-info-editorial">
                    <div class="contact-item-editorial">
                      <i class="bi bi-envelope"></i>
                      <span>{{ p.email || '—' }}</span>
                    </div>
                    <div class="contact-item-editorial">
                      <i class="bi bi-geo-alt"></i>
                      <span>{{ p.ciudad }}, {{ p.provincia }}</span>
                    </div>
                  </div>
                </td>

                <!-- CRÉDITO -->
                <td>
                  <div class="credit-info-editorial">
                    <span class="amount-editorial">{{ p.dias_credito }} días</span>
                    <span class="days-editorial">Plazo</span>
                  </div>
                </td>

                <!-- ACCIONES -->
                <td class="text-center">
                  <div class="dropdown d-flex justify-content-center">
                    <button class="btn-action-trigger-editorial" 
                            type="button" 
                            [id]="'actions-' + p.id"
                            data-bs-toggle="dropdown" 
                            data-bs-boundary="viewport"
                            data-bs-popper-config='{"strategy":"fixed"}'
                            aria-expanded="false">
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4 shadow-sm" [attr.aria-labelledby]="'actions-' + p.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'view', proveedor: p})">
                          <i class="bi bi-eye"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      <li *hasPermission="'PROVEEDOR_EDITAR'">
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'edit', proveedor: p})">
                          <i class="bi bi-pencil-square"></i>
                          <span class="ms-2">Editar</span>
                        </a>
                      </li>
                      <li *hasPermission="'PROVEEDOR_EDITAR'">
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'toggle', proveedor: p})">
                          <i class="bi" [ngClass]="p.activo ? 'bi-toggle-off' : 'bi-toggle-on'"></i>
                          <span class="ms-2">{{ p.activo ? 'Desactivar' : 'Activar' }}</span>
                        </a>
                      </li>
                      <li *hasPermission="'PROVEEDOR_ELIMINAR'"><hr class="dropdown-divider mx-2"></li>
                      <li *hasPermission="'PROVEEDOR_ELIMINAR'">
                        <a class="dropdown-item rounded-3 py-2 text-danger" (click)="onAction.emit({type: 'delete', proveedor: p})">
                          <i class="bi bi-trash"></i>
                          <span class="ms-2">Eliminar</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="proveedores.length === 0">
                <td colspan="6" class="text-center p-5 text-muted">
                    <div class="empty-state-editorial">
                        <i class="bi bi-shop opacity-25" style="font-size: 3rem;"></i>
                        <h4 class="mt-3 fw-bold">No se encontraron proveedores</h4>
                        <p>No hay registros que coincidan con los filtros aplicados.</p>
                    </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación integrada -->
        <app-empresa-paginacion
          [pagination]="pagination"
          (pageChange)="pageChange.emit($event)"
          (pageSizeChange)="pageSizeChange.emit($event)"
        ></app-empresa-paginacion>
      </div>
    </section>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; }
    .module-table-premium { flex: 1; display: flex; flex-direction: column; min-height: 0; background: white; border-radius: 24px; border: 1px solid var(--border-color); overflow: hidden; }
    .table-container-premium { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .table-responsive-premium { flex: 1; overflow-y: auto; overflow-x: auto; overscroll-behavior: contain; }
    .table-editorial { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; }

    .table-editorial th {
      padding: 1.25rem 1.5rem; background: var(--bg-main); font-size: 0.75rem; font-weight: 800;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;
      border-bottom: 2px solid var(--border-color); text-align: left;
    }
    .table-editorial td { padding: 1.1rem 1.5rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; transition: all 0.2s; }
    .table-editorial tbody tr:hover td { background-color: #f8fafc; }
    .table-editorial tbody tr:last-child td { border-bottom: none; }

    .client-info-editorial { display: flex; align-items: center; gap: 1rem; }
    .avatar-editorial { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; background: var(--primary-color); color: #ffffff; }
    .details-editorial { display: flex; flex-direction: column; min-width: 0; }
    .name-editorial { font-weight: 700; color: #1e293b; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sub-editorial { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .id-info-editorial { display: flex; flex-direction: column; }
    .id-value-editorial { font-weight: 700; color: #475569; font-size: 0.9rem; }
    .id-type-editorial { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }

    .badge-status-editorial { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem; border-radius: 10px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
    .badge-status-editorial.activo { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-editorial.inactivo { background: var(--status-neutral-bg); color: var(--status-neutral-text); }

    .contact-info-editorial { display: flex; flex-direction: column; gap: 0.25rem; }
    .contact-item-editorial { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-muted); }
    .contact-item-editorial i { font-size: 0.9rem; color: var(--text-muted); }

    .credit-info-editorial { display: flex; flex-direction: column; }
    .amount-editorial { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
    .days-editorial { font-size: 0.75rem; color: var(--text-muted); }

    .btn-action-trigger-editorial {
      width: 34px; height: 34px; border-radius: 10px; border: none; background: transparent; color: var(--text-muted);
      display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .btn-action-trigger-editorial:hover { background: var(--status-neutral-bg); color: var(--text-main); }

    .dropdown-menu { border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08); padding: 0.5rem; z-index: 1050 !important; position: fixed !important; }
    .dropdown-item { border-radius: 8px; padding: 0.6rem 1rem; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.75rem; color: #475569; cursor: pointer; transition: all 0.2s; }
    .dropdown-item i { font-size: 1.1rem; }
    .dropdown-item:hover { background: var(--primary-color); color: #ffffff; }
    .dropdown-item.text-danger:hover { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .empty-state-editorial { text-align: center; }
  `]
})
export class ProveedoresTableComponent {
  @Input() proveedores: Proveedor[] = [];
  @Input() pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };

  @Output() onAction = new EventEmitter<{ type: string, proveedor: Proveedor }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  getTipoIdLabel(code: string): string {
    return GET_IDENTIFICACION_LABEL(code);
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  getAvatarColor(name: string, opacity: number): string {
    if (!name) return `rgba(148, 163, 184, ${opacity})`;
    const colors = [
      `rgba(99, 102, 241, ${opacity})`, `rgba(16, 185, 129, ${opacity})`,
      `rgba(245, 158, 11, ${opacity})`, `rgba(239, 68, 68, ${opacity})`,
      `rgba(139, 92, 246, ${opacity})`, `rgba(20, 184, 166, ${opacity})`
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  }
}

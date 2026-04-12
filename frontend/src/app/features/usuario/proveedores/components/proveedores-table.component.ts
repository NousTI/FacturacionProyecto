import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../../domain/models/proveedor.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { GET_IDENTIFICACION_LABEL } from '../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-proveedores-table',
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
                    <div class="avatar-editorial" [style.background]="getAvatarColor(p.razon_social, 0.1)" [style.color]="getAvatarColor(p.razon_social, 1)">
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
                      <li>
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'toggle', proveedor: p})">
                          <i class="bi" [ngClass]="p.activo ? 'bi-toggle-off' : 'bi-toggle-on'"></i>
                          <span class="ms-2">{{ p.activo ? 'Desactivar' : 'Activar' }}</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
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
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; flex: 1; min-height: 0; }
    .module-table-premium { background: white; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; }
    .table-container-premium { display: flex; flex-direction: column; }
    .table-responsive-premium { overflow-x: auto; overscroll-behavior: contain; }
    .table-editorial { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
    
    .table-editorial th {
      padding: 1.25rem 1.5rem; background: #f8fafc; font-size: 0.75rem; font-weight: 800;
      color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
      border-bottom: 2px solid #f1f5f9; text-align: left;
    }
    .table-editorial td { padding: 1.1rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; transition: all 0.2s; }
    .table-editorial tbody tr:hover td { background-color: #f8fafc; }
    .table-editorial tbody tr:last-child td { border-bottom: none; }

    .client-info-editorial { display: flex; align-items: center; gap: 1rem; }
    .avatar-editorial { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0; }
    .details-editorial { display: flex; flex-direction: column; min-width: 0; }
    .name-editorial { font-weight: 700; color: #1e293b; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sub-editorial { font-size: 0.75rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .id-info-editorial { display: flex; flex-direction: column; }
    .id-value-editorial { font-weight: 700; color: #475569; font-size: 0.9rem; }
    .id-type-editorial { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; }

    .badge-status-editorial { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem; border-radius: 10px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
    .badge-status-editorial.activo { background: #dcfce7; color: #15803d; }
    .badge-status-editorial.inactivo { background: #fee2e2; color: #dc2626; }

    .contact-info-editorial { display: flex; flex-direction: column; gap: 0.25rem; }
    .contact-item-editorial { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #64748b; }
    .contact-item-editorial i { font-size: 0.9rem; color: #94a3b8; }

    .credit-info-editorial { display: flex; flex-direction: column; }
    .amount-editorial { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
    .days-editorial { font-size: 0.75rem; color: #94a3b8; }

    .btn-action-trigger-editorial {
      width: 34px; height: 34px; border-radius: 10px; border: none; background: transparent; color: #94a3b8;
      display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .btn-action-trigger-editorial:hover { background: #f1f5f9; color: #1e293b; }

    .dropdown-menu { border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08); padding: 0.5rem; z-index: 1050 !important; position: fixed !important; }
    .dropdown-item { border-radius: 8px; padding: 0.6rem 1rem; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.75rem; color: #475569; cursor: pointer; transition: all 0.2s; }
    .dropdown-item i { font-size: 1.1rem; }
    .dropdown-item:hover { background: #f8fafc; color: #1e293b; }
    .dropdown-item.text-danger:hover { background: #fef2f2; }

    .empty-state-editorial { text-align: center; }
  `]
})
export class ProveedoresTableComponent {
  @Input() proveedores: Proveedor[] = [];
  @Output() onAction = new EventEmitter<{ type: string, proveedor: Proveedor }>();

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

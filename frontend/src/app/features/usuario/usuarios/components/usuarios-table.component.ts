import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../domain/models/user.model';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

import { EmpresaPaginacionComponent, PaginationState } from '../../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-usuarios-table',
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
                <th style="width: 320px">Usuario</th>
                <th style="width: 200px">Rol / Permisos</th>
                <th style="width: 250px">Contacto</th>
                <th style="width: 140px" class="text-center">Estado</th>
                <th class="text-center" style="width: 100px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuarios">
                
                <!-- USUARIO -->
                <td>
                  <div class="client-info-editorial">
                    <div class="avatar-soft-editorial">
                      {{ getInitials(u) }}
                    </div>
                    <div class="details-editorial">
                      <div class="d-flex align-items-center gap-2">
                        <span class="name-editorial">{{ u.nombres || u.nombre }} {{ u.apellidos || '' }}</span>
                        <span *ngIf="isSelf(u)" class="me-label">tú</span>
                      </div>
                      <span class="sub-editorial text-lowercase">{{ u.email || u.correo }}</span>
                    </div>
                  </div>
                </td>

                <!-- ROL -->
                <td>
                  <div class="role-info-editorial">
                    <span class="badge-role-editorial">{{ u.rol_nombre || u.role || 'Usuario' }}</span>
                    <span class="role-sub-editorial" *ngIf="u.empresa_nombre">{{ u.empresa_nombre }}</span>
                  </div>
                </td>

                <!-- CONTACTO -->
                <td>
                  <div class="contact-info-editorial">
                    <div class="contact-item-editorial">
                      <i class="bi bi-envelope"></i>
                      <span>{{ u.email || u.correo || '—' }}</span>
                    </div>
                    <div class="contact-item-editorial" *ngIf="u.telefono">
                      <i class="bi bi-phone"></i>
                      <span>{{ u.telefono }}</span>
                    </div>
                  </div>
                </td>

                <!-- ESTADO -->
                <td class="text-center">
                  <span class="badge-status-editorial" [ngClass]="u.activo !== false ? 'activo' : 'inactivo'">
                    <i class="bi" [ngClass]="u.activo !== false ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ u.activo !== false ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>

                <!-- ACCIONES -->
                <td class="text-center">
                  <div class="dropdown d-flex justify-content-center">
                    <button class="btn-action-trigger-editorial" 
                            type="button" 
                            [id]="'actions-' + u.id"
                            data-bs-toggle="dropdown" 
                            data-bs-boundary="viewport"
                            data-bs-popper-config='{"strategy":"fixed"}'
                            aria-expanded="false">
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4 shadow-sm" [attr.aria-labelledby]="'actions-' + u.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'view', usuario: u})">
                          <i class="bi bi-eye"></i>
                          <span class="ms-2">Perfil Completo</span>
                        </a>
                      </li>
                      <li *hasPermission="'USUARIOS_EDITAR'">
                        <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'edit', usuario: u})">
                          <i class="bi bi-pencil-square"></i>
                          <span class="ms-2">Editar Datos</span>
                        </a>
                      </li>
                      <ng-container *ngIf="!isSelf(u)">
                        <li *hasPermission="'USUARIOS_EDITAR'">
                          <a class="dropdown-item rounded-3 py-2" (click)="onAction.emit({type: 'role', usuario: u})">
                            <i class="bi bi-shield-lock"></i>
                            <span class="ms-2">Cambiar Rol</span>
                          </a>
                        </li>
                        <li *hasPermission="'USUARIOS_ELIMINAR'"><hr class="dropdown-divider mx-2"></li>
                        <li *hasPermission="'USUARIOS_ELIMINAR'">
                          <a class="dropdown-item rounded-3 py-2 text-danger" (click)="onAction.emit({type: 'delete', usuario: u})">
                            <i class="bi bi-person-x"></i>
                            <span class="ms-2">Eliminar Usuario</span>
                          </a>
                        </li>
                      </ng-container>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- EMPTY STATE -->
          <div *ngIf="usuarios.length === 0" class="empty-state-editorial p-5">
            <div class="empty-icon-editorial mb-3">
              <i class="bi bi-people opacity-25" style="font-size: 3.5rem;"></i>
            </div>
            <h4 class="fw-bold">No se encontraron usuarios</h4>
            <p class="text-muted">No hay registros que coincidan con la búsqueda o filtros aplicados.</p>
          </div>
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
    .module-table-premium { flex: 1; display: flex; flex-direction: column; min-height: 0; background: white; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    .table-container-premium { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .table-responsive-premium { flex: 1; overflow-y: auto; overflow-x: auto; overscroll-behavior: contain; }
    .table-editorial { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
    
    .table-editorial th {
      padding: 1.25rem 1.5rem; background: var(--bg-main, #f8fafc); font-size: 0.75rem; font-weight: 800;
      color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em;
      border-bottom: 2px solid var(--border-color, #f1f5f9); text-align: left;
    }
    .table-editorial td { padding: 1.1rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; transition: all 0.2s; }
    .table-editorial tbody tr:hover td { background-color: #f8fafc; }
    .table-editorial tbody tr:last-child td { border-bottom: none; }

    .client-info-editorial { display: flex; align-items: center; gap: 1rem; }
    .avatar-soft-editorial { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; background: var(--primary-color); color: #ffffff; }
    .details-editorial { display: flex; flex-direction: column; min-width: 0; }
    .name-editorial { font-weight: 700; color: #1e293b; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sub-editorial { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .me-label { font-size: 0.65rem; font-weight: 900; color: var(--status-info-text); background: var(--status-info-bg); padding: 0.1rem 0.5rem; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.02em; }

    .role-info-editorial { display: flex; flex-direction: column; gap: 0.25rem; }
    .badge-role-editorial { display: inline-flex; font-size: 0.75rem; font-weight: 800; color: var(--status-info-text); background: var(--status-info-bg); padding: 0.3rem 0.75rem; border-radius: 8px; width: fit-content; }
    .role-sub-editorial { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .contact-info-editorial { display: flex; flex-direction: column; gap: 0.25rem; }
    .contact-item-editorial { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #64748b; }
    .contact-item-editorial i { font-size: 0.9rem; color: #94a3b8; }

    .badge-status-editorial { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.8rem; border-radius: 10px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
    .badge-status-editorial.activo { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-editorial.inactivo { background: var(--status-neutral-bg); color: var(--status-neutral-text); }

    .btn-action-trigger-editorial {
      width: 34px; height: 34px; border-radius: 10px; border: none; background: transparent; color: #94a3b8;
      display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .btn-action-trigger-editorial:hover { background: #f1f5f9; color: #1e293b; }

    .dropdown-menu { border-radius: 14px; border: 1px solid #f1f5f9; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); padding: 0.5rem; z-index: 1050 !important; position: fixed !important; }
    .dropdown-item { border-radius: 10px; padding: 0.65rem 1rem; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.75rem; color: #475569; cursor: pointer; transition: all 0.2s; }
    .dropdown-item i { font-size: 1.1rem; color: #94a3b8; transition: all 0.2s; }
    .dropdown-item:hover { background: #f8fafc; color: #1e293b; }
    .dropdown-item:hover i { color: #1e293b; }
    .dropdown-item.text-danger:hover { background: #fff1f2; color: #f43f5e; }
    .dropdown-item.text-danger:hover i { color: #f43f5e; }

    .empty-state-editorial { text-align: center; }
  `]
})
export class UsuariosTableComponent {
  @Input() usuarios: User[] = [];
  @Input() currentUserId: string = '';
  @Input() pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };

  @Output() onAction = new EventEmitter<{ type: string, usuario: User }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  isSelf(u: User): boolean {
    const targetId = String(u.id || '');
    const targetAuthId = String(u.user_id || (u as any).usuario_id || '');
    return this.currentUserId === targetId || this.currentUserId === targetAuthId;
  }

  getInitials(u: User): string {
    const name = u.nombres || u.nombre || '';
    const last = u.apellidos || '';
    if (!name) return '??';
    return (name[0] + (last ? last[0] : (name[1] || ''))).toUpperCase();
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

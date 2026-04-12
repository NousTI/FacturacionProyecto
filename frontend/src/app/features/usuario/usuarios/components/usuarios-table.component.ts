import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../domain/models/user.model';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-usuarios-table',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <div class="table-premium-container">
      <div class="table-responsive">
        <table class="table-premium">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Contacto</th>
              <th>Rol / Permisos</th>
              <th>Estado</th>
              <th class="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of usuarios" class="table-row">
              <!-- USUARIO -->
              <td>
                <div class="user-info">
                  <div class="avatar" [style.background]="getAvatarColor((u.nombre || u.nombres || ''), 0.1)" [style.color]="getAvatarColor((u.nombre || u.nombres || ''), 1)">
                    {{ getInitials(u) }}
                  </div>
                  <div class="details">
                    <div class="name-container">
                      <span class="name">{{ u.nombres || u.nombre }} {{ u.apellidos || '' }}</span>
                      <span *ngIf="isSelf(u)" class="me-label">(tu)</span>
                    </div>
                    <span class="sub text-lowercase">{{ u.email || u.correo }}</span>
                  </div>
                </div>
              </td>

              <!-- CONTACTO -->
              <td>
                <div class="contact-info">
                  <div class="contact-item">
                    <i class="bi bi-envelope"></i>
                    <span>{{ u.email || u.correo || '—' }}</span>
                  </div>
                  <div class="contact-item" *ngIf="u.telefono">
                    <i class="bi bi-phone"></i>
                    <span>{{ u.telefono }}</span>
                  </div>
                </div>
              </td>

              <!-- ROL -->
              <td>
                <div class="role-info">
                  <span class="role-badge">{{ u.rol_nombre || u.role || 'Usuario' }}</span>
                  <span class="role-sub" *ngIf="u.empresa_nombre">{{ u.empresa_nombre }}</span>
                </div>
              </td>

              <!-- ESTADO -->
              <td>
                <span class="status-badge" [ngClass]="u.activo !== false ? 'active' : 'inactive'">
                  <i class="bi" [ngClass]="u.activo !== false ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  {{ u.activo !== false ? 'Activo' : 'Inactivo' }}
                </span>
              </td>

              <!-- ACCIONES -->
              <td class="text-center">
                <div class="dropdown">
                  <button class="btn-actions" 
                          type="button" 
                          data-bs-toggle="dropdown" 
                          aria-expanded="false"
                          data-bs-popper-config='{"strategy":"fixed"}'>
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                      <a class="dropdown-item" (click)="onAction.emit({type: 'view', usuario: u})">
                        <i class="bi bi-eye text-primary"></i> Perfil Completo
                      </a>
                    </li>
                    <li *hasPermission="'USUARIOS_EMPRESA_EDITAR'">
                      <a class="dropdown-item" (click)="onAction.emit({type: 'edit', usuario: u})">
                        <i class="bi bi-pencil-square text-success"></i> Editar Datos
                      </a>
                    </li>
                    <li *hasPermission="'USUARIOS_EMPRESA_EDITAR'">
                      <a class="dropdown-item" (click)="onAction.emit({type: 'role', usuario: u})">
                        <i class="bi bi-shield-lock text-warning"></i> Cambiar Rol
                      </a>
                    </li>
                    <li *hasPermission="'USUARIOS_EMPRESA_ELIMINAR'">
                      <hr class="dropdown-divider">
                    </li>
                    <li *hasPermission="'USUARIOS_EMPRESA_ELIMINAR'">
                      <a class="dropdown-item text-danger" (click)="onAction.emit({type: 'delete', usuario: u})">
                        <i class="bi bi-person-x"></i> Eliminar Usuario
                      </a>
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- EMPTY STATE -->
        <div *ngIf="usuarios.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="bi bi-people"></i>
          </div>
          <h3>No se encontraron usuarios</h3>
          <p>No hay registros que coincidan con la búsqueda o filtros aplicados.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-premium-container { background: white; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; }
    .table-premium { width: 100%; border-collapse: separate; border-spacing: 0; }
    .table-premium thead th { background: #f8fafc; padding: 1.25rem 1.5rem; font-size: 0.75rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; }
    .table-row { transition: all 0.2s; }
    .table-row:hover { background: #f8fafc; }
    .table-row td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .table-row:last-child td { border-bottom: none; }
    .user-info { display: flex; align-items: center; gap: 1rem; }
    .avatar { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }
    .details { display: flex; flex-direction: column; }
    .name-container { display: flex; align-items: center; gap: 0.5rem; }
    .name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .me-label { font-size: 0.65rem; font-weight: 900; color: #3b82f6; background: #eff6ff; padding: 0.1rem 0.4rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.02em; }
    .sub { font-size: 0.75rem; color: #94a3b8; }
    .contact-info { display: flex; flex-direction: column; gap: 0.3rem; }
    .contact-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #64748b; }
    .contact-item i { font-size: 0.9rem; color: #94a3b8; }
    .role-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .role-badge { display: inline-block; font-size: 0.75rem; font-weight: 800; color: #475569; background: #f1f5f9; padding: 0.25rem 0.6rem; border-radius: 6px; width: fit-content; }
    .role-sub { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
    .status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.75rem; font-weight: 700; }
    .status-badge.active { background: #15803d; color: white; }
    .status-badge.inactive { background: #dc2626; color: white; }
    .btn-actions { 
      width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent; color: #94a3b8; 
      display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin: 0 auto;
    }
    .btn-actions:hover { background: #f1f5f9; color: #1e293b; }
    .dropdown-menu { border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); padding: 0.5rem; }
    .dropdown-item { border-radius: 8px; padding: 0.6rem 1rem; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 0.75rem; color: #475569; cursor: pointer; }
    .dropdown-item i { font-size: 1rem; }
    .dropdown-item:hover { background: #f8fafc; }
    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 64px; height: 64px; background: #f8fafc; color: #cbd5e1; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem; }
    .empty-state h3 { font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .empty-state p { color: #64748b; max-width: 400px; margin: 0 auto; }
  `]
})
export class UsuariosTableComponent {
  @Input() usuarios: User[] = [];
  @Input() currentUserId: string = '';
  @Output() onAction = new EventEmitter<{ type: string, usuario: User }>();

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

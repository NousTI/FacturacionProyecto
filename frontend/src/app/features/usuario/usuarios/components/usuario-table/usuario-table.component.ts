import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { User } from '../../../../../domain/models/user.model';
import { AuthService } from '../../../../../core/auth/auth.service';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';
import { USUARIOS_PERMISSIONS } from '../../../../../constants/permission-codes';

@Component({
    selector: 'app-usuario-table',
    standalone: true,
    imports: [CommonModule, DatePipe, HasPermissionDirective],
    template: `
    <section class="module-table">
      <div class="table-container border-0 shadow-premium">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th>Usuario</th>
                <th style="width: 150px">Rol</th>
                <th style="width: 120px">Estado</th>
                <th style="width: 200px">📧 Contacto</th>
                <th style="width: 180px">Último Acceso</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let usuario of usuarios">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-3" 
                         [style.background]="getAvatarColor(usuario.nombres || usuario.nombre || 'U', 0.1)" 
                         [style.color]="getAvatarColor(usuario.nombres || usuario.nombre || 'U', 1)">
                      {{ getInitials(usuario.nombres || usuario.nombre || 'U') }}
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block mb-0">
                        {{ (usuario.nombres || usuario.nombre) }} {{ (usuario.apellidos || usuario.apellido) }}
                      </span>
                      <small class="text-muted" style="font-size: 0.75rem;">ID: {{ usuario.id.substring(0,8) }}...</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge-role" 
                        [style.background]="getRolBadgeBg(usuario.rol_codigo || usuario.role)"
                        [style.color]="getRolBadgeColor(usuario.rol_codigo || usuario.role)">
                    {{ usuario.rol_nombre || usuario.role || 'Sin rol' }}
                  </span>
                </td>
                <td>
                  <span class="badge-status-premium" [ngClass]="usuario.activo !== false ? 'activo' : 'inactivo'">
                    {{ usuario.activo !== false ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="text-dark" style="font-size: 0.85rem;">{{ usuario.email || usuario.correo }}</span>
                    <small class="text-muted" style="font-size: 0.75rem;">{{ usuario.telefono || '-' }}</small>
                  </div>
                </td>
                <td>
                  <div class="d-flex flex-column">
                    <span class="text-dark" style="font-size: 0.85rem;">{{ usuario.ultimo_acceso ? (usuario.ultimo_acceso | date:'short') : 'Nunca' }}</span>
                  </div>
                </td>
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + usuario.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow-premium-lg border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + usuario.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view', usuario})">
                          <i class="bi bi-eye text-corporate"></i>
                          <span class="ms-2">Ver Perfil</span>
                        </a>
                      </li>
                      <li *hasPermission="'USUARIOS_EMPRESA_EDITAR'">
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'edit', usuario})">
                          <i class="bi bi-pencil-square text-corporate"></i>
                          <span class="ms-2">Editar Datos</span>
                        </a>
                      </li>
                      <li *hasPermission="'USUARIOS_EMPRESA_EDITAR'">
                        <a class="dropdown-item rounded-3 py-2"
                           [class.disabled]="isCurrentUser(usuario)"
                           href="javascript:void(0)"
                           (click)="!isCurrentUser(usuario) && onAction.emit({type: 'role', usuario})">
                          <i class="bi bi-person-badge text-corporate"></i>
                          <span class="ms-2">Cambiar Rol</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li *hasPermission="'USUARIOS_EMPRESA_ELIMINAR'">
                        <a class="dropdown-item rounded-3 py-2 text-danger"
                           [class.disabled]="isCurrentUser(usuario)"
                           href="javascript:void(0)"
                           (click)="!isCurrentUser(usuario) && onAction.emit({type: 'delete', usuario})">
                          <i class="bi bi-trash"></i>
                          <span class="ms-2">Eliminar</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div *ngIf="usuarios.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-people fs-1 d-block mb-3"></i>
            No se encontraron usuarios en esta empresa.
          </div>
        </div>
      </div>
    </section>
  `,
    styles: [`
    .module-table { margin-top: 1.5rem; }
    .table-container {
      background: #ffffff;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      overflow: visible !important;
    }
    .table-responsive-premium { overflow: visible !important; position: relative; }
    .table thead th {
      background: #f8fafc;
      padding: 1.15rem 1.5rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 800;
      border-bottom: 2px solid #f1f5f9;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f8fafc;
    }
    
    .avatar-soft-premium {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.85rem;
    }
    
    .badge-status-premium {
      padding: 0.4rem 0.85rem; border-radius: 100px;
      font-size: 0.7rem; font-weight: 800;
      text-transform: uppercase;
    }
    .badge-status-premium.activo { background: #dcfce7; color: #15803d; }
    .badge-status-premium.inactivo { background: #fee2e2; color: #b91c1c; }

    .badge-role {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .badge-role.ADMIN { background: #ede9fe; color: #6d28d9; }
    .badge-role.VENDEDOR { background: #e0f2fe; color: #0369a1; }
    .badge-role.USUARIO { background: #f1f5f9; color: #475569; }

    .btn-action-trigger {
      background: #f8fafc; border: none;
      width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8;
      transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #161d35; color: #ffffff;
    }
    
    .dropdown-menu {
      z-index: 1000;
      min-width: 220px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.2) !important;
      padding: 0.75rem !important;
    }
    .dropdown-item {
      font-size: 0.85rem; font-weight: 600;
      color: #475569; padding: 0.65rem 1rem;
      display: flex; align-items: center;
      border-radius: 10px !important;
    }
    .dropdown-item:hover { background: #f8fafc; color: #161d35; }
    .dropdown-item i { font-size: 1.1rem; }
    
    .text-corporate { color: #161d35 !important; }
    .shadow-premium { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04); }
  `]
})
export class UsuarioTableComponent {
    @Input() usuarios: User[] = [];
    @Output() onAction = new EventEmitter<{ type: string, usuario: User }>();

    constructor(private authService: AuthService) {}

    isCurrentUser(usuario: User): boolean {
        const currentUser = this.authService.getUser();
        if (!currentUser) return false;
        
        // Comparar el ID de usuario de negocio (usuarios.id)
        const sessionUsuarioId = (currentUser as any).usuario_id;
        return usuario.id === sessionUsuarioId;
    }

    getRolBadgeBg(code: string | undefined): string {
        if (!code) return '#f1f5f9';
        const c = code.toUpperCase();
        if (c.includes('ADMIN')) return '#ede9fe';
        if (c.includes('VEND')) return '#e0f2fe';
        return '#f1f5f9';
    }

    getRolBadgeColor(code: string | undefined): string {
        if (!code) return '#475569';
        const c = code.toUpperCase();
        if (c.includes('ADMIN')) return '#6d28d9';
        if (c.includes('VEND')) return '#0369a1';
        return '#475569';
    }

    getInitials(name: string): string {
        if (!name) return '??';
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    }

    getAvatarColor(name: string, opacity: number): string {
        if (!name) return `rgba(148, 163, 184, ${opacity})`;
        const colors = [
            `rgba(99, 102, 241, ${opacity})`,
            `rgba(16, 185, 129, ${opacity})`,
            `rgba(245, 158, 11, ${opacity})`,
            `rgba(239, 68, 68, ${opacity})`,
            `rgba(139, 92, 246, ${opacity})`,
            `rgba(20, 184, 166, ${opacity})`
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
}

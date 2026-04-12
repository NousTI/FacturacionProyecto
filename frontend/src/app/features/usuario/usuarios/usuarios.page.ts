import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';

import { UsuariosStatsComponent } from './components/usuarios-stats.component';
import { UsuariosActionsComponent } from './components/usuarios-actions.component';
import { UsuariosTableComponent } from './components/usuarios-table.component';
import { UsuarioFormModalComponent } from './components/modals/usuario-form-modal.component';
import { UsuarioDetailModalComponent } from './components/modals/usuario-detail-modal.component';
import { UsuarioRoleModalComponent } from './components/modals/usuario-role-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

import { UsuariosService, UsuariosStats } from './services/usuarios.service';
import { UiService } from '../../../shared/services/ui.service';
import { User } from '../../../domain/models/user.model';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { USUARIOS_PERMISSIONS } from '../../../constants/permission-codes';
import { inject } from '@angular/core';

@Component({
  selector: 'app-usuario-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UsuariosStatsComponent,
    UsuariosActionsComponent,
    UsuariosTableComponent,
    UsuarioFormModalComponent,
    UsuarioDetailModalComponent,
    UsuarioRoleModalComponent,
    ConfirmModalComponent,
    ToastComponent
  ],
  template: `
    <div class="usuarios-page-container">
      <ng-container *ngIf="canView; else noPermission">
        
        <!-- 1. STATS -->
        <app-usuarios-stats
          *ngIf="stats$ | async as st"
          [total]="st.total"
          [active]="st.activos"
          [inactive]="st.inactivos"
        ></app-usuarios-stats>

        <!-- 2. ACCIONES Y FILTROS -->
        <app-usuarios-actions
          [(searchQuery)]="searchQuery"
          [isLoading]="isLoading"
          [availableRoles]="availableRoles"
          (onFilterChangeEmit)="handleFilters($event)"
          (onCreate)="openCreateModal()"
          (onRefresh)="refreshData()"
        ></app-usuarios-actions>

        <!-- 3. TABLA -->
        <app-usuarios-table
          [usuarios]="filteredUsuarios"
          [currentUserId]="currentUserId"
          (onAction)="handleAction($event)"
        ></app-usuarios-table>

      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container">
          <div class="icon-lock-wrapper">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h2>Acceso Restringido</h2>
          <p>
            No tienes permisos suficientes para gestionar los usuarios de esta empresa. 
            Si crees que esto es un error, contacta a tu administrador.
          </p>
          <button class="btn-retry" (click)="refreshData()">
            <i class="bi bi-arrow-clockwise me-2"></i> Reintentar sincronización
          </button>
        </div>
      </ng-template>

      <!-- MODALES -->
      <app-usuario-form-modal
        *ngIf="showFormModal"
        [usuario]="selectedUsuario"
        [loading]="isSaving"
        (onSave)="saveUsuario($event)"
        (onClose)="showFormModal = false"
      ></app-usuario-form-modal>

      <app-usuario-detail-modal
        *ngIf="showDetailModal && selectedUsuario"
        [usuario]="selectedUsuario"
        (onClose)="showDetailModal = false"
      ></app-usuario-detail-modal>

      <app-usuario-role-modal
        *ngIf="showRoleModal && selectedUsuario"
        [usuario]="selectedUsuario"
        [loading]="isSaving"
        (onSave)="saveRole($event)"
        (onClose)="showRoleModal = false"
      ></app-usuario-role-modal>

      <app-confirm-modal
        *ngIf="showConfirmModal"
        title="¿Eliminar Usuario?"
        [message]="'¿Estás seguro de que deseas eliminar a ' + (selectedUsuario?.nombres || selectedUsuario?.nombre) + '? Perderá el acceso de forma inmediata.'"
        confirmText="Eliminar permanentemente"
        type="danger"
        icon="bi-person-x-fill"
        [loading]="isDeleting"
        (onConfirm)="deleteUsuario()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; width: 100%; overflow: hidden; min-height: 0; }
    .usuarios-page-container { flex: 1; display: flex; flex-direction: column; background: var(--bg-main, #ffffff); padding: 0; overflow: hidden; min-height: 0; gap: 24px; }
    
    /* No Permission */
    .no-permission-container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 3rem; }
    .icon-lock-wrapper {
      width: 100px; height: 100px; background: #fee2e2; color: #ef4444; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 3rem;
      margin-bottom: 1.5rem; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);
    }
    .no-permission-container h2 { font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .no-permission-container p { color: #64748b; max-width: 400px; margin-bottom: 2rem; line-height: 1.6; }
    .btn-retry { background: #1e293b; color: white; border: none; padding: 1rem 2rem; border-radius: 100px; font-weight: 700; transition: all 0.2s; cursor: pointer; }
    .btn-retry:hover { transform: scale(1.05); background: #0f172a; }
  `]
})
export class UsuariosPage implements OnInit, OnDestroy {
  usuarios$: Observable<User[]>;
  stats$: Observable<UsuariosStats>;

  filteredUsuarios: User[] = [];
  searchQuery: string = '';
  filters = { rol: 'ALL', estado: 'ALL' };
  
  get currentUserId(): string {
    const user = this.authService.getUser();
    return String(user?.id || (user as any)?.usuario_id || (user as any)?.id_usuario || '');
  }

  // Modales
  showFormModal = false;
  showDetailModal = false;
  showRoleModal = false;
  showConfirmModal = false;
  selectedUsuario: User | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;

  private destroy$ = new Subject<void>();
  private _allUsuarios: User[] = [];
  availableRoles: any[] = [];

  private permissionsService = inject(PermissionsService);

  constructor(
    private usuariosService: UsuariosService,
    private uiService: UiService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {
    this.usuarios$ = this.usuariosService.usuarios$;
    this.stats$ = this.usuariosService.stats$;
  }

  get canView(): boolean {
    return this.permissionsService.hasPermission(USUARIOS_PERMISSIONS.EMPRESA_VER);
  }

  ngOnInit() {
    this.uiService.setPageHeader('Gestión de Usuarios', 'Administra los accesos y roles del personal de tu empresa');
    this.usuariosService.loadInitialData();
    this.fetchRoles();

    this.usuarios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuarios => {
        this._allUsuarios = usuarios;
        this.applyFilters();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters() {
    this.filteredUsuarios = this._allUsuarios.filter(u => {
      const query = this.searchQuery.toLowerCase();
      const matchSearch = !query ||
        (u.nombre || '').toLowerCase().includes(query) ||
        (u.nombres || '').toLowerCase().includes(query) ||
        (u.apellidos || '').toLowerCase().includes(query) ||
        (u.email || u.correo || '').toLowerCase().includes(query);

      const matchRol = this.filters.rol === 'ALL' || 
                       u.empresa_rol_id === this.filters.rol || 
                       u.rol_codigo === this.filters.rol || 
                       u.role === this.filters.rol;

      const matchEstado = this.filters.estado === 'ALL' || 
                          (this.filters.estado === 'ACTIVE' && u.activo !== false) ||
                          (this.filters.estado === 'INACTIVE' && u.activo === false);

      return matchSearch && matchRol && matchEstado;
    });
    this.cd.detectChanges();
  }

  fetchRoles() {
    this.usuariosService.listarRoles().subscribe({
      next: (roles) => {
        // Filtrar según requerimiento del usuario (solo roles creados/empresa, no sistemas/vendedor/superadmin)
        this.availableRoles = roles.filter(r => 
          r.codigo !== 'SUPERADMIN' && 
          r.codigo !== 'VENDEDOR' && 
          r.codigo !== 'USUARIO' && 
          r.activo !== false
        );
        this.cd.detectChanges();
      }
    });
  }

  handleFilters(filters: any) {
    this.filters = filters;
    this.applyFilters();
  }

  refreshData() {
    this.isLoading = true;
    this.usuariosService.listarUsuarios()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges();
      }))
      .subscribe();
  }

  // MODAL HANDLERS
  openCreateModal() {
    this.selectedUsuario = null;
    this.showFormModal = true;
  }

  handleAction(event: { type: string, usuario: User }) {
    const currentUser = this.authService.getUser();
    const currentUserId = String(currentUser?.id || (currentUser as any)?.usuario_id || (currentUser as any)?.id_usuario || '');
    
    // El usuario objetivo puede tener su ID en .id o .user_id
    const targetProfileId = String(event.usuario.id || '');
    const targetAuthId = String(event.usuario.user_id || (event.usuario as any)?.usuario_id || '');
    
    const isSelf = currentUserId === targetProfileId || currentUserId === targetAuthId;

    if (event.type === 'edit') {
      this.selectedUsuario = event.usuario;
      this.showFormModal = true;
    } else if (event.type === 'delete') {
      if (isSelf) {
        this.uiService.showToast('No puedes eliminar tu propia cuenta', 'warning');
        return;
      }
      this.selectedUsuario = event.usuario;
      this.showConfirmModal = true;
    } else if (event.type === 'view') {
      this.isLoading = true;
      this.usuariosService.obtenerUsuario(event.usuario.id).subscribe({
        next: (fullUser) => {
          this.selectedUsuario = fullUser;
          this.showDetailModal = true;
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al cargar detalles del usuario');
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
    } else if (event.type === 'role') {
      if (isSelf) {
        this.uiService.showToast('No puedes cambiar tu propio rol', 'warning');
        return;
      }
      this.isLoading = true;
      this.usuariosService.obtenerUsuario(event.usuario.id).subscribe({
        next: (fullUser) => {
          this.selectedUsuario = fullUser;
          this.showRoleModal = true;
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al cargar detalles del usuario');
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
    }
  }

  saveUsuario(data: any) {
    this.isSaving = true;
    const isUpdating = !!this.selectedUsuario;
    const userId = this.selectedUsuario?.id;

    const observer = {
      next: (user: User) => {
        this.selectedUsuario = user;
        this.showFormModal = false;
        this.applyFilters();
        this.uiService.showToast(
          isUpdating ? 'Usuario actualizado correctamente' : 'Usuario creado exitosamente',
          'success'
        );
      },
      error: (err: any) => this.uiService.showError(err, 'Error al procesar solicitud'),
      complete: () => {
        this.isSaving = false;
        this.cd.detectChanges();
      }
    };

    if (isUpdating && userId) {
      this.usuariosService.updateUsuario(userId, data).subscribe(observer);
    } else {
      this.usuariosService.createUsuario(data).subscribe(observer);
    }
  }

  saveRole(empresaRolId: string) {
    if (!this.selectedUsuario) return;
    this.isSaving = true;

    this.usuariosService.updateUsuario(this.selectedUsuario.id, { empresa_rol_id: empresaRolId })
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: (updatedUser) => {
          this.selectedUsuario = updatedUser;
          this.showRoleModal = false;
          this.applyFilters();
          this.uiService.showToast('Rol actualizado correctamente', 'success');
        },
        error: (err) => this.uiService.showError(err, 'Error al actualizar rol')
      });
  }

  deleteUsuario() {
    if (!this.selectedUsuario) return;
    this.isDeleting = true;
    this.usuariosService.deleteUsuario(this.selectedUsuario.id)
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Usuario eliminado correctamente', 'success');
          this.showConfirmModal = false;
        },
        error: (err) => this.uiService.showError(err)
      });
  }
}

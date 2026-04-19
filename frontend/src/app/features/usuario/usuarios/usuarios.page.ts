import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable, BehaviorSubject, combineLatest, map, startWith } from 'rxjs';

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
import { PaginationState } from '../../super-admin/empresas/components/empresa-paginacion/empresa-paginacion.component';

@Component({
  selector: 'app-usuario-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
          [isLoading]="(isLoading$ | async) ?? false"
          [availableRoles]="availableRoles"
          (onFilterChangeEmit)="handleFilters($event)"
          (onCreate)="openCreateModal()"
          (onRefresh)="refreshData()"
        ></app-usuarios-actions>

        <!-- 3. TABLA -->
        <app-usuarios-table
          [usuarios]="(paginatedUsuarios$ | async) || []"
          [currentUserId]="currentUserId"
          [pagination]="(pagination$ | async)!"
          (onAction)="handleAction($event)"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></app-usuarios-table>

      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <section class="unauthorized-access-premium">
          <div class="unauthorized-container shadow-sm">
            <div class="icon-pulse-wrapper">
              <i class="bi bi-shield-lock-fill"></i>
            </div>
            <div class="text-content">
              <h2>Acceso Reservado</h2>
              <p>Tu rol actual no permite gestionar usuarios. Si necesitas realizar esta acción, por favor contacta al administrador del sistema.</p>
            </div>
            <div class="unauthorized-actions">
              <button class="btn-premium-outline" (click)="refreshData()">
                <i class="bi bi-arrow-clockwise me-2"></i>
                Actualizar Estado
              </button>
            </div>
          </div>
        </section>
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
    .usuarios-page-container { flex: 1; display: flex; flex-direction: column; background: transparent; padding: 0; overflow: hidden; min-height: 0; gap: 24px; }
    
    /* Unauthorized Premium Style */
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(185, 28, 28, 0.2); }
      70%  { box-shadow: 0 0 0 14px rgba(185, 28, 28, 0); }
      100% { box-shadow: 0 0 0 0 rgba(185, 28, 28, 0); }
    }
    .unauthorized-access-premium { flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem; background: transparent; }
    .unauthorized-container { background: #ffffff; border-radius: 28px; padding: 3.5rem 2.5rem; max-width: 500px; width: 100%; text-align: center; border: 1px solid var(--border-color); }
    .icon-pulse-wrapper { position: relative; width: 88px; height: 88px; background: var(--status-danger-bg); color: var(--status-danger-text); border-radius: 24px; display: flex; align-items: center; justify-content: center; font-size: 2.25rem; margin: 0 auto 2rem; animation: pulse-ring 2s ease-out infinite; }
    .text-content h2 { font-weight: 850; color: #0f172a; margin-bottom: 0.75rem; font-size: 1.5rem; letter-spacing: -0.02em; }
    .text-content p { color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem; }
    .btn-premium-outline { background: white; color: var(--text-main); border: 1px solid var(--border-color); padding: 0.75rem 1.5rem; border-radius: 14px; font-weight: 700; font-size: 0.9rem; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; }
    .btn-premium-outline:hover { background: var(--status-neutral-bg); border-color: var(--border-color); transform: translateY(-1px); }
  `]
})
export class UsuariosPage implements OnInit, OnDestroy {
  stats$: Observable<UsuariosStats>;
  filteredUsuarios$: Observable<User[]>;
  paginatedUsuarios$: Observable<User[]>;
  isLoading$ = new BehaviorSubject<boolean>(false);

  pagination$ = new BehaviorSubject<PaginationState>({ currentPage: 1, pageSize: 25, totalItems: 0 });

  searchQuery: string = '';
  private searchQuery$ = new BehaviorSubject<string>('');
  private filters$ = new BehaviorSubject<{ rol: string, estado: string }>({ rol: 'ALL', estado: 'ALL' });
  private refreshTrigger$ = new Subject<void>();

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

  isSaving = false;
  isDeleting = false;

  private destroy$ = new Subject<void>();
  availableRoles: any[] = [];

  private permissionsService = inject(PermissionsService);

  constructor(
    private usuariosService: UsuariosService,
    private uiService: UiService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {
    this.stats$ = this.usuariosService.stats$;

    this.filteredUsuarios$ = combineLatest([
      this.usuariosService.usuarios$,
      this.searchQuery$,
      this.filters$
    ]).pipe(
      map(([usuarios, query, filters]) => {
        return usuarios.filter(u => {
          const q = query.toLowerCase();
          const matchSearch = !q ||
            (u.nombre || '').toLowerCase().includes(q) ||
            (u.nombres || '').toLowerCase().includes(q) ||
            (u.apellidos || '').toLowerCase().includes(q) ||
            (u.email || u.correo || '').toLowerCase().includes(q);

          const matchRol = filters.rol === 'ALL' || 
                           u.empresa_rol_id === filters.rol || 
                           u.rol_codigo === filters.rol || 
                           u.role === filters.rol;

          const matchEstado = filters.estado === 'ALL' || 
                              (filters.estado === 'ACTIVE' && u.activo !== false) ||
                              (filters.estado === 'INACTIVE' && u.activo === false);

          return matchSearch && matchRol && matchEstado;
        });
      }),
      map(filtered => {
        // Actualizar total items y resetear a página 1 si cambia el total
        const current = this.pagination$.value;
        if (current.totalItems !== filtered.length) {
          this.pagination$.next({ ...current, totalItems: filtered.length, currentPage: 1 });
        }
        return filtered;
      })
    );

    this.paginatedUsuarios$ = combineLatest([
      this.filteredUsuarios$,
      this.pagination$
    ]).pipe(
      map(([filtered, pagination]) => {
        const start = (pagination.currentPage - 1) * pagination.pageSize;
        return filtered.slice(start, start + pagination.pageSize);
      })
    );
  }

  get canView(): boolean {
    return this.permissionsService.hasPermission(USUARIOS_PERMISSIONS.VER);
  }

  ngOnInit() {
    this.uiService.setPageHeader('Gestión de Usuarios', 'Administra los accesos y roles del personal de tu empresa');
    this.usuariosService.loadInitialData();
    this.fetchRoles();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange() {
    this.searchQuery$.next(this.searchQuery);
  }

  fetchRoles() {
    this.usuariosService.listarRoles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (roles) => {
        this.availableRoles = roles.filter(r => 
          r.codigo !== 'SUPERADMIN' && 
          r.codigo !== 'VENDEDOR' && 
          r.codigo !== 'USUARIO' && 
          r.activo !== false
        );
        this.cd.markForCheck();
      }
    });
  }

  handleFilters(filters: any) {
    this.filters$.next(filters);
    this.resetPagination();
  }

  onPageChange(page: number) {
    this.pagination$.next({ ...this.pagination$.value, currentPage: page });
    this.cd.markForCheck();
  }

  onPageSizeChange(size: number) {
    this.pagination$.next({ ...this.pagination$.value, pageSize: size, currentPage: 1 });
    this.cd.markForCheck();
  }

  private resetPagination() {
    this.pagination$.next({ ...this.pagination$.value, currentPage: 1 });
  }

  refreshData() {
    this.isLoading$.next(true);
    this.usuariosService.listarUsuarios()
      .pipe(finalize(() => {
        this.isLoading$.next(false);
        this.cd.markForCheck();
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
      this.isLoading$.next(true);
      this.usuariosService.obtenerUsuario(event.usuario.id).subscribe({
        next: (fullUser) => {
          this.selectedUsuario = fullUser;
          this.showDetailModal = true;
          this.isLoading$.next(false);
          this.cd.markForCheck();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al cargar detalles del usuario');
          this.isLoading$.next(false);
          this.cd.markForCheck();
        }
      });
    } else if (event.type === 'role') {
      if (isSelf) {
        this.uiService.showToast('No puedes cambiar tu propio rol', 'warning');
        return;
      }
      this.isLoading$.next(true);
      this.usuariosService.obtenerUsuario(event.usuario.id).subscribe({
        next: (fullUser) => {
          this.selectedUsuario = fullUser;
          this.showRoleModal = true;
          this.isLoading$.next(false);
          this.cd.markForCheck();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al cargar detalles del usuario');
          this.isLoading$.next(false);
          this.cd.markForCheck();
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
        this.uiService.showToast(
          isUpdating ? 'Usuario actualizado correctamente' : 'Usuario creado exitosamente',
          'success'
        );
        this.cd.markForCheck();
      },
      error: (err: any) => this.uiService.showError(err, 'Error al procesar solicitud'),
      complete: () => {
        this.isSaving = false;
        this.cd.markForCheck();
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
        this.cd.markForCheck();
      }))
      .subscribe({
        next: (updatedUser) => {
          this.selectedUsuario = updatedUser;
          this.showRoleModal = false;
          this.uiService.showToast('Rol actualizado correctamente', 'success');
          this.cd.markForCheck();
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
        this.cd.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Usuario eliminado correctamente', 'success');
          this.showConfirmModal = false;
          this.cd.markForCheck();
        },
        error: (err) => this.uiService.showError(err)
      });
  }
}

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';

import { UsuarioStatsComponent } from './components/usuario-stats/usuario-stats.component';
import { UsuarioActionsComponent } from './components/usuario-actions/usuario-actions.component';
import { UsuarioTableComponent } from './components/usuario-table/usuario-table.component';
import { UsuarioFormModalComponent } from './components/usuario-form-modal/usuario-form-modal.component';
import { UsuarioDetailModalComponent } from './components/usuario-detail-modal/usuario-detail-modal.component';
import { UsuarioRoleModalComponent } from './components/usuario-role-modal/usuario-role-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

import { UsuariosService, UsuariosStats } from './services/usuarios.service';
import { UiService } from '../../../shared/services/ui.service';
import { User } from '../../../domain/models/user.model';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-usuario-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UsuarioStatsComponent,
    UsuarioActionsComponent,
    UsuarioTableComponent,
    UsuarioFormModalComponent,
    UsuarioDetailModalComponent,
    UsuarioRoleModalComponent,
    ConfirmModalComponent,
    ToastComponent
  ],
  template: `
    <div class="usuarios-page-container">
      <!-- ESTADÍSTICAS -->
      <app-usuario-stats
        *ngIf="stats$ | async as st"
        [total]="st.total"
        [active]="st.activos"
        [inactive]="st.inactivos"
      ></app-usuario-stats>

      <!-- ACCIONES Y FILTROS -->
      <app-usuario-actions
        [(searchQuery)]="searchQuery"
        [isLoading]="isLoading"
        (onFilterChangeEmit)="handleFilters($event)"
        (onCreate)="openCreateModal()"
        (onRefresh)="refreshData()"
      ></app-usuario-actions>

      <!-- TABLA DE USUARIOS -->
      <div class="animate-fade-in" style="animation-delay: 0.1s">
        <app-usuario-table
          [usuarios]="filteredUsuarios"
          (onAction)="handleAction($event)"
        ></app-usuario-table>
      </div>

      <!-- MODALS -->
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
    .usuarios-page-container {
      min-height: 100vh;
      background: #f8fafc;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
  `]
})
export class UsuariosPage implements OnInit, OnDestroy {
  usuarios$: Observable<User[]>;
  stats$: Observable<UsuariosStats>;

  filteredUsuarios: User[] = [];
  searchQuery: string = '';
  filters = { rol: 'ALL' };

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

  constructor(
    private usuariosService: UsuariosService,
    private uiService: UiService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {
    this.usuarios$ = this.usuariosService.usuarios$;
    this.stats$ = this.usuariosService.stats$;
  }

  ngOnInit() {
    this.uiService.setPageHeader('Gestión de Usuarios', 'Administra los accesos y roles del personal de tu empresa');
    this.usuariosService.loadInitialData();

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

      const matchRol = this.filters.rol === 'ALL' || u.rol_codigo === this.filters.rol || u.role === this.filters.rol;

      return matchSearch && matchRol;
    });
    this.cd.detectChanges();
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

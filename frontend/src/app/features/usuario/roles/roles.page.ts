import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiService } from '../../../shared/services/ui.service';
import { RolesService, Rol, Permiso } from '../../../shared/services/roles.service';
import { finalize, forkJoin } from 'rxjs';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { ROLES_PERMISSIONS } from '../../../constants/permission-codes';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

import { RoleListComponent } from './components/role-list.component';
import { RoleDetailComponent } from './components/role-detail.component';
import { RoleFormModalComponent } from './components/role-form-modal.component';
import { RolePermissionsModalComponent } from './components/role-permissions-modal.component';
import { RoleDeleteModalComponent } from './components/role-delete-modal.component';

@Component({
  selector: 'app-roles-permisos',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    HasPermissionDirective,
    RoleListComponent,
    RoleDetailComponent,
    RoleFormModalComponent,
    RolePermissionsModalComponent,
    RoleDeleteModalComponent
  ],
  template: `
    <div class="roles-container p-4 h-100">
      <ng-container *ngIf="canView; else noPermission">
        <div class="row g-4 animate-fade-in h-100" *ngIf="!loading; else loadingState">
          <!-- LISTADO DE ROLES (IZQUIERDA) -->
          <div class="col-lg-3">
            <app-role-list
              [roles]="roles"
              [selectedRoleId]="selectedRole?.id"
              (onSelect)="selectRole($event)"
              (onCreate)="openCreateModal()"
              (onEdit)="editRole($event)"
            ></app-role-list>
          </div>

          <!-- DETALLE DE PERMISOS (DERECHA) -->
          <div class="col-lg-9 h-100">
            <app-role-detail
              [role]="selectedRole"
              [modulos]="getModulos()"
              [permisosDisponibles]="permisosDisponibles"
              (onDelete)="deleteRole($event)"
              (onCreate)="openCreateModal()"
              (onModuleClick)="openPermissionsModal($event)"
            ></app-role-detail>
          </div>
        </div>
      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container d-flex flex-column align-items-center justify-content-center h-100 text-center p-5">
          <div class="icon-lock-wrapper mb-4">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h2 class="fw-bold text-dark mb-2">Acceso Restringido</h2>
          <p class="text-muted mb-4 max-w-400">
            No tienes permisos suficientes para gestionar los roles y privilegios de esta empresa. 
            Si crees que esto es un error, contacta a tu administrador.
          </p>
          <button class="btn btn-dark rounded-pill px-5 py-3 fw-bold" (click)="cargarDatos()">
            <i class="bi bi-arrow-clockwise me-2"></i> Reintentar sincronización
          </button>
        </div>
      </ng-template>

      <ng-template #loadingState>
        <div class="h-100 d-flex flex-column align-items-center justify-content-center">
          <div class="spinner-border text-dark mb-3" role="status"></div>
          <span class="text-muted small fw-bold">Sincronizando seguridad...</span>
        </div>
      </ng-template>

      <!-- MODALES -->
      <app-role-form-modal
        *ngIf="showFormModal"
        [role]="editingRole ? selectedRole : null"
        [saving]="saving"
        (onSave)="saveRole($event)"
        (onClose)="showFormModal = false"
      ></app-role-form-modal>

      <app-role-permissions-modal
        *ngIf="showPermissionsModal"
        [modulo]="currentModule"
        [permisos]="getPermisosByModulo(currentModule || '')"
        [role]="selectedRole"
        [saving]="saving"
        [hasChanges]="hasPermissionChanges()"
        (onSave)="savePermissions()"
        (onClose)="cancelPermissionsModal()"
      ></app-role-permissions-modal>

      <app-role-delete-modal
        *ngIf="showDeleteModal"
        [role]="roleToDelete"
        [saving]="saving"
        (onConfirm)="confirmDelete()"
        (onCancel)="showDeleteModal = false"
      ></app-role-delete-modal>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .no-permission-container { min-height: 70vh; }
    .icon-lock-wrapper {
      width: 100px; height: 100px; background: #fee2e2; color: #ef4444; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 3rem;
      box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);
    }
    .max-w-400 { max-width: 400px; }
  `]
})
export class RolesPermisosPage implements OnInit {
  roles: Rol[] = [];
  permisosDisponibles: Permiso[] = [];

  selectedRole: Rol | null = null;
  loading = true;
  saving = false;
  showFormModal = false;
  showPermissionsModal = false;
  showDeleteModal = false;
  editingRole = false;
  currentModule: string | null = null;
  initialPermissionsState: { [key: string]: boolean } = {};
  roleToDelete: Rol | null = null;

  private permissionsService = inject(PermissionsService);

  constructor(
    private uiService: UiService,
    private rolesService: RolesService,
    private cdr: ChangeDetectorRef
  ) {}

  get canView(): boolean {
    return this.permissionsService.hasPermission(ROLES_PERMISSIONS.CONFIG);
  }

  ngOnInit() {
    this.uiService.setPageHeader('Roles y Permisos', 'Configura el esquema de seguridad de tu empresa');
    this.cargarDatos();
  }

  cargarDatos(targetId?: string) {
    console.log('[RolesModule] Iniciando sincronización de seguridad...');
    this.loading = true;

    forkJoin({
      permisos: this.rolesService.listarPermisosCatalogo(),
      roles: this.rolesService.listarRoles()
    }).pipe(
      finalize(() => {
        this.loading = false;
        console.log('[RolesModule] Proceso de carga finalizado. Loading:', this.loading);
        this.cdr.detectChanges(); // Forzar detección de cambios
      })
    ).subscribe({
      next: ({ permisos, roles }) => {
        console.log('[RolesModule] Datos recibidos en paralelo:', { 
          permisos: permisos.length, 
          roles: roles.length 
        });
        
        this.permisosDisponibles = permisos;
        this.roles = roles;

        if (this.roles.length > 0) {
          // Si hay un targetId, lo buscamos. Si no, mantenemos el seleccionado o el primero.
          const idToSelect = targetId || this.selectedRole?.id;
          const roleToSelect = this.roles.find(r => r.id === idToSelect) || this.roles[0];
          this.selectRole(roleToSelect);
          console.log('[RolesModule] Rol seleccionado tras carga:', roleToSelect.nombre);
        }
      },
      error: (err) => {
        console.error('[RolesModule] Error crítico en la carga inicial:', err);
        this.uiService.showToast('Error al conectar con el servidor de seguridad', 'danger');
      }
    });
  }

  getModulos() {
    return [...new Set(this.permisosDisponibles.map(p => p.modulo))];
  }

  getPermisosByModulo(modulo: string) {
    return this.permisosDisponibles.filter(p => p.modulo === modulo);
  }

  getSelectedCount(modulo: string) {
    return this.getPermisosByModulo(modulo).filter(p => p.selected).length;
  }

  selectRole(role: Rol) {
    this.selectedRole = role;
    // Marcar permisos seleccionados según el rol
    const coreCodes = role.permisos?.map(p => p.codigo) || [];
    this.permisosDisponibles.forEach(p => {
      p.selected = coreCodes.includes(p.codigo);
    });
  }

  openPermissionsModal(modulo: string) {
    this.currentModule = modulo;
    // Guardar estado inicial para detectar cambios
    this.initialPermissionsState = {};
    const modulePerms = this.getPermisosByModulo(modulo);
    modulePerms.forEach(p => {
      this.initialPermissionsState[p.id] = p.selected || false;
    });
    this.showPermissionsModal = true;
  }

  hasPermissionChanges(): boolean {
    if (!this.currentModule) return false;
    const modulePerms = this.getPermisosByModulo(this.currentModule);
    return modulePerms.some(p => (p.selected || false) !== this.initialPermissionsState[p.id]);
  }

  cancelPermissionsModal() {
    // Restaurar estado si se cancela
    if (this.currentModule && !this.selectedRole?.es_sistema) {
      const modulePerms = this.getPermisosByModulo(this.currentModule);
      modulePerms.forEach(p => {
        p.selected = this.initialPermissionsState[p.id];
      });
    }
    this.showPermissionsModal = false;
    this.currentModule = null;
  }

  getModuleIcon(modulo: string) {
    switch (modulo) {
      case 'CLIENTES': return 'bi-people-fill';
      case 'PRODUCTOS': return 'bi-box-seam-fill';
      case 'FACTURAS': return 'bi-receipt-cutoff';
      case 'REPORTES': return 'bi-bar-chart-fill';
      case 'CONFIGURACION': return 'bi-gear-wide-connected';
      default: return 'bi-shield-check';
    }
  }

  openCreateModal() {
    this.editingRole = false;
    this.showFormModal = true;
  }

  editRole(role: Rol, event?: Event | Rol) {
    if (event instanceof Event) event.stopPropagation();
    this.selectedRole = role;
    this.editingRole = true;
    this.showFormModal = true;
  }
  saveRole(formData: any) {
    if (!formData.nombre) {
      this.uiService.showToast('Ingresa un nombre identificador', 'danger');
      return;
    }

    if (this.editingRole && this.selectedRole?.es_sistema) {
      this.uiService.showToast('No se pueden modificar roles del sistema', 'warning');
      return;
    }

    this.saving = true;
    console.log('[RolesModule] Guardando cambios en rol...', formData);
    if (this.editingRole && this.selectedRole) {
      this.rolesService.actualizarRol(this.selectedRole.id, formData).pipe(
        finalize(() => {
          this.saving = false;
          console.log('[RolesModule] Actualización de rol finalizada');
        })
      ).subscribe({
        next: (updated) => {
          console.log('[RolesModule] Rol actualizado exitosamente:', updated.id);
          this.uiService.showToast('Rol actualizado correctamente', 'success');
          this.showFormModal = false;
          this.cargarDatos(updated.id);
        },
        error: (err) => {
          console.error('[RolesModule] Error actualizando rol:', err);
          this.uiService.showToast('Error al actualizar rol', 'danger');
        }
      });
    } else {
      this.rolesService.crearRol(formData).pipe(
        finalize(() => {
          this.saving = false;
          console.log('[RolesModule] Creación de rol finalizada');
        })
      ).subscribe({
        next: (newRole) => {
          console.log('[RolesModule] Rol creado exitosamente:', newRole.id);
          this.roles.push(newRole);
          this.selectRole(newRole);
          this.uiService.showToast('Nuevo rol creado', 'success');
          this.showFormModal = false;
        },
        error: (err) => {
          console.error('[RolesModule] Error creando rol:', err);
          this.uiService.showToast('Error al crear rol', 'danger');
        }
      });
    }
  }

  deleteRole(role: Rol, event?: Event | Rol) {
    if (event instanceof Event) event.stopPropagation();
    if (role.es_sistema) {
        this.uiService.showToast('No se puede eliminar un rol del sistema', 'warning');
        return;
    }
    this.roleToDelete = role;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.roleToDelete) return;
    
    this.saving = true;
    this.rolesService.eliminarRol(this.roleToDelete.id).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.roles = this.roles.filter(r => r.id !== this.roleToDelete?.id);
        if (this.selectedRole?.id === this.roleToDelete?.id) {
            this.selectedRole = this.roles.length > 0 ? this.roles[0] : null;
            if (this.selectedRole) this.selectRole(this.selectedRole);
        }
        this.uiService.showToast('Rol eliminado del sistema', 'success');
        this.showDeleteModal = false;
        this.roleToDelete = null;
      },
      error: () => {
        this.uiService.showToast('Error al eliminar rol', 'danger');
        this.showDeleteModal = false;
      }
    });
  }

  savePermissions() {
    if (!this.selectedRole) return;
    
    if (this.selectedRole.es_sistema) {
      this.showPermissionsModal = false;
      this.currentModule = null;
      return;
    }
    
    this.saving = true;
    const selectedIds = this.permisosDisponibles
      .filter(p => p.selected)
      .map(p => p.id);

    console.log('[RolesModule] Sincronizando permisos...', { rolId: this.selectedRole.id, totalPermisos: selectedIds.length });

    this.rolesService.actualizarRol(this.selectedRole.id, { permiso_ids: selectedIds }).pipe(
      finalize(() => {
        this.saving = false;
        console.log('[RolesModule] Sincronización de permisos finalizada');
      })
    ).subscribe({
      next: (updated) => {
        console.log('[RolesModule] Permisos sincronizados correctamente');
        this.uiService.showToast('Configuración sincronizada', 'success');
        this.showPermissionsModal = false;
        this.currentModule = null;
        this.cargarDatos(this.selectedRole?.id);
      },
      error: (err) => {
        console.error('[RolesModule] Error sincronizando permisos:', err);
        this.uiService.showToast('Error al sincronizar permisos', 'danger');
      }
    });
  }
}


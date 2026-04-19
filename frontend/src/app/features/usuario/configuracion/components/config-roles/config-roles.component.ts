import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { UiService } from '../../../../../shared/services/ui.service';
import { RolesService, Rol, Permiso } from '../../../../../shared/services/roles.service';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

import { RoleListComponent } from '../../../roles/components/role-list.component';
import { RoleDetailComponent } from '../../../roles/components/role-detail.component';
import { RoleFormModalComponent } from '../../../roles/components/role-form-modal.component';
import { RolePermissionsModalComponent } from '../../../roles/components/role-permissions-modal.component';
import { RoleDeleteModalComponent } from '../../../roles/components/role-delete-modal.component';

@Component({
  selector: 'app-config-roles',
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
    <div class="config-roles-wrapper animate__animated animate__fadeIn">
      
      <div class="row g-0 h-100" *ngIf="!loading; else loadingState">
        <!-- LISTADO DE ROLES (IZQUIERDA) -->
        <div class="col-lg-3 border-end border-light">
          <div class="pe-3">
            <app-role-list
              [roles]="roles"
              [selectedRoleId]="selectedRole?.id"
              (onSelect)="selectRole($event)"
              (onCreate)="openCreateModal()"
              (onEdit)="editRole($event)"
            ></app-role-list>
          </div>
        </div>

        <!-- DETALLE DE PERMISOS (DERECHA) -->
        <div class="col-lg-9 h-100">
          <div class="ps-4">
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
      </div>

      <ng-template #loadingState>
        <div class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-premium mb-3"></div>
          <p class="text-muted fw-bold">Sincronizando seguridad...</p>
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
    .config-roles-wrapper { width: 100%; height: 100%; padding: 4px; }
    
    .spinner-premium {
      width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: var(--primary-color);
      border-radius: 50%; animation: spin 1s linear infinite;
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class ConfigRolesComponent implements OnInit {
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

  private uiService = inject(UiService);
  private rolesService = inject(RolesService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos(targetId?: string) {
    this.loading = true;
    forkJoin({
      permisos: this.rolesService.listarPermisosCatalogo(),
      roles: this.rolesService.listarRoles()
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ permisos, roles }) => {
        this.permisosDisponibles = permisos;
        this.roles = roles;

        if (this.roles.length > 0) {
          const idToSelect = targetId || this.selectedRole?.id;
          const roleToSelect = this.roles.find(r => r.id === idToSelect) || this.roles[0];
          this.selectRole(roleToSelect);
        }
      },
      error: (err) => {
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

  selectRole(role: Rol) {
    this.selectedRole = role;
    const coreCodes = role.permisos?.map(p => p.codigo) || [];
    this.permisosDisponibles.forEach(p => {
      p.selected = coreCodes.includes(p.codigo);
    });
  }

  openPermissionsModal(modulo: string) {
    this.currentModule = modulo;
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
    if (this.currentModule && !this.selectedRole?.es_sistema) {
      const modulePerms = this.getPermisosByModulo(this.currentModule);
      modulePerms.forEach(p => {
        p.selected = this.initialPermissionsState[p.id];
      });
    }
    this.showPermissionsModal = false;
    this.currentModule = null;
  }

  openCreateModal() {
    this.editingRole = false;
    this.showFormModal = true;
  }

  editRole(role: Rol) {
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
    if (this.editingRole && this.selectedRole) {
      this.rolesService.actualizarRol(this.selectedRole.id, formData).pipe(
        finalize(() => this.saving = false)
      ).subscribe({
        next: (updated) => {
          this.uiService.showToast('Rol actualizado correctamente', 'success');
          this.showFormModal = false;
          this.cargarDatos(updated.id);
        },
        error: (err) => this.uiService.showToast('Error al actualizar rol', 'danger')
      });
    } else {
      this.rolesService.crearRol(formData).pipe(
        finalize(() => this.saving = false)
      ).subscribe({
        next: (newRole) => {
          this.roles.push(newRole);
          this.selectRole(newRole);
          this.uiService.showToast('Nuevo rol creado', 'success');
          this.showFormModal = false;
        },
        error: (err) => this.uiService.showToast('Error al crear rol', 'danger')
      });
    }
  }

  deleteRole(role: Rol) {
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
      error: () => this.uiService.showToast('Error al eliminar rol', 'danger')
    });
  }

  savePermissions() {
    if (!this.selectedRole || this.selectedRole.es_sistema) {
      this.showPermissionsModal = false;
      this.currentModule = null;
      return;
    }
    
    this.saving = true;
    const selectedIds = this.permisosDisponibles.filter(p => p.selected).map(p => p.id);

    this.rolesService.actualizarRol(this.selectedRole.id, { permiso_ids: selectedIds }).pipe(
      finalize(() => this.saving = false)
    ).subscribe({
      next: () => {
        this.uiService.showToast('Configuración sincronizada', 'success');
        this.showPermissionsModal = false;
        this.currentModule = null;
        this.cargarDatos(this.selectedRole?.id);
      },
      error: (err) => this.uiService.showToast('Error al sincronizar permisos', 'danger')
    });
  }
}


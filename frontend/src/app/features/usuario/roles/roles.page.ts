import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiService } from '../../../shared/services/ui.service';
import { RolesService, Rol, Permiso } from '../../../shared/services/roles.service';
import { finalize, forkJoin } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-roles-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="roles-container p-4 h-100">
      
      <div class="row g-4 animate-fade-in h-100" *ngIf="!loading; else loadingState">
        <!-- LISTADO DE ROLES (IZQUIERDA) -->
        <div class="col-lg-3">
          <div class="card card-minimal shadow-soft">
            <div class="card-header-minimal d-flex justify-content-between align-items-center">
              <span class="text-secondary fw-bold small tracking-widest">ROLES</span>
              <button (click)="openCreateModal()" class="btn-create-minimal" title="Nuevo Rol">
                <i class="bi bi-plus-lg"></i>
              </button>
            </div>
            <div class="card-body p-2 scroll-thin">
              <div class="roles-stack">
                <div *ngFor="let role of roles" 
                     (click)="selectRole(role)"
                     [class.selected]="selectedRole?.id === role.id"
                     class="role-item-minimal mb-1">
                  <div class="role-item-content">
                    <span class="role-item-name">{{ role.nombre }}</span>
                    <span class="role-item-count">{{ role.num_usuarios || 0 }} activos</span>
                  </div>
                  <button class="btn-edit-minimal" (click)="editRole(role, $event)">
                    <i class="bi bi-pencil"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DETALLE DE PERMISOS (DERECHA) -->
        <div class="col-lg-9 h-100">
          <div class="card card-minimal shadow-soft h-100" *ngIf="selectedRole; else noRoleSelected">
            <div class="card-header-minimal d-flex justify-content-between align-items-center border-bottom">
              <div class="d-flex align-items-center gap-3">
                <div class="role-avatar-minimal">{{ selectedRole.nombre.substring(0,2) }}</div>
                <div>
                  <h3 class="m-0 fw-bold fs-5 text-dark">{{ selectedRole.nombre }}</h3>
                  <span class="text-muted small fw-500">{{ selectedRole.descripcion || 'Sin descripción' }}</span>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button *ngIf="!selectedRole.es_sistema" class="btn btn-minimal-danger" (click)="deleteRole(selectedRole, $event)">
                  <i class="bi bi-trash"></i>
                </button>
                <button class="btn btn-minimal-primary" (click)="openCreateModal()">
                  <i class="bi bi-plus-circle-fill me-2"></i> Nuevo Rol
                </button>
              </div>
            </div>
            
            <div class="card-body p-4 scroll-thin overflow-auto">
              <div class="section-label-minimal mb-4">Capacidades del Módulo</div>
              <div class="row g-3">
                <!-- Módulos como cards minimalistas -->
                <div class="col-md-4" *ngFor="let modulo of getModulos()">
                  <div class="minimal-module-card" (click)="openPermissionsModal(modulo)">
                    <div class="module-icon-box" [ngClass]="modulo.toLowerCase()">
                      <i class="bi" [ngClass]="getModuleIcon(modulo)"></i>
                    </div>
                    <div class="module-info-minimal">
                      <span class="module-name-minimal">{{ modulo }}</span>
                      <span class="module-status-minimal">{{ getSelectedCount(modulo) }} / {{ getPermisosByModulo(modulo).length }} activos</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="audit-summary-minimal mt-5 pt-4 border-top">
                <div class="d-flex gap-3 align-items-center">
                  <div class="icon-circle-sm bg-light text-primary">
                    <i class="bi bi-shield-check"></i>
                  </div>
                  <div>
                    <span class="d-block fw-bold text-dark small">Persistencia Automática</span>
                    <span class="text-muted extra-small">Los cambios se aplican globalmente al cerrar el panel de configuración de cada módulo.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ng-template #noRoleSelected>
            <div class="h-100 d-flex flex-column align-items-center justify-content-center text-center p-5 opacity-75">
              <div class="empty-plate-minimal mb-4">
                 <i class="bi bi-fingerprint"></i>
              </div>
              <h4 class="fw-bold text-dark">Propiedades de Acceso</h4>
              <p class="text-muted small max-w-300">Selecciona un rol de la lista lateral para visualizar y editar sus privilegios en el sistema.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <ng-template #loadingState>
        <div class="h-100 d-flex flex-column align-items-center justify-content-center">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <span class="text-muted small fw-bold">Sincronizando seguridad...</span>
        </div>
      </ng-template>

      <!-- MODAL CONFIGURAR ROL -->
      <div class="modal-overlay" *ngIf="showFormModal" (click)="showFormModal = false">
        <div class="modal-content-minimal" (click)="$event.stopPropagation()">
          <div class="modal-header-minimal">
            <h5 class="m-0 fw-bold">{{ editingRole ? 'Detalles del Rol' : 'Nuevo Rol' }}</h5>
            <button class="btn-close-minimal" (click)="showFormModal = false"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body-minimal p-4">
             <div class="minimal-form-item mb-4">
                <label>Etiqueta del Rol</label>
                <input type="text" placeholder="Ej: Cajero" [(ngModel)]="roleForm.nombre">
             </div>
             <div class="minimal-form-item mb-4">
                <label>Descripción Operativa</label>
                <textarea rows="3" placeholder="Describe brevemente las responsabilidades..." [(ngModel)]="roleForm.descripcion"></textarea>
             </div>

             <div class="minimal-toggle-stack">
                <div class="toggle-item-minimal">
                  <span>Estado de Disponibilidad</span>
                  <div class="form-check form-switch custom-switch-lux">
                    <input class="form-check-input" type="checkbox" [(ngModel)]="roleForm.activo">
                  </div>
                </div>
             </div>
          </div>
          <div class="modal-footer-minimal p-4 pt-2">
            <button class="btn btn-minimal-link me-3" (click)="showFormModal = false">Cancelar</button>
            <button class="btn btn-minimal-dark px-4" (click)="saveRole()" [disabled]="saving">
              <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingRole ? 'ACTUALIZAR' : 'CREAR ROL' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL PERMISOS -->
      <div class="modal-overlay" *ngIf="showPermissionsModal" (click)="closePermissionsModal()">
        <div class="modal-content-minimal wide" (click)="$event.stopPropagation()">
          <div class="modal-header-minimal border-bottom align-items-center">
            <div class="d-flex align-items-center gap-3">
              <div class="module-marker" [ngClass]="currentModule?.toLowerCase()"></div>
              <h5 class="m-0 fw-bold">{{ currentModule }}</h5>
            </div>
            <button class="btn-close-minimal" (click)="closePermissionsModal()"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body-minimal p-0 overflow-auto" style="max-height: 50vh;">
            <div class="minimal-permission-list">
              <div class="perm-row-minimal" *ngFor="let perm of getPermisosByModulo(currentModule || '')">
                <div class="perm-info-minimal">
                  <div class="perm-name-minimal">{{ perm.nombre }}</div>
                  <div class="perm-desc-minimal">{{ perm.descripcion }}</div>
                </div>
                <div class="form-check form-switch custom-switch-lux">
                  <input class="form-check-input" type="checkbox" 
                         [(ngModel)]="perm.selected" 
                         [disabled]="selectedRole?.es_sistema || saving">
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer-minimal p-4 border-top bg-light-soft justify-content-center">
             <button class="btn btn-minimal-dark px-5" (click)="closePermissionsModal()" [disabled]="saving">
               <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
               {{ selectedRole?.es_sistema ? 'CERRAR' : (saving ? 'GUARDANDO...' : 'LISTO') }}
             </button>
          </div>
        </div>
      </div>

      <!-- MODAL ELIMINAR ROL (PREMIUM CONFIRMATION) -->
      <div class="modal-overlay" *ngIf="showDeleteModal" (click)="showDeleteModal = false">
        <div class="modal-content-minimal border-danger-soft" (click)="$event.stopPropagation()">
          <div class="modal-body-minimal p-5 text-center">
            <div class="delete-icon-animated mb-4">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h4 class="fw-bold text-dark mb-2">¿Eliminar este rol?</h4>
            <p class="text-muted small mb-0">
              Estás a punto de eliminar el rol <strong>"{{ roleToDelete?.nombre }}"</strong>.
            </p>
            <p class="text-danger extra-small fw-bold mt-2 tracking-tight">
              ESTA ACCIÓN ES IRREVERSIBLE Y AFECTARÁ A LOS USUARIOS ASIGNADOS.
            </p>

            <div class="d-flex flex-column gap-2 mt-4">
              <button class="btn btn-delete-confirm py-3" (click)="confirmDelete()" [disabled]="saving">
                <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
                ELIMINAR DEFINITIVAMENTE
              </button>
              <button class="btn btn-minimal-link py-2" (click)="showDeleteModal = false" [disabled]="saving">
                Mantenlo por ahora
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .roles-container { padding: 0.2rem; height: calc(100vh - 120px); }
    .scroll-thin::-webkit-scrollbar { width: 5px; }
    .scroll-thin::-webkit-scrollbar-track { background: transparent; }
    .scroll-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    
    .shadow-soft { box-shadow: 0 4px 30px rgba(0,0,0,0.02); }
    .tracking-widest { letter-spacing: 0.1em; }

    /* CARD MINIMAL */
    .card-minimal {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
    }
    .card-header-minimal { padding: 1.25rem 1.5rem; }

    /* ROLES LIST */
    .role-item-minimal {
      padding: 0.75rem 1.25rem;
      border-radius: 14px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    }
    .role-item-minimal:hover { background: #f8fafc; }
    .role-item-minimal.selected { background: #f1f5f9; }
    .role-item-name { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
    .role-item-count { font-size: 0.7rem; color: #94a3b8; font-weight: 600; display: block; }
    
    .btn-create-minimal {
      width: 32px; height: 32px; border-radius: 10px; border: none;
      background: #f1f5f9; color: #1e293b; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-create-minimal:hover { background: #1e293b; color: #fff; }

    .btn-edit-minimal { border: none; background: transparent; color: #cbd5e1; font-size: 0.8rem; }
    .selected .btn-edit-minimal { color: #1e293b; }

    /* DETAIL VIEW */
    .role-avatar-minimal {
      width: 44px; height: 44px; border-radius: 14px;
      background: #f1f5f9; color: #64748b; font-weight: 800;
      display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
    }
    .section-label-minimal { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }

    /* MODULES */
    .minimal-module-card {
      padding: 1.25rem;
      border: 1px solid #f1f5f9;
      border-radius: 16px;
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .minimal-module-card:hover { border-color: #cbd5e1; background: #fafbfc; }
    .module-icon-box {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
      margin-right: 1rem;
    }
    .module-icon-box.clientes { color: #3b82f6; background: #eff6ff; }
    .module-icon-box.productos { color: #ec4899; background: #fdf2f8; }
    .module-icon-box.facturas { color: #10b981; background: #ecfdf5; }
    .module-icon-box.reportes { color: #f59e0b; background: #fff7ed; }
    .module-icon-box.configuracion { color: #64748b; background: #f1f5f9; }

    .module-name-minimal { font-weight: 800; color: #334155; display: block; font-size: 0.9rem; }
    .module-status-minimal { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }

    /* ADAPTED BUTTONS */
    .btn-minimal-primary {
      background: #1e293b; color: white; border: none; padding: 0.6rem 1.25rem;
      border-radius: 12px; font-weight: 700; font-size: 0.8rem; transition: all 0.2s;
    }
    .btn-minimal-primary:hover { background: #0f172a; }
    .btn-minimal-danger { background: #fff1f2; color: #e11d48; border: none; padding: 0.6rem 0.8rem; border-radius: 12px; }
    .btn-minimal-danger:hover { background: #e11d48; color: white; }
    .btn-minimal-dark { background: #1e293b; color: white; border: none; border-radius: 12px; padding: 0.8rem 1.5rem; font-weight: 700; }
    .btn-minimal-link { background: transparent; border: none; color: #64748b; font-weight: 700; font-size: 0.8rem; }

    /* MODALS MINIMAL */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 99999;
    }
    .modal-content-minimal {
      background: white; border-radius: 24px; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.25);
      width: 400px;
    }
    .modal-content-minimal.wide { width: 620px; }
    .modal-header-minimal { padding: 1.5rem 2rem; display: flex; justify-content: space-between; }
    .btn-close-minimal { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 8px; color: #94a3b8; }

    .minimal-form-item label { display: block; font-size: 0.7rem; font-weight: 800; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .minimal-form-item input, .minimal-form-item textarea {
      width: 100%; border: 1px solid #e2e8f0; background: #fff; border-radius: 12px; padding: 10px 14px;
      font-weight: 600; font-size: 0.9rem; transition: all 0.2s;
    }
    .minimal-form-item input:focus, .minimal-form-item textarea:focus { border-color: #1e293b; outline: none; }

    .minimal-toggle-stack { display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1.25rem; }
    .toggle-item-minimal { display: flex; justify-content: space-between; align-items: center; color: #475569; font-weight: 700; font-size: 0.85rem; }

    .perm-row-minimal {
      padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc;
    }
    .perm-name-minimal { font-weight: 700; color: #1e293b; font-size: 0.85rem; }
    .perm-desc-minimal { font-size: 0.75rem; color: #94a3b8; font-weight: 500; margin-top: 2px; }
    .module-marker { width: 4px; height: 16px; border-radius: 10px; }
    .module-marker.clientes { background: #3b82f6; }
    .module-marker.productos { background: #ec4899; }
    .module-marker.facturas { background: #10b981; }
    .module-marker.reportes { background: #f59e0b; }
    .module-marker.configuracion { background: #64748b; }

    /* SWITCH CUSTOM LUX */
    .custom-switch-lux .form-check-input { width: 2.8rem; height: 1.4rem; cursor: pointer; }
    .form-check-input:checked { background-color: #1e293b; border-color: #1e293b; }

    .empty-plate-minimal {
      width: 70px; height: 70px; border-radius: 20px; background: #f8fafc;
      display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #cbd5e1;
    }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* DELETE MODAL SPECIFICS */
    .border-danger-soft { border: 1px solid #fee2e2; }
    .delete-icon-animated {
      width: 80px; height: 80px; background: #fff1f2; color: #e11d48;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; margin: 0 auto;
      animation: pulse-danger 2s infinite;
    }
    @keyframes pulse-danger {
      0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); }
      70% { box-shadow: 0 0 0 15px rgba(225, 29, 72, 0); }
      100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
    }
    .btn-delete-confirm {
      background: #e11d48; color: white; border: none; border-radius: 14px;
      font-weight: 800; font-size: 0.8rem; letter-spacing: 0.5px;
      transition: all 0.2s;
    }
    .btn-delete-confirm:hover { background: #be123c; transform: translateY(-1px); }
    .tracking-tight { letter-spacing: -0.01em; }
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
  roleToDelete: Rol | null = null;
  roleForm = { nombre: '', descripcion: '', activo: true };

  constructor(
    private uiService: UiService,
    private rolesService: RolesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.uiService.setPageHeader('Roles y Permisos', 'Configura el esquema de seguridad de tu empresa');
    this.cargarDatos();
  }

  cargarDatos() {
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

        if (this.roles.length > 0 && !this.selectedRole) {
          const firstRole = this.roles[0];
          this.selectRole(firstRole);
          console.log('[RolesModule] Rol inicial seleccionado:', firstRole.nombre);
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
    this.showPermissionsModal = true;
  }

  closePermissionsModal() {
    if (this.selectedRole && !this.selectedRole.es_sistema) {
      this.savePermissions();
    }
    this.showPermissionsModal = false;
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
    this.roleForm = { nombre: '', descripcion: '', activo: true };
    this.showFormModal = true;
  }

  editRole(role: Rol, event: Event) {
    event.stopPropagation();
    this.editingRole = true;
    this.roleForm = { 
      nombre: role.nombre, 
      descripcion: role.descripcion || '',
      activo: role.activo !== undefined ? role.activo : true
    };
    this.showFormModal = true;
  }

  saveRole() {
    if (!this.roleForm.nombre) {
      this.uiService.showToast('Ingresa un nombre identificador', 'danger');
      return;
    }

    if (this.editingRole && this.selectedRole?.es_sistema) {
      this.uiService.showToast('No se pueden modificar roles del sistema', 'warning');
      return;
    }

    this.saving = true;
    console.log('[RolesModule] Guardando cambios en rol...', this.roleForm);
    if (this.editingRole && this.selectedRole) {
      this.rolesService.actualizarRol(this.selectedRole.id, this.roleForm).pipe(
        finalize(() => {
          this.saving = false;
          console.log('[RolesModule] Actualización de rol finalizada');
        })
      ).subscribe({
        next: (updated) => {
          console.log('[RolesModule] Rol actualizado exitosamente:', updated.id);
          const index = this.roles.findIndex(r => r.id === updated.id);
          this.roles[index] = updated;
          this.selectedRole = updated;
          this.uiService.showToast('Rol actualizado correctamente', 'success');
          this.showFormModal = false;
        },
        error: (err) => {
          console.error('[RolesModule] Error actualizando rol:', err);
          this.uiService.showToast('Error al actualizar rol', 'danger');
        }
      });
    } else {
      this.rolesService.crearRol(this.roleForm).pipe(
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

  deleteRole(role: Rol, event: Event) {
    event.stopPropagation();
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
    if (!this.selectedRole || this.selectedRole.es_sistema) return;
    
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
        const index = this.roles.findIndex(r => r.id === updated.id);
        this.roles[index] = updated;
        this.selectedRole = updated;
        this.uiService.showToast('Configuración sincronizada', 'success');
      },
      error: (err) => {
        console.error('[RolesModule] Error sincronizando permisos:', err);
        this.uiService.showToast('Error al sincronizar permisos', 'danger');
      }
    });
  }
}

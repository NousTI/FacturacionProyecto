import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerfilService } from './services/perfil.service';
import { Observable, take } from 'rxjs';
import { UiService } from '../../../shared/services/ui.service';
import { SuperadminPerfil, SuperadminPerfilUpdate } from '../../../domain/models/superadmin-perfil.model';

@Component({
  selector: 'app-perfil-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="perfil-container animate__animated animate__fadeIn">
      
      <!-- ALERT: CHANGE PASSWORD REQUIRED -->
      <div *ngIf="(perfil$ | async)?.requiere_cambio_password" class="alert-cambio-password mb-4 shadow-sm animate-fade-in">
        <div class="d-flex align-items-center gap-3">
          <div class="alert-icon">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <div class="flex-grow-1">
            <h6 class="mb-1 fw-bold text-dark">Cambio de contraseña requerido</h6>
            <p class="mb-0 text-muted small">Por motivos de seguridad, el administrador ha solicitado que actualices tu contraseña de acceso.</p>
          </div>
        </div>
      </div>
      <div class="row g-5">
        <!-- Columna Izquierda: Identidad y Estado -->
        <div class="col-lg-4">
          <div class="editorial-card px-4 py-5 text-center mb-4" style="max-width: none;">
            <div class="profile-avatar-large mx-auto mb-3">
              {{ (perfil$ | async)?.nombres?.charAt(0) }}{{ (perfil$ | async)?.apellidos?.charAt(0) }}
            </div>
            <h2 class="h5 fw-bold mb-1">{{ (perfil$ | async)?.nombres }} {{ (perfil$ | async)?.apellidos }}</h2>
            <div class="badge-role mb-4 d-inline-block">{{ (perfil$ | async)?.role }}</div>
            
            <div class="status-summary border-top pt-4 text-start">
              <div class="info-row d-flex justify-content-between align-items-center mb-3">
                <label class="mb-0">Estado de Acceso</label>
                <div class="d-flex align-items-center fw-bold text-dark small">
                  <span class="status-indicator me-2" [class.active]="(perfil$ | async)?.estado === 'ACTIVA'"></span>
                  {{ (perfil$ | async)?.estado }}
                </div>
              </div>
              <div class="info-row d-flex justify-content-between align-items-center">
                <label class="mb-0">Perfil de Sistema</label>
                <div class="fw-bold text-dark small">
                  {{ (perfil$ | async)?.activo ? 'HABILITADO' : 'DESHABILITADO' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actividad -->
          <div class="editorial-card p-4" style="max-width: none;">
            <div class="card-header-minimal mb-3 border-0 bg-transparent p-0">
              <i class="bi bi-clock-history me-2"></i> Actividad Reciente
            </div>
            <div class="info-row mb-3">
              <label class="editorial-label">Último Inicio de Sesión</label>
              <div class="value-small">{{ (perfil$ | async)?.ultimo_acceso | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
            <div class="info-row mb-0">
              <label class="editorial-label">Miembro desde</label>
              <div class="value-small">{{ (perfil$ | async)?.created_at | date:'MMMM yyyy' }}</div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Detalles y Seguridad -->
        <div class="col-lg-8">
          <div class="editorial-card mb-5 p-0" style="max-width: none; overflow: hidden;">
            <div class="card-header-minimal px-4 d-flex justify-content-between align-items-center">
              <div><i class="bi bi-person-lines-fill me-2"></i> Datos Personales</div>
              <button *ngIf="!isEditing" class="btn btn-sm btn-outline-primary rounded-circle" 
                      (click)="startEdit()" 
                      title="Editar Perfil"
                      style="width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center;">
                <i class="bi bi-pencil-fill"></i>
              </button>
            </div>
            
            <div class="card-body-minimal p-4">
              <!-- Vista de solo lectura -->
              <ng-container *ngIf="!isEditing">
                <div class="row g-4">
                  <div class="col-md-6">
                    <div class="info-row">
                      <label class="editorial-label">Nombres Completos</label>
                      <div class="value">{{ (perfil$ | async)?.nombres }}</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-row">
                      <label class="editorial-label">Apellidos Completos</label>
                      <div class="value">{{ (perfil$ | async)?.apellidos }}</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-row">
                      <label class="editorial-label">Correo Electrónico de Acceso</label>
                      <div class="value">{{ (perfil$ | async)?.email }}</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-row">
                      <label class="editorial-label">Teléfono de Contacto</label>
                      <div class="value">{{ (perfil$ | async)?.telefono || 'No registrado' }}</div>
                    </div>
                  </div>
                </div>
              </ng-container>

              <!-- Vista de Edición -->
              <ng-container *ngIf="isEditing">
                <form (ngSubmit)="saveEdit()" #editForm="ngForm">
                  <div class="row g-4">
                     <div class="col-md-6">
                       <div class="info-row">
                         <label class="editorial-label">Nombres Completos</label>
                         <input type="text" class="editorial-input" 
                                [(ngModel)]="editData.nombres" name="nombres" 
                                #nombresInput="ngModel" required
                                [class.is-invalid-editorial]="nombresInput.invalid && (nombresInput.dirty || nombresInput.touched)">
                         <small class="error-text-editorial" *ngIf="nombresInput.invalid && (nombresInput.dirty || nombresInput.touched)">
                           El nombre es obligatorio
                         </small>
                       </div>
                     </div>
                     <div class="col-md-6">
                       <div class="info-row">
                         <label class="editorial-label">Apellidos Completos</label>
                         <input type="text" class="editorial-input" 
                                [(ngModel)]="editData.apellidos" name="apellidos" 
                                #apellidosInput="ngModel" required
                                [class.is-invalid-editorial]="apellidosInput.invalid && (apellidosInput.dirty || apellidosInput.touched)">
                         <small class="error-text-editorial" *ngIf="apellidosInput.invalid && (apellidosInput.dirty || apellidosInput.touched)">
                           El apellido es obligatorio
                         </small>
                       </div>
                     </div>
                     <div class="col-md-6">
                       <div class="info-row">
                         <label class="editorial-label">Teléfono de Contacto</label>
                          <input type="text" 
                                 class="editorial-input" 
                                 [(ngModel)]="editData.telefono" 
                                 name="telefono"
                                 #telefonoInput="ngModel"
                                 pattern="^09[0-9]{8}$"
                                 maxlength="10"
                                 (keypress)="onlyNumbers($event)"
                                 [class.is-invalid-editorial]="telefonoInput.invalid && (telefonoInput.dirty || telefonoInput.touched)">
                         <div *ngIf="telefonoInput.invalid && (telefonoInput.dirty || telefonoInput.touched)" class="error-text-editorial animate-fade-in">
                           Número inválido (Formato: 09XXXXXXXX)
                         </div>
                       </div>
                     </div>
                    <div class="col-md-6">
                      <div class="info-row">
                        <label class="editorial-label">Correo Electrónico de Acceso</label>
                        <div class="value">{{ (perfil$ | async)?.email }}</div>
                        <small class="text-muted" style="font-size: 0.75rem;">El correo electrónico no se puede cambiar.</small>
                      </div>
                    </div>
                  </div>
                  
                  <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <button type="button" class="btn btn-light rounded-3" (click)="cancelEdit()">Cancelar</button>
                    <button type="submit" class="btn-editorial" 
                            [disabled]="editForm.invalid || isSaving || !hasChanges() || !editData.nombres?.trim() || !editData.apellidos?.trim() || !editData.telefono?.trim()" 
                            style="padding: 0.5rem 2rem; border-radius: 12px;">
                      <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
                    </button>
                  </div>
                </form>
              </ng-container>
            </div>
          </div>

          <!-- Seguridad / Password Section -->
          <div class="editorial-card mt-4 p-0" style="max-width: none; overflow: hidden;">
            <div class="card-header-minimal px-4 d-flex justify-content-between align-items-center">
               <div><i class="bi bi-shield-lock me-2"></i> Seguridad de la Cuenta</div>
               <button *ngIf="!isChangingPassword" class="btn btn-sm btn-link text-dark fw-bold text-decoration-none" (click)="startChangePassword()">
                  Cambiar Contraseña
               </button>
            </div>
            <div class="card-body-minimal p-4">
                <div *ngIf="!isChangingPassword" class="text-muted small">
                    Tu contraseña protege tu cuenta. Recomendamos cambiarla periódicamente.
                </div>

                <div *ngIf="isChangingPassword">
                    <div class="info-row mb-3">
                        <label class="editorial-label">Ingresa tu nueva contraseña</label>
                        <div class="input-group">
                            <input [type]="showPassword ? 'text' : 'password'" 
                                   class="editorial-input" 
                                   [(ngModel)]="nuevaPassword" 
                                   placeholder="Mínimo 6 caracteres"
                                   style="border-top-right-radius: 0; border-bottom-right-radius: 0; flex: 1;">
                            <button class="btn btn-outline-secondary" type="button" 
                                    (click)="showPassword = !showPassword"
                                    style="border: 1px solid var(--border-color); border-left: 0; border-radius: 0 12px 12px 0; background: #f8fafc;">
                                <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                            </button>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn-editorial btn-sm px-3" 
                                [disabled]="nuevaPassword.length < 6 || isSaving"
                                (click)="savePassword()"
                                style="font-size: 0.75rem; border-radius: 8px; padding: 0.4rem 1.2rem;">Confirmar</button>
                        <button class="btn btn-light rounded-3 btn-sm px-3" (click)="cancelChangePassword()">Cancelar</button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .perfil-container {
      font-family: var(--font-main);
    }
    .profile-avatar-large {
      width: 100px;
      height: 100px;
      background: var(--primary-color);
      color: white;
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
      font-weight: 800;
    }
    .card-header-minimal {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      font-weight: 800;
      font-size: 0.95rem;
      color: var(--text-main);
      background: var(--bg-main);
    }
    .info-row label {
      /* Ya manejado por .editorial-label */
    }
    .info-row .value {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .info-row .value-small {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .badge-role {
      background: var(--primary-color);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 800;
    }
    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--status-danger);
      margin-right: 0.5rem;
    }
    .status-indicator.active {
      background: var(--status-success);
    }
    
    .alert-cambio-password {
      background: #fff9db;
      border-left: 6px solid var(--status-warning);
      padding: 1.25rem;
      border-radius: 18px;
    }
    
    .alert-icon {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: var(--status-warning); color: #fff;
      border-radius: 12px; font-size: 1.1rem;
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease;
    }

    .editorial-input.is-invalid-editorial {
      border-color: #ef4444 !important;
      background-color: #fffafb !important;
    }

    .error-text-editorial {
      color: #ef4444; font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.35rem;
      display: block; animation: slideInDown 0.2s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInDown { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }

    /* Estilo local para botón deshabilitado */
    .btn-editorial:disabled {
      background-color: #e2e8f0 !important;
      color: #94a3b8 !important;
      cursor: not-allowed !important;
      transform: none !important;
      box-shadow: none !important;
      opacity: 0.7;
    }
  `]
})
export class PerfilPage implements OnInit {
  perfil$: Observable<SuperadminPerfil | null>;
  
  isEditing = false;
  isSaving = false;
  isChangingPassword = false;
  showPassword = false;
  nuevaPassword = '';
  
  private originalData: SuperadminPerfil | null = null;

  editData: SuperadminPerfilUpdate = {
    nombres: '',
    apellidos: '',
    telefono: ''
  };

  constructor(
    private perfilService: PerfilService,
    private uiService: UiService
  ) {
    this.perfil$ = this.perfilService.getPerfil();
  }

  ngOnInit() {
    this.perfilService.loadPerfil();
  }

  startEdit() {
    // Tomamos el snapshot actual para pasarlo al formulario
    this.perfil$.pipe(take(1)).subscribe(perfil => {
      if (perfil) {
        this.originalData = perfil;
        this.editData.nombres = perfil.nombres;
        this.editData.apellidos = perfil.apellidos;
        this.editData.telefono = perfil.telefono || '';
        this.isEditing = true;
      }
    });
  }

  cancelEdit() {
    this.isEditing = false;
  }

  saveEdit() {
    this.isSaving = true;
    this.perfilService.updatePerfil(this.editData).subscribe({
      next: () => {
        this.uiService.showToast('Perfil actualizado correctamente', 'success');
        this.isSaving = false;
        this.isEditing = false;
        // Recargar los datos actualizados
        this.perfilService.loadPerfil();
      },
      error: (err) => {
        this.isSaving = false;
        this.uiService.showError(err, 'Error al actualizar perfil');
      }
    });
  }

  startChangePassword() {
    this.isChangingPassword = true;
    this.showPassword = false;
    this.nuevaPassword = '';
  }

  cancelChangePassword() {
    this.isChangingPassword = false;
    this.nuevaPassword = '';
  }

  savePassword() {
    if (this.nuevaPassword.length < 6) return;
    
    this.isSaving = true;
    this.perfilService.updatePassword(this.nuevaPassword).subscribe({
      next: () => {
        this.isSaving = false;
        this.isChangingPassword = false;
        this.uiService.showToast('Contraseña actualizada con éxito', 'success');
        this.perfilService.loadPerfil(); // Recargar para limpiar el flag de requiere_cambio
      },
      error: (err) => {
        this.isSaving = false;
        this.uiService.showError(err, 'Error al cambiar contraseña');
      }
    });
  }

  onlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  hasChanges(): boolean {
    if (!this.originalData) return false;
    
    // Comparación ultra-robusta
    const n1 = (this.editData.nombres || '').toString().trim();
    const n2 = (this.originalData.nombres || '').toString().trim();
    
    const a1 = (this.editData.apellidos || '').toString().trim();
    const a2 = (this.originalData.apellidos || '').toString().trim();
    
    const t1 = (this.editData.telefono || '').toString().trim();
    const t2 = (this.originalData.telefono || '').toString().trim();

    return n1 !== n2 || a1 !== a2 || t1 !== t2;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerfilService } from './services/perfil.service';
import { Observable, take } from 'rxjs';
import { UiService } from '../../../shared/services/ui.service';

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
          <div class="identity-card p-4 text-center mb-4">
            <div class="profile-avatar-large mx-auto mb-3">
              {{ (perfil$ | async)?.nombres?.charAt(0) }}{{ (perfil$ | async)?.apellidos?.charAt(0) }}
            </div>
            <h2 class="h5 fw-bold mb-1">{{ (perfil$ | async)?.nombres }} {{ (perfil$ | async)?.apellidos }}</h2>
            <div class="badge-role mb-4 d-inline-block">{{ (perfil$ | async)?.role }}</div>
            
            <div class="status-summary border-top pt-4 text-start">
              <div class="info-row d-flex justify-content-between align-items-center mb-3">
                <label class="mb-0">Estado de Acceso</label>
                <div class="d-flex align-items-center fw-bold text-corporate small">
                  <span class="status-indicator me-2" [class.active]="(perfil$ | async)?.estado === 'ACTIVA'"></span>
                  {{ (perfil$ | async)?.estado }}
                </div>
              </div>
              <div class="info-row d-flex justify-content-between align-items-center">
                <label class="mb-0">Perfil de Sistema</label>
                <div class="fw-bold text-corporate small">
                  {{ (perfil$ | async)?.activo ? 'HABILITADO' : 'DESHABILITADO' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Actividad -->
          <div class="minimal-card p-4">
            <div class="card-header-minimal mb-3 border-0 bg-transparent p-0">
              <i class="bi bi-clock-history me-2"></i> Actividad Reciente
            </div>
            <div class="info-row mb-3">
              <label>Último Inicio de Sesión</label>
              <div class="value-small">{{ (perfil$ | async)?.ultimo_acceso | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
            <div class="info-row mb-0">
              <label>Miembro desde</label>
              <div class="value-small">{{ (perfil$ | async)?.created_at | date:'MMMM yyyy' }}</div>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Detalles y Seguridad -->
        <div class="col-lg-8">
          <div class="minimal-card mb-5">
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
                      <label>Nombres Completos</label>
                      <div class="value">{{ (perfil$ | async)?.nombres }}</div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="info-row">
                      <label>Apellidos Completos</label>
                      <div class="value">{{ (perfil$ | async)?.apellidos }}</div>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="info-row">
                      <label>Correo Electrónico de Acceso</label>
                      <div class="value text-corporate">{{ (perfil$ | async)?.email }}</div>
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
                        <label>Nombres Completos</label>
                        <input type="text" class="form-control-minimal" [(ngModel)]="editData.nombres" name="nombres" required>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="info-row">
                        <label>Apellidos Completos</label>
                        <input type="text" class="form-control-minimal" [(ngModel)]="editData.apellidos" name="apellidos" required>
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="info-row">
                        <label>Correo Electrónico de Acceso</label>
                        <div class="value text-corporate">{{ (perfil$ | async)?.email }}</div>
                        <small class="text-muted" style="font-size: 0.75rem;">El correo electrónico no se puede cambiar por seguridad.</small>
                      </div>
                    </div>
                  </div>
                  
                  <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <button type="button" class="btn btn-light rounded-3" (click)="cancelEdit()">Cancelar</button>
                    <button type="submit" class="btn btn-primary rounded-3" [disabled]="!editForm.form.valid || isSaving">
                      <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
                    </button>
                  </div>
                </form>
              </ng-container>
            </div>
          </div>

          <!-- Seguridad / Password Section -->
          <div class="minimal-card mt-4">
            <div class="card-header-minimal px-4 d-flex justify-content-between align-items-center">
               <div><i class="bi bi-shield-lock me-2"></i> Seguridad de la Cuenta</div>
               <button *ngIf="!isChangingPassword" class="btn btn-sm btn-link text-primary fw-bold text-decoration-none" (click)="startChangePassword()">
                  Cambiar Contraseña
               </button>
            </div>
            <div class="card-body-minimal p-4">
                <div *ngIf="!isChangingPassword" class="text-muted small">
                    Tu contraseña protege tu cuenta. Recomendamos cambiarla periódicamente.
                </div>

                <div *ngIf="isChangingPassword">
                    <div class="info-row mb-3">
                        <label>Ingresa tu nueva contraseña</label>
                        <div class="input-group">
                            <input [type]="showPassword ? 'text' : 'password'" 
                                   class="form-control-minimal" 
                                   [(ngModel)]="nuevaPassword" 
                                   placeholder="Mínimo 6 caracteres"
                                   style="border-top-right-radius: 0; border-bottom-right-radius: 0; flex: 1;">
                            <button class="btn btn-outline-secondary" type="button" 
                                    (click)="showPassword = !showPassword"
                                    style="border: 1px solid #f1f5f9; border-left: 0; border-radius: 0 12px 12px 0; background: #f8fafc;">
                                <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                            </button>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary rounded-3 btn-sm px-3" 
                                [disabled]="nuevaPassword.length < 6 || isSaving"
                                (click)="savePassword()">Confirmar</button>
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
    }
    .identity-card {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 24px;
    }
    .profile-avatar-large {
      width: 100px;
      height: 100px;
      background: #161d35;
      color: white;
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
      font-weight: 800;
    }
    .minimal-card {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 24px;
      overflow: hidden;
    }
    .card-header-minimal {
      padding: 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      font-weight: 800;
      font-size: 0.95rem;
      color: #161d35;
      background: #f8fafc;
    }
    .info-row label {
      display: block;
      font-size: 0.75rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 0.35rem;
      letter-spacing: 0.5px;
    }
    .info-row .value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #161d35;
    }
    .info-row .value-small {
      font-size: 0.9rem;
      font-weight: 600;
      color: #475569;
    }
    .badge-role {
      background: #161d35;
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
      background: #ef4444;
      margin-right: 0.5rem;
    }
    .status-indicator.active {
      background: #10b981;
    }
    .form-control-minimal {
      width: 100%;
      padding: 0.65rem 1rem;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
      background: #f8fafc;
      outline: none;
      transition: all 0.2s;
    }
    .form-control-minimal:focus {
      border-color: #161d35;
      background: white;
    }
    .btn-minimal-action {
      background: #161d35;
      color: white;
      border: none;
      padding: 0.65rem 1rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 700;
      transition: all 0.2s;
    }
    .btn-minimal-action:hover {
      background: #0f172a;
    }

    .alert-cambio-password {
      background: #fff9db;
      border-left: 6px solid #fab005;
      padding: 1.25rem;
      border-radius: 18px;
    }
    
    .alert-icon {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: #fab005; color: #fff;
      border-radius: 12px; font-size: 1.1rem;
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PerfilPage implements OnInit {
  perfil$: Observable<any>;
  
  isEditing = false;
  isSaving = false;
  isChangingPassword = false;
  showPassword = false;
  nuevaPassword = '';
  
  editData = {
    nombres: '',
    apellidos: ''
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
        this.editData.nombres = perfil.nombres;
        this.editData.apellidos = perfil.apellidos;
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
}

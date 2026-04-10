import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerfilUsuario } from '../../../../domain/models/perfil.model';

@Component({
    selector: 'app-profile-header',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="header-card card-premium overflow-hidden mb-4">
      <div class="row g-0 align-items-center">
        <!-- Avatar Section -->
        <div class="col-md-auto p-4 text-center">
          <div class="avatar-container">
            <div class="avatar-lux shadow-sm">
                {{ getInitials(perfil) }}
            </div>
            <div class="status-badge" [class.online]="perfil.activo"></div>
          </div>
        </div>

        <!-- Name & Info Section -->
        <div class="col-md px-4 py-4 py-md-0 border-start-md">
          <div class="d-flex justify-content-between align-items-start">
            <div *ngIf="!isEditing" style="flex: 1;">
                <h1 class="user-name d-flex align-items-center mb-1">
                  {{ perfil.nombres }} {{ perfil.apellidos }}
                  <button class="btn btn-sm btn-outline-primary ms-3 rounded-circle d-flex align-items-center justify-content-center" 
                          (click)="startEdit()" 
                          title="Editar Perfil"
                          style="width: 32px; height: 32px; padding: 0;">
                    <i class="bi bi-pencil-fill" style="font-size: 0.85rem;"></i>
                  </button>
                </h1>
                <div class="d-flex align-items-center gap-4 mt-3 mb-2 flex-wrap">
                    <!-- Contacto -->
                    <div class="mini-info-item">
                        <div class="mini-icon blue"><i class="bi bi-phone"></i></div>
                        <div class="mini-content">
                            <label>Contacto</label>
                            <span>{{ perfil.telefono || 'Sin registrar' }}</span>
                        </div>
                    </div>
                    <!-- Estado -->
                    <div class="mini-info-item">
                        <div class="mini-icon green"><i class="bi bi-shield-check"></i></div>
                        <div class="mini-content">
                            <label>Estado Laboral</label>
                            <span>{{ perfil.activo ? 'Activo' : 'Inactivo' }}</span>
                        </div>
                    </div>
                    <!-- Privilegios -->
                    <div class="mini-info-item">
                        <div class="mini-icon purple"><i class="bi bi-cpu-fill"></i></div>
                        <div class="mini-content">
                            <label>Privilegios de Sistema</label>
                            <span>{{ perfil.rol_nombre || perfil.system_role }}</span>
                        </div>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-3 mt-1">
                    <span class="email-badge" title="Correo de acceso"><i class="bi bi-envelope me-1"></i> {{ perfil.email }}</span>
                    <!-- CAMBIO PASSWORD BUTTON -->
                    <button class="btn btn-sm btn-link text-primary fw-bold p-0" style="font-size: 0.75rem; text-decoration: none;" (click)="startChangePassword()">
                       <i class="bi bi-key-fill me-1"></i> Cambiar Contraseña
                    </button>
                </div>
            </div>

            <div *ngIf="isChangingPassword" class="w-100 me-3" style="max-width: 400px;">
                <h4 class="fw-bold mb-3 header-font" style="color: #161d35;">Actualizar Contraseña</h4>
                <div class="alert alert-info py-2 px-3 mb-3 border-0" shadow-sm style="border-radius: 12px; font-size: 0.75rem; background: #eef2ff; color: #3b82f6;">
                   Ingresa tu nueva contraseña para acceder al sistema.
                </div>
                <div class="mb-3">
                    <label class="form-label mb-1 fw-bold" style="font-size: 0.75rem;">Nueva Contraseña</label>
                    <div class="input-group">
                        <input [type]="showPassword ? 'text' : 'password'" 
                               class="form-control" 
                               [(ngModel)]="nuevaPassword" 
                               placeholder="Al menos 6 caracteres" 
                               minlength="6"
                               style="border-radius: 12px 0 0 12px;">
                        <button class="btn btn-outline-secondary" 
                                type="button" 
                                (click)="showPassword = !showPassword"
                                style="border-radius: 0 12px 12px 0; border-color: #dee2e6;">
                            <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                        </button>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary px-4 py-2" [disabled]="nuevaPassword.length < 6 || isSaving" (click)="savePassword()" style="border-radius: 12px; font-weight: 700; font-size: 0.85rem;">
                       <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                       Confirmar
                    </button>
                    <button class="btn btn-light px-4 py-2" (click)="cancelChangePassword()" [disabled]="isSaving" style="border-radius: 12px; font-weight: 700; font-size: 0.85rem;">
                       Cancelar
                    </button>
                </div>
            </div>

            <div *ngIf="isEditing" class="w-100 me-3" style="max-width: 500px;">
               <h4 class="fw-bold mb-3 header-font" style="color: #161d35;">Mis Datos Personales</h4>
               <form (ngSubmit)="saveEdit()" #editForm="ngForm">
                 <div class="row g-3">
                   <div class="col-sm-6">
                     <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Nombres</label>
                     <input type="text" class="form-control" [(ngModel)]="editData.nombres" name="nombres" required>
                   </div>
                   <div class="col-sm-6">
                     <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Apellidos</label>
                     <input type="text" class="form-control" [(ngModel)]="editData.apellidos" name="apellidos" required>
                   </div>
                    <div class="col-12">
                      <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Teléfono (Móvil)</label>
                      <input type="text" 
                             class="form-control" 
                             [(ngModel)]="editData.telefono" 
                             name="telefono" 
                             pattern="^09[0-9]{8}$" 
                             maxlength="10" 
                             placeholder="Ej: 0987654321"
                             (keypress)="onlyNumbers($event)"
                             #telInput="ngModel"
                             [class.is-invalid]="telInput.invalid && telInput.touched">
                      <div *ngIf="telInput.invalid && telInput.touched" class="text-danger mt-1" style="font-size: 0.7rem; font-weight: 700;">
                        Debe iniciar con 09 y tener 10 dígitos.
                      </div>
                    </div>
                 </div>

                 <div class="mt-3 d-flex gap-2">
                   <button type="submit" class="btn btn-primary px-4 py-2" style="border-radius: 12px; font-weight: 700; font-size: 0.85rem;" [disabled]="!editForm.form.valid || isSaving || !hasChanges">
                     <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                     {{ isSaving ? 'Guardando...' : 'Guardar' }}
                   </button>
                   <button type="button" class="btn btn-light px-4 py-2" style="border-radius: 12px; font-weight: 700; font-size: 0.85rem;" [disabled]="isSaving" (click)="cancelEdit()">Cancelar</button>
                 </div>
               </form>
            </div>
            <!-- Actions removed by user request -->
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .card-premium {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 28px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.03);
    }
    
    .avatar-container { position: relative; display: inline-block; }
    .avatar-lux {
      width: 100px; height: 100px;
      background: linear-gradient(135deg, #161d35 0%, #2e3b62 100%);
      color: white; font-size: 2.25rem; font-weight: 850;
      display: flex; align-items: center; justify-content: center;
      border-radius: 32px;
    }
    .status-badge {
      position: absolute; bottom: 4px; right: 4px;
      width: 22px; height: 22px; border: 4px solid #fff;
      border-radius: 50%; background: #94a3b8;
    }
    .status-badge.online { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }

    .user-name { font-size: 2rem; font-weight: 950; color: #161d35; margin: 0; letter-spacing: -0.5px; }
    
    .mini-info-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .mini-icon {
      width: 32px; height: 32px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
    }
    .mini-icon.blue { background: #eff6ff; color: #3b82f6; }
    .mini-icon.green { background: #ecfdf5; color: #10b981; }
    .mini-icon.purple { background: #f5f3ff; color: #8b5cf6; }

    .mini-content { display: flex; flex-direction: column; }
    .mini-content label { font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: -2px; }
    .mini-content span { font-size: 0.85rem; font-weight: 800; color: #475569; }

    .email-badge {
      background: #f8fafc; color: #64748b;
      padding: 0.3rem 0.75rem; border-radius: 8px;
      font-size: 0.75rem; font-weight: 700;
      border: 1px solid #f1f5f9;
    }

    .btn-action-header, .btn-logout-header {
      width: 44px; height: 44px; border-radius: 14px; border: 1px solid #eef2f6;
      background: white; color: #64748b; transition: all 0.2s;
    }
    .btn-action-header:hover { background: #f8fafc; color: #161d35; }
    .btn-logout-header:hover { background: #fef2f2; color: #ef4444; border-color: #fee2e2; }

    .loading i { animation: spin 0.8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    @media (min-width: 768px) {
        .border-start-md { border-left: 1px solid #f1f5f9; }
    }
  `]
})
export class ProfileHeaderComponent implements OnChanges {
    @Input() perfil!: PerfilUsuario;
    @Input() loading: boolean = false;

    @Output() onUpdate = new EventEmitter<{nombres: string, apellidos: string, telefono: string}>();
    @Output() onChangePassword = new EventEmitter<string>();

    @Input() isSaving: boolean = false;
    
    isEditing: boolean = false;
    isChangingPassword: boolean = false;
    showPassword: boolean = false;
    nuevaPassword: string = '';
    
    editData = {
        nombres: '',
        apellidos: '',
        telefono: ''
    };

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isSaving']) {
            // Si pasamos de estar guardando (true) a no guardando (false), cerramos los editores
            if (changes['isSaving'].previousValue === true && changes['isSaving'].currentValue === false) {
                this.isEditing = false;
                this.isChangingPassword = false;
                this.showPassword = false;
                this.nuevaPassword = '';
            }
        }
    }

    onlyNumbers(event: KeyboardEvent) {
        const charCode = event.which ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
        }
    }

    getInitials(perfil: PerfilUsuario): string {
        return (perfil.nombres?.charAt(0) || '') + (perfil.apellidos?.charAt(0) || '');
    }

    get hasChanges(): boolean {
        if (!this.perfil) return false;
        return this.editData.nombres !== (this.perfil.nombres || '') ||
               this.editData.apellidos !== (this.perfil.apellidos || '') ||
               this.editData.telefono !== (this.perfil.telefono || '');
    }

    startEdit() {
        this.editData = {
            nombres: this.perfil.nombres || '',
            apellidos: this.perfil.apellidos || '',
            telefono: this.perfil.telefono || ''
        };
        this.isEditing = true;
    }

    cancelEdit() {
        this.isEditing = false;
    }

    saveEdit() {
        this.onUpdate.emit(this.editData);
    }

    startChangePassword() {
        this.isChangingPassword = true;
        this.isEditing = false;
        this.showPassword = false;
        this.nuevaPassword = '';
    }

    cancelChangePassword() {
        this.isChangingPassword = false;
        this.showPassword = false;
        this.nuevaPassword = '';
    }

    savePassword() {
        if (this.nuevaPassword.length >= 6) {
            this.onChangePassword.emit(this.nuevaPassword);
        }
    }
}

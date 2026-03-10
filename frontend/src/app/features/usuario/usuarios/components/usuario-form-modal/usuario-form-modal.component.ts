import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../../../../domain/models/user.model';
import { UsuariosService } from '../../services/usuarios.service';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-usuario-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-final">
          <h2 class="modal-title-final">{{ usuario ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
          <button (click)="close()" class="btn-close-final" [disabled]="loading">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final scroll-custom">
          <form [formGroup]="userForm" (ngSubmit)="submit()">
            
            <!-- DATOS PERSONALES -->
            <div class="form-section-final">
              <h3 class="section-header-final">Información Personal</h3>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="label-final">Nombres *</label>
                  <input 
                    type="text" 
                    formControlName="nombre" 
                    class="input-final" 
                    placeholder="Ej: Juan"
                    [class.is-invalid]="userForm.get('nombre')?.invalid && userForm.get('nombre')?.touched"
                  >
                </div>
                <div class="col-md-6">
                  <label class="label-final">Apellidos *</label>
                  <input 
                    type="text" 
                    formControlName="apellido" 
                    class="input-final" 
                    placeholder="Ej: Pérez"
                    [class.is-invalid]="userForm.get('apellido')?.invalid && userForm.get('apellido')?.touched"
                  >
                </div>
              </div>
            </div>

            <!-- ACCESO Y CONTACTO -->
            <div class="form-section-final">
              <h3 class="section-header-final">Acceso y Contacto</h3>
              <div class="row g-3">
                <div class="col-md-12" *ngIf="usuario">
                  <label class="label-final">Correo Electrónico</label>
                  <input 
                    type="email" 
                    formControlName="correo" 
                    class="input-final" 
                    placeholder="juan.perez@empresa.com"
                    [readonly]="true"
                  >
                  <small class="text-muted">El correo no se puede cambiar por seguridad.</small>
                </div>
                <div class="col-md-6">
                  <label class="label-final">Teléfono</label>
                  <input type="text" formControlName="telefono" class="input-final" placeholder="0999999999">
                </div>
                <!-- Info: sin campo de contraseña -->
                <div class="col-md-12" *ngIf="!usuario">
                  <div class="info-password-notice">
                    <i class="bi bi-shield-lock-fill"></i>
                    <div>
                      <strong>Contraseña por defecto</strong>
                      <p>El nuevo usuario recibirá la contraseña <code>password</code>. Deberá cambiarla en su primer acceso.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ROL Y ESTADO -->
            <div class="form-section-final border-0 mb-0" *ngIf="!isSelf()">
              <h3 class="section-header-final">Configuración de Cuenta</h3>
              <div class="row g-3 align-items-center">
                <div class="col-md-6">
                  <label class="label-final">Rol en la Empresa *</label>
                  <select formControlName="empresa_rol_id" class="select-final">
                    <option value="" disabled>Seleccione un rol...</option>
                    <option *ngFor="let rol of availableRoles" [value]="rol.id">
                      {{ rol.nombre }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <div class="form-check form-switch mt-4 switch-final">
                    <input class="form-check-input" type="checkbox" formControlName="activo" id="activoUserCheck">
                    <label class="form-check-label ms-2 fw-bold" for="activoUserCheck">
                      {{ userForm.get('activo')?.value ? 'CUENTA ACTIVA' : 'CUENTA INACTIVA' }}
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer-final">
          <button (click)="close()" class="btn-cancel-final" [disabled]="loading">Cancelar</button>
          <button (click)="submit()" 
                  [disabled]="userForm.invalid || (usuario && userForm.pristine) || loading" 
                  class="btn-submit-final d-flex align-items-center gap-2">
            <span *ngIf="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ loading ? 'Guardando...' : (usuario ? 'Guardar Cambios' : 'Registrar Usuario') }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10000;
      padding: 1rem;
    }
    .modal-container-final {
      background: #ffffff; width: 600px;
      max-width: 95vw; max-height: 90vh; border-radius: 28px;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final {
      padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center;
    }
    .modal-title-final {
      font-size: 1.25rem; font-weight: 800; color: #161d35; margin: 0;
    }
    .btn-close-final {
      background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer;
    }
    .modal-body-final {
      padding: 0 2.5rem 2rem; overflow-y: auto; flex: 1;
    }
    .form-section-final {
      margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9;
    }
    .section-header-final {
      font-size: 0.9rem; font-weight: 800; color: #1e293b; margin-bottom: 1.25rem;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .label-final {
      font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; display: block;
    }
    .input-final, .select-final {
      width: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 0.75rem 1.25rem; font-size: 0.9rem; color: #475569; font-weight: 600;
      transition: all 0.2s;
    }
    .input-final:focus, .select-final:focus {
      border-color: #161d35; outline: none; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    .input-final[readonly] { background: #f8fafc; cursor: not-allowed; }
    .info-password-notice {
      display: flex; align-items: flex-start; gap: 0.75rem;
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;
      padding: 1rem 1.25rem; margin-top: 0.5rem;
    }
    .info-password-notice i { color: #3b82f6; font-size: 1.3rem; margin-top: 2px; flex-shrink: 0; }
    .info-password-notice strong { display: block; font-size: 0.8rem; font-weight: 800; color: #1e3a8a; }
    .info-password-notice p { font-size: 0.78rem; color: #1d4ed8; margin: 4px 0 0; }
    .info-password-notice code { background: #dbeafe; padding: 1px 6px; border-radius: 4px; font-weight: 700; }
    .modal-footer-final {
      padding: 1.25rem 2.5rem; background: #ffffff; display: flex; justify-content: flex-end; gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-submit-final {
      background: #161d35; color: #ffffff; border: none; padding: 0.75rem 2rem; border-radius: 12px;
      font-weight: 700; transition: all 0.2s;
    }
    .btn-submit-final:hover:not(:disabled) {
      background: #232d4d; transform: translateY(-1px);
    }
    .btn-submit-final:disabled {
      opacity: 0.5; cursor: not-allowed;
    }
    .btn-cancel-final {
      background: #ffffff; color: #64748b; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem;
      border-radius: 12px; font-weight: 600;
    }
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .switch-final .form-check-input:checked { background-color: #161d35; border-color: #161d35; }
    .is-invalid { border-color: #ef4444 !important; }
  `]
})
export class UsuarioFormModalComponent implements OnInit, OnDestroy {
  @Input() usuario: User | null = null;
  @Input() loading: boolean = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  userForm: FormGroup;
  availableRoles: any[] = [];

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      correo: [''],
      telefono: [''],
      empresa_rol_id: ['', [Validators.required]],
      activo: [true]
    });
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.fetchRoles();

    if (this.usuario) {
      this.userForm.patchValue({
        nombre: this.usuario.nombre || this.usuario.nombres,
        apellido: this.usuario.apellido || this.usuario.apellidos,
        correo: this.usuario.correo || this.usuario.email,
        telefono: this.usuario.telefono,
        empresa_rol_id: this.usuario.empresa_rol_id,
        activo: this.usuario.activo !== false
      });
    } else {
      // For new users, empresa_rol_id is required
      this.userForm.get('empresa_rol_id')?.setValidators([Validators.required]);
    }
    this.userForm.get('empresa_rol_id')?.updateValueAndValidity();
  }

  fetchRoles() {
    this.usuariosService.listarRoles().subscribe({
      next: (roles) => {
        // Filtramos roles de sistema que no sean para la empresa (opcional, seguridad extra)
        this.availableRoles = roles.filter(r =>
          r.codigo !== 'SUPERADMIN' && r.codigo !== 'VENDEDOR'
        );

        // Si es creación y solo hay un rol, seleccionarlo por defecto
        if (!this.usuario && this.availableRoles.length === 1) {
          this.userForm.get('empresa_rol_id')?.setValue(this.availableRoles[0].id);
        }
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching roles:', err);
        this.cd.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  submit() {
    if (this.userForm.valid) {
      const raw = this.userForm.value;
      const formValue: any = {
        nombres: raw.nombre,
        apellidos: raw.apellido,
        telefono: raw.telefono,
      };
      
      if (!this.usuario) {
        // If creating, do not send email as backend generates it
        delete formValue.email;
      } else {
        formValue.email = raw.correo;
      }
      if (this.usuario) {
        // Editing: include rol and activo only if visible (non-self)
        if (!this.isSelf()) {
          formValue.empresa_rol_id = raw.empresa_rol_id;
          formValue.activo = raw.activo;
        }
      } else {
        // Creating: always include rol
        formValue.empresa_rol_id = raw.empresa_rol_id;
      }
      this.onSave.emit(formValue);
    }
  }

  close() {
    if (!this.loading) {
      this.onClose.emit();
    }
  }

  isSelf(): boolean {
    if (!this.usuario) return false;
    const currentUser = this.authService.getUser();
    if (!currentUser) return false;
    
    // En el sistema de gestión, comparamos el ID de la tabla 'usuarios'
    const sessionUsuarioId = (currentUser as any).usuario_id;
    return this.usuario.id === sessionUsuarioId;
  }
}

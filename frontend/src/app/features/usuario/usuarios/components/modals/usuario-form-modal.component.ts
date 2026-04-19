import { Component, EventEmitter, Output, Input, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../../../../domain/models/user.model';
import { UsuariosService } from '../../services/usuarios.service';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-usuario-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-content-container shadow-lg">
        
        <!-- Header -->
        <div class="modal-header">
          <div class="header-icon">
             <i class="bi" [ngClass]="usuario ? 'bi-person-gear' : 'bi-person-plus'"></i>
          </div>
          <div class="header-text">
            <h5>{{ usuario ? 'Editar Perfil de Usuario' : 'Nuevo Integrante' }}</h5>
            <span>{{ usuario ? 'Actualice los datos personales y de acceso' : 'Complete la información para el nuevo acceso' }}</span>
          </div>
          <button class="btn-close-custom" (click)="close()" [disabled]="loading">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body scroll-custom">
          <form [formGroup]="userForm" (ngSubmit)="submit()">
            
            <!-- INFORMACIÓN PERSONAL -->
            <div class="form-section">
              <div class="section-title">
                <i class="bi bi-person-lines-fill"></i>
                <span>Información Personal</span>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Nombre *</label>
                  <input type="text" formControlName="nombre" class="form-input-premium" 
                         [class.is-invalid]="isFieldInvalid('nombre')" placeholder="Ej: Juan">
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('nombre')">
                    El nombre es obligatorio
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Apellido *</label>
                  <input type="text" formControlName="apellido" class="form-input-premium" 
                         [class.is-invalid]="isFieldInvalid('apellido')" placeholder="Ej: Pérez">
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('apellido')">
                    El apellido es obligatorio
                  </div>
                </div>
              </div>
            </div>

            <!-- CONTACTO Y ACCESO -->
            <div class="form-section">
              <div class="section-title">
                <i class="bi bi-envelope-at"></i>
                <span>Contacto y Acceso</span>
              </div>
              <div class="row g-3">
                <div class="col-md-12">
                  <label class="form-label">Correo Electrónico</label>
                  <input type="email" formControlName="correo" class="form-input-premium" 
                         [class.is-invalid]="isFieldInvalid('correo')" 
                         [placeholder]="usuario ? 'correo@ejemplo.com' : 'Generación automática por el sistema'" 
                         readonly>
                  <div class="invalid-feedback" *ngIf="userForm.get('correo')?.errors?.['required'] && isFieldInvalid('correo')">
                    El correo es obligatorio
                  </div>
                  <div class="invalid-feedback" *ngIf="userForm.get('correo')?.errors?.['email'] && isFieldInvalid('correo')">
                    Ingrese un correo electrónico válido
                  </div>
                  <small *ngIf="usuario" class="text-muted-xs mt-1 d-block">El correo electrónico no se puede modificar por seguridad.</small>
                  <div *ngIf="!usuario" class="info-notice-compact mt-2">
                    <i class="bi bi-info-circle-fill"></i>
                    <span>El correo se generará dinámicamente usando el nombre y apellido.</span>
                  </div>
                </div>
                <div class="col-md-12">
                  <label class="form-label">Teléfono de contacto *</label>
                  <input type="text" formControlName="telefono" class="form-input-premium" 
                         [class.is-invalid]="isFieldInvalid('telefono')"
                         (keypress)="validateNumbers($event)" maxlength="10" placeholder="Ej: 0987654321">
                  <div class="invalid-feedback" *ngIf="userForm.get('telefono')?.errors?.['required'] && isFieldInvalid('telefono')">
                    El teléfono es obligatorio
                  </div>
                  <div class="invalid-feedback" *ngIf="userForm.get('telefono')?.errors?.['pattern'] && isFieldInvalid('telefono')">
                    Debe empezar con 09 y tener 10 dígitos
                  </div>
                </div>
                
                <!-- PASSWORD NOTICE FOR NEW USERS -->
                <div class="col-md-12" *ngIf="!usuario">
                  <div class="info-notice warning">
                    <i class="bi bi-shield-lock-fill"></i>
                    <div class="notice-content">
                      <strong>Contraseña Temporal</strong>
                      <p>El sistema asignará <code>password</code> como clave inicial. El usuario deberá cambiarla al primer ingreso.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- CONFIGURACIÓN DE CUENTA -->
            <div class="form-section last">
              <div class="section-title">
                <i class="bi bi-gear-wide-connected"></i>
                <span>Configuración de Cuenta</span>
              </div>
              
              <div *ngIf="isSelf()" class="info-notice warning mb-4">
                 <i class="bi bi-exclamation-triangle-fill"></i>
                 <div class="notice-content">
                    <strong>Tu propio perfil</strong>
                    <p>No puedes modificar tu rol o estado de activación desde esta interfaz administrativa.</p>
                 </div>
              </div>

              <div class="row g-3">
                <div class="col-md-12">
                  <label class="form-label">Rol Asignado *</label>
                  <select formControlName="empresa_rol_id" class="form-select-premium" 
                          [class.is-invalid]="isFieldInvalid('empresa_rol_id')">
                    <option value="" disabled>Seleccione un rol corporativo...</option>
                    <option *ngFor="let rol of availableRoles" [value]="rol.id">{{ rol.nombre }}</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="isFieldInvalid('empresa_rol_id')">
                    Debe asignar un rol al usuario
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <div class="status-toggle" *ngIf="!isSelf()">
            <span [class.active]="userForm.get('activo')?.value">
              {{ userForm.get('activo')?.value ? 'Usuario Habilitado' : 'Usuario Deshabilitado' }}
            </span>
            <div class="form-check form-switch" [formGroup]="userForm">
              <input class="form-check-input" type="checkbox" formControlName="activo">
            </div>
          </div>
          <div class="actions">
            <button (click)="close()" class="btn-cancel" [disabled]="loading">Cancelar</button>
            <button (click)="submit()"
                    [disabled]="getSubmitDisabled()"
                    class="btn-save">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ usuario ? 'Guardar Cambios' : 'Registrar Usuario' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem; }
    .modal-content-container { background: white; border-radius: 24px; width: 100%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #f1f5f9; }
    .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 1.25rem; position: relative; }
    .header-icon { width: 48px; height: 48px; border-radius: 14px; background: var(--status-info-bg); color: var(--status-info-text); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .header-text h5 { margin: 0; font-weight: 800; color: black; font-size: 1.25rem; }
    .header-text span { font-size: 0.85rem; color: #64748b; font-weight: 500; }
    .btn-close-custom { position: absolute; right: 1.5rem; top: 1.5rem; width: 32px; height: 32px; border-radius: 10px; border: none; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; }
    .btn-close-custom:hover { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .modal-body { padding: 2rem; overflow-y: auto; flex: 1; }
    .form-section { margin-bottom: 2rem; }
    .form-section.last { margin-bottom: 0; }
    .section-title { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; color: black; }
    .section-title i { font-size: 1.1rem; color: var(--status-info-text); }
    .section-title span { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .form-label { font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 0.5rem; }
    .form-input-premium { width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.95rem; font-weight: 500; transition: all 0.2s; }
    .form-select-premium { width: 100%; min-height: 58px; padding: 0.5rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 1rem; font-weight: 600; line-height: 1.5; transition: all 0.2s; cursor: pointer; }
    .form-input-premium:focus, .form-select-premium:focus { outline: none; background: white; border-color: var(--status-info); box-shadow: 0 0 0 4px var(--status-info-bg); }
    .form-input-premium[readonly] { background: #f1f5f9; cursor: not-allowed; }
    
    /* VALIDATION STYLES */
    .is-invalid { border-color: var(--status-danger) !important; background-color: var(--status-danger-bg) !important; }
    .is-invalid:focus { box-shadow: 0 0 0 4px var(--status-danger-bg) !important; }
    .invalid-feedback { color: var(--status-danger-text); font-size: 0.75rem; font-weight: 600; margin-top: 0.4rem; padding-left: 0.5rem; display: block; }

    .text-muted-xs { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
    .info-notice { display: flex; gap: 1rem; padding: 1rem; background: var(--status-info-bg); border: 1px solid var(--status-info); border-radius: 16px; }
    .info-notice i { color: var(--status-info-text); font-size: 1.2rem; }
    .info-notice.warning { background: var(--status-warning-bg); border-color: var(--status-warning); }
    .info-notice.warning i { color: var(--status-warning-text); }
    .notice-content strong { display: block; font-size: 0.8rem; font-weight: 800; color: black; margin-bottom: 0.2rem; }
    .notice-content p { font-size: 0.75rem; color: #475569; margin: 0; line-height: 1.4; }
    .notice-content code { background: white; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700; border: 1px solid var(--border-color, #f1f5f9); }
    .modal-footer { padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; background: #f8fafc; }
    .status-toggle { display: flex; align-items: center; gap: 1rem; }
    .status-toggle span { font-size: 0.85rem; font-weight: 700; color: #94a3b8; }
    .status-toggle span.active { color: var(--status-success-text); }
    .info-notice-compact { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--status-warning-bg); border: 1px solid var(--status-warning); border-radius: 8px; color: var(--status-warning-text); font-size: 0.75rem; font-weight: 600; }
    .info-notice-compact i { font-size: 0.9rem; color: var(--status-warning-text); }
    .self-badge { padding: 0.5rem 1rem; background: #ecfdf5; color: #065f46; border-radius: 100px; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; }
    .actions { display: flex; gap: 1rem; }
    .btn-cancel { padding: 0.75rem 1.5rem; border-radius: 12px; border: none; background: white; color: #64748b; font-weight: 700; }
    .btn-cancel:hover { background: #f1f5f9; color: black; }
    .btn-save { padding: 0.75rem 2rem; border-radius: 12px; border: none; background: var(--secondary-color, var(--primary-color)); color: white; font-weight: 700; transition: all 0.2s; }
    .btn-save:hover:not(:disabled) { background: var(--neutral-700); transform: translateY(-2px); }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .form-check-input { width: 3em; height: 1.5em; cursor: pointer; }
    .form-check-input:checked { background-color: var(--status-success); border-color: var(--status-success); }
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class UsuarioFormModalComponent implements OnInit, OnDestroy {
  @Input() usuario: User | null = null;
  @Input() loading: boolean = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  userForm: FormGroup;
  availableRoles: any[] = [];
  initialValues: any = null;
  submitted: boolean = false;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      correo: [null, [Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^09\d{8}$/)]],
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

      if (this.isSelf()) {
        this.userForm.get('empresa_rol_id')?.disable();
        this.userForm.get('activo')?.disable();
      }
    }
    
    this.initialValues = this.userForm.getRawValue();
  }

  ngOnDestroy() { document.body.style.overflow = 'auto'; }

  fetchRoles() {
    this.usuariosService.listarRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles.filter(r => 
          r.codigo !== 'SUPERADMIN' && r.codigo !== 'VENDEDOR' && r.activo !== false
        );
        if (!this.usuario && this.availableRoles.length === 1) {
          this.userForm.get('empresa_rol_id')?.setValue(this.availableRoles[0].id);
        }
        this.cd.detectChanges();
      }
    });
  }

  isSelf(): boolean {
    if (!this.usuario) return false;
    const current = this.authService.getUser();
    if (!current) return false;
    const currentId = String(current.id || (current as any).usuario_id || (current as any).id_usuario || '');
    const targetId = String(this.usuario.id || '');
    const targetAuthId = String(this.usuario.user_id || (this.usuario as any).usuario_id || '');
    return currentId === targetId || currentId === targetAuthId;
  }

  hasChanges(): boolean {
    if (!this.usuario || !this.initialValues) return true;
    return JSON.stringify(this.userForm.getRawValue()) !== JSON.stringify(this.initialValues);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.userForm.get(fieldName);
    return !!(control && control.invalid && (control.touched || this.submitted));
  }

  getSubmitDisabled(): boolean {
    if (this.loading) return true;
    if (this.userForm.invalid) return true;
    if (this.usuario && !this.hasChanges()) return true;
    return false;
  }

  submit() {
    this.submitted = true;
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    if (this.userForm.valid) {
      const raw = this.userForm.getRawValue();
      const payload: any = {
        nombres: raw.nombre,
        apellidos: raw.apellido,
        telefono: raw.telefono,
        email: raw.correo,
        empresa_rol_id: raw.empresa_rol_id,
        activo: raw.activo
      };
      this.onSave.emit(payload);
    }
  }

  validateNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) event.preventDefault();
  }

  close() { if (!this.loading) this.onClose.emit(); }
}



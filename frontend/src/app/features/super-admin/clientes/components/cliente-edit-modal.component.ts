import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteUsuario } from '../services/clientes.service';
import { AuthService } from '../../../../core/auth/auth.service';

interface Rol {
    id: string;
    nombre: string;
}

@Component({
    selector: 'app-cliente-edit-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div>
            <span class="editorial-label mb-1 d-block" style="color: var(--primary-color);">Gestión de Usuarios</span>
            <h2 class="modal-title">Editar Perfil</h2>
          </div>
          <button class="close-pill" (click)="onClose.emit()">
            <i class="bi bi-x"></i>
          </button>
        </div>
        
        <!-- Body -->
        <div class="modal-body">
          <form #form="ngForm">
            <div class="row g-4">
              <!-- Nombres -->
              <div class="col-md-6">
                <label class="editorial-label">Nombres *</label>
                <input 
                  type="text"
                  class="editorial-input"
                  [(ngModel)]="formData.nombres" 
                  name="nombres" 
                  required
                  minlength="3"
                  #nom="ngModel"
                  [class.is-invalid]="nom.invalid && nom.touched"
                  placeholder="Ej. Juan Andrés"
                >
              </div>
              
              <!-- Apellidos -->
              <div class="col-md-6">
                <label class="editorial-label">Apellidos *</label>
                <input 
                  type="text"
                  class="editorial-input"
                  [(ngModel)]="formData.apellidos" 
                  name="apellidos" 
                  required
                  minlength="3"
                  #ape="ngModel"
                  [class.is-invalid]="ape.invalid && ape.touched"
                  placeholder="Ej. Pérez García"
                >
              </div>
              
              <!-- Email -->
              <div class="col-md-6">
                <label class="editorial-label">Email de Acceso</label>
                <input 
                  type="email"
                  class="editorial-input bg-light-soft"
                  [(ngModel)]="formData.email" 
                  name="email" 
                  readonly
                  disabled
                >
                <small class="text-muted mt-2 d-block" style="font-size: 0.65rem; letter-spacing: 0.02em;">
                  <i class="bi bi-lock-fill me-1"></i> El correo electrónico es el identificador único.
                </small>
              </div>
              
              <!-- Teléfono -->
              <div class="col-md-6">
                <label class="editorial-label">Teléfono de Contacto *</label>
                <input 
                  type="text"
                  class="editorial-input"
                  [(ngModel)]="formData.telefono" 
                  name="telefono"
                  placeholder="099 999 9999"
                  required
                  pattern="[0-9]{10}"
                  maxlength="10"
                  (keypress)="onlyNumbers($event)"
                  #tel="ngModel"
                  [class.is-invalid]="tel.invalid && tel.touched"
                >
              </div>
              
              <!-- Config Sección (Si no es uno mismo) -->
              <div class="col-12" *ngIf="!isSelf()">
                <div class="divider-text">
                  <span>Permisos Administrativos</span>
                </div>
                <label class="editorial-label">Rol del Usuario *</label>
                <select 
                  class="editorial-input"
                  [(ngModel)]="formData.empresa_rol_id" 
                  name="rol"
                  required
                >
                  <option [value]="null" disabled>Seleccionar un rol...</option>
                  <option *ngFor="let rol of roles" [value]="rol.id">
                    {{ rol.nombre }}
                  </option>
                </select>
              </div>

              <!-- Info Sección (Si es uno mismo) -->
              <div class="col-12" *ngIf="isSelf()">
                <div class="divider-text">
                  <span>Seguridad de Cuenta</span>
                </div>
                <div class="self-info-card">
                    <div class="d-flex align-items-center gap-3">
                        <div class="icon-lock">
                            <i class="bi bi-shield-lock"></i>
                        </div>
                        <div>
                            <span class="editorial-label mb-0" style="color: #475569;">Nivel de Acceso</span>
                            <p class="m-0 fw-bold text-dark">{{ cliente.rol_nombre || 'Administrador' }}</p>
                        </div>
                    </div>
                </div>
              </div>

            </div>
          </form>
        </div>
        
        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-cancel" (click)="onClose.emit()">
            Descartar
          </button>
          <button 
            class="btn-editorial py-2" 
            style="min-width: 180px; font-size: 0.8rem;"
            [disabled]="!form.valid || saving"
            (click)="save()"
          >
            <span *ngIf="!saving">Actualizar Perfil</span>
            <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
            <span *ngIf="saving">Procesando...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1.5rem;
    }

    .modal-card {
      background: white;
      border-radius: 32px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 40px 120px -20px rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-color);
    }

    .modal-header {
      padding: 2.5rem 3rem 1.5rem 3rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0;
      letter-spacing: -0.03em;
    }

    .close-pill {
      background: #f1f5f9;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
      cursor: pointer;
    }
    .close-pill:hover {
      background: var(--primary-color);
      color: white;
      transform: rotate(90deg);
    }

    .modal-body {
      padding: 0.5rem 3rem 2rem 3rem;
      overflow-y: auto;
      flex: 1;
    }

    .bg-light-soft {
      background: #f8fafc !important;
      border-style: dashed !important;
      cursor: not-allowed;
    }

    .divider-text {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 1.5rem 0;
      color: #cbd5e1;
    }
    .divider-text::before, .divider-text::after {
      content: '';
      flex: 1;
      border-bottom: 1.5px solid #f1f5f9;
    }
    .divider-text span {
      padding: 0 1rem;
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }

    .self-info-card {
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 20px;
      border: 1.5px solid #f1f5f9;
    }

    .icon-lock {
      width: 44px;
      height: 44px;
      background: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: var(--primary-color);
      box-shadow: 0 4px 10px rgba(0,0,0,0.03);
    }

    .modal-footer {
      padding: 1.5rem 3rem 2.5rem 3rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(to top, #ffffff 80%, rgba(255,255,255,0));
    }

    .btn-cancel {
      background: transparent;
      color: #94a3b8;
      border: none;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: color 0.2s;
    }
    .btn-cancel:hover {
      color: var(--text-main);
    }

    .is-invalid {
      border-color: var(--status-danger) !important;
    }
  `]
})
export class ClienteEditModalComponent implements OnInit {
    @Input() cliente!: ClienteUsuario;
    @Input() roles: Rol[] = [];
    @Output() onClose = new EventEmitter<void>();
    @Output() onSave = new EventEmitter<any>();

    formData: any = {};
    saving = false;

    constructor(private authService: AuthService) {}

    ngOnInit() {
        this.formData = {
            nombres: this.cliente.nombres,
            apellidos: this.cliente.apellidos,
            email: this.cliente.email,
            telefono: this.cliente.telefono,
            empresa_rol_id: this.cliente.empresa_rol_id
        };
    }

    onlyNumbers(event: any) {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            event.preventDefault();
        }
    }

    save() {
        if (this.saving) return;
        
        const payload = { ...this.formData };
        
        // Si es uno mismo, nunca enviamos el rol para prevenir cambios accidentales
        if (this.isSelf()) {
            delete payload.empresa_rol_id;
        }

        this.saving = true;
        this.onSave.emit(payload);
    }

    isSelf(): boolean {
        if (!this.cliente) return false;
        const currentUser = this.authService.getUser();
        if (!currentUser) return false;

        // Comparación robusta entre ClienteUsuario (cliente) y User (currentUser)
        // ClienteUsuario tiene .id y .user_id (referencia al usuario auth)
        const currentUserId = currentUser.id || (currentUser as any).usuario_id || (currentUser as any).id_usuario;
        
        // El modal de super-admin maneja ClienteUsuario, cuya clave primaria es .id 
        // pero la clave del usuario es .user_id
        const targetUserId = this.cliente.user_id || this.cliente.id;

        return String(currentUserId) === String(targetUserId);
    }
}
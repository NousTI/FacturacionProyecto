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
      <div class="modal-container" (click)="$event.stopPropagation()">
        <!-- HEADER -->
        <div class="modal-header-premium">
          <div>
            <h3 class="modal-title">Editar Perfil Administrativo</h3>
            <p class="modal-subtitle">Actualiza la información de este usuario</p>
          </div>
          <button class="btn-close-premium" (click)="onClose.emit()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        
        <!-- BODY -->
        <div class="modal-body-premium">
          <form #form="ngForm">
            <div class="row g-3">
              <!-- Nombres -->
              <div class="col-md-6">
                <label class="form-label">Nombres *</label>
                <input 
                  type="text"
                  class="form-control-premium"
                  [(ngModel)]="formData.nombres" 
                  name="nombres" 
                  required
                  minlength="3"
                  #nom="ngModel"
                  [class.is-invalid]="nom.invalid && nom.touched"
                  placeholder="Ingrese nombres"
                >
              </div>
              
              <!-- Apellidos -->
              <div class="col-md-6">
                <label class="form-label">Apellidos *</label>
                <input 
                  type="text"
                  class="form-control-premium"
                  [(ngModel)]="formData.apellidos" 
                  name="apellidos" 
                  required
                  minlength="3"
                  #ape="ngModel"
                  [class.is-invalid]="ape.invalid && ape.touched"
                  placeholder="Ingrese apellidos"
                >
              </div>
              
              <!-- Email -->
              <div class="col-md-6">
                <label class="form-label">Email de Acceso</label>
                <input 
                  type="email"
                  class="form-control-premium bg-light"
                  [(ngModel)]="formData.email" 
                  name="email" 
                  readonly
                  disabled
                >
                <small class="text-muted" style="font-size: 0.7rem;">El email no puede ser modificado.</small>
              </div>
              
              <!-- Teléfono -->
              <div class="col-md-6">
                <label class="form-label">Teléfono *</label>
                <input 
                  type="text"
                  class="form-control-premium"
                  [(ngModel)]="formData.telefono" 
                  name="telefono"
                  placeholder="0999999999"
                  required
                  pattern="[0-9]{10}"
                  maxlength="10"
                  (keypress)="onlyNumbers($event)"
                  #tel="ngModel"
                  [class.is-invalid]="tel.invalid && tel.touched"
                >
              </div>
              
              <!-- SECCION ROL (SI NO ES UNO MISMO) -->
              <div class="col-12 mt-4 pt-3 border-top" *ngIf="!isSelf()">
                <div class="admin-config-header mb-3">
                    <i class="bi bi-gear-fill me-2"></i>
                    CONFIGURACIÓN DE CUENTA
                </div>
                <label class="form-label">Rol Asignado *</label>
                <select 
                  class="form-select-premium"
                  [(ngModel)]="formData.empresa_rol_id" 
                  name="rol"
                  required
                >
                  <option [value]="null" disabled>Seleccionar rol...</option>
                  <option *ngFor="let rol of roles" [value]="rol.id">
                    {{ rol.nombre }}
                  </option>
                </select>
              </div>

              <!-- SECCION ROL (SI ES UNO MISMO - SOLO LECTURA) -->
              <div class="col-12 mt-4 pt-3 border-top" *ngIf="isSelf()">
                <div class="alert alert-info d-flex align-items-center mb-3 py-2 px-3 border-0" style="border-radius: 12px; font-size: 0.8rem; background: #f0f7ff;">
                    <i class="bi bi-info-circle-fill me-2 text-primary"></i>
                    <span>Por seguridad, no puedes cambiar tu propio rol administrativo.</span>
                </div>
                <label class="form-label opacity-75">Tu Rol Actual</label>
                <div class="p-3 bg-light rounded-3 fw-bold border text-secondary d-flex align-items-center">
                    <i class="bi bi-shield-lock me-2"></i>
                    {{ cliente.rol_nombre || 'Rol Asignado' }}
                </div>
              </div>

            </div>
          </form>
        </div>
        
        <!-- FOOTER -->
        <div class="modal-footer-premium">
          <button class="btn-secondary-premium" (click)="onClose.emit()">
            Cancelar
          </button>
          <button 
            class="btn-primary-premium" 
            [disabled]="!form.valid || saving"
            (click)="save()"
          >
            <i class="bi" [class]="saving ? 'bi-hourglass-split' : 'bi-check-lg'"></i>
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
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
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    }

    .modal-container {
      background: white;
      border-radius: 28px;
      width: 100%;
      max-width: 650px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.25);
    }

    .modal-header-premium {
      padding: 2rem 2.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .modal-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #161d35;
      margin: 0;
    }

    .modal-subtitle {
      color: #94a3b8;
      font-size: 0.85rem;
      margin: 0.35rem 0 0 0;
    }

    .btn-close-premium {
      background: #f8fafc;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-close-premium:hover {
      background: #161d35;
      color: white;
    }

    .modal-body-premium {
      padding: 2.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.6rem;
      display: block;
    }

    .admin-config-header {
        font-size: 0.8rem;
        font-weight: 900;
        color: #161d35;
        letter-spacing: 1px;
    }

    .form-control-premium,
    .form-select-premium {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 0.85rem 1.25rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium:focus,
    .form-select-premium:focus {
      background: #ffffff;
      border-color: #161d35;
      box-shadow: 0 0 0 5px rgba(22, 29, 53, 0.05);
      outline: none;
    }
    .form-control-premium.is-invalid {
        border-color: #ef4444;
    }

    .modal-footer-premium {
      padding: 1.5rem 2.5rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .btn-secondary-premium {
      background: #ffffff;
      color: #64748b;
      border: 1.5px solid #e2e8f0;
      padding: 0.85rem 1.75rem;
      border-radius: 16px;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-secondary-premium:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #1e293b;
    }

    .btn-primary-premium {
      background: #161d35;
      color: #ffffff;
      border: none;
      padding: 0.85rem 2rem;
      border-radius: 16px;
      font-weight: 800;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 15px 30px -8px rgba(22, 29, 53, 0.3);
      cursor: pointer;
    }
    .btn-primary-premium:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 25px 40px -10px rgba(22, 29, 53, 0.4);
      background: #232d4d;
    }
    .btn-primary-premium:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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


import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card-empresas-style h-100">
      <div class="card-body p-4 position-relative">
        
        <!-- Vista Normal -->
        <ng-container *ngIf="!isEditing">
          <div class="text-center mb-4 position-relative">
            <button class="btn btn-action-edit position-absolute top-0 end-0" 
                    (click)="startEdit()" 
                    title="Editar Perfil">
              <i class="bi bi-pencil-fill"></i>
            </button>
            <div class="avatar-circle mx-auto mb-3">
              {{ getInitials(nombres, apellidos) }}
            </div>
            <h4 class="fw-bold mb-1 header-font text-dark">{{ nombres }} {{ apellidos }}</h4>
            <p class="text-secondary small mb-3">{{ email }}</p>
            <span class="custom-badge" [ngClass]="activo ? 'badge-active' : 'badge-inactive'">
              <i class="bi me-1" [ngClass]="activo ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
              {{ activo ? 'Cuenta Activa' : 'Cuenta Inactiva' }}
            </span>
          </div>

          <hr class="border-light opacity-50 my-4">

          <!-- CAMBIO PASSWORD BUTTON -->
          <div class="mb-4 text-center" *ngIf="!isChangingPassword">
             <button class="btn btn-outline-secondary fw-bold rounded-3" style="font-size:0.9rem;" (click)="startChangePassword()">
                <i class="bi bi-key-fill me-2"></i> Cambiar Contraseña
             </button>
          </div>

          <!-- PASSWORD CHANGE FORM -->
          <div *ngIf="isChangingPassword" class="mb-4 animate-fade-in border p-4 rounded-4" style="background-color: #fafbfc; border-color: rgba(0,0,0,0.05) !important;">
              <div class="d-flex justify-content-between align-items-center mb-4">
                  <h6 class="fw-bold mb-0 text-dark header-font d-flex align-items-center gap-2">
                     <i class="bi bi-shield-lock text-primary"></i> Actualizar Contraseña
                  </h6>
                  <button class="btn-close" (click)="cancelChangePassword()"></button>
              </div>
              
              <div class="mb-4">
                  <label class="form-label text-muted small fw-semibold mb-2">Ingresa tu nueva contraseña</label>
                  <div class="position-relative">
                      <i class="bi bi-lock position-absolute text-muted" style="left: 14px; top: 50%; transform: translateY(-50%); z-index: 5;"></i>
                      <input [type]="showPassword ? 'text' : 'password'" 
                             class="form-control form-control-premium" 
                             style="padding-left: 2.5rem; padding-right: 2.5rem;"
                             [(ngModel)]="nuevaPassword" 
                             placeholder="Mín. 6 caracteres">
                      <button class="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted shadow-none" 
                              type="button" 
                              (click)="showPassword = !showPassword"
                              style="z-index: 5;">
                          <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                      </button>
                  </div>
              </div>
              
              <button class="btn-premium-primary w-100 justify-content-center" 
                      style="height: 44px; border-radius: 12px;"
                      [disabled]="nuevaPassword.length < 6 || isSaving" 
                      (click)="savePassword()">
                  <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                  Guardar Contraseña
              </button>
          </div>

          <div class="row g-3" *ngIf="!isChangingPassword">
            <div class="col-6">
              <div class="info-box p-3 h-100 rounded-4">
                <div class="info-icon text-primary mb-2"><i class="bi bi-card-heading"></i></div>
                <label class="d-block text-muted small fw-semibold mb-1">Documento</label>
                <p class="mb-0 fw-bold text-dark">{{ documento_identidad || 'N/A' }}</p>
              </div>
            </div>
            <div class="col-6">
              <div class="info-box p-3 h-100 rounded-4">
                <div class="info-icon text-info mb-2"><i class="bi bi-telephone"></i></div>
                <label class="d-block text-muted small fw-semibold mb-1">Teléfono</label>
                <p class="mb-0 fw-bold text-dark">{{ telefono || 'N/A' }}</p>
              </div>
            </div>
            <div class="col-6">
              <div class="info-box p-3 h-100 rounded-4">
                <div class="info-icon text-warning mb-2"><i class="bi bi-percent"></i></div>
                <label class="d-block text-muted small fw-semibold mb-1">Comisión</label>
                <p class="mb-0 fw-bold text-dark">{{ tipo_comision || 'N/A' }}</p>
              </div>
            </div>
            <div class="col-6">
               <div class="info-box p-3 h-100 rounded-4">
                <div class="info-icon text-success mb-2"><i class="bi bi-calendar3"></i></div>
                <label class="d-block text-muted small fw-semibold mb-1">Registro</label>
                <p class="mb-0 fw-bold text-dark">{{ fecha_registro | date:'mediumDate' }}</p>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Vista de Edición -->
        <ng-container *ngIf="isEditing">
          <div class="mb-2">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold mb-0 header-font text-dark d-flex align-items-center gap-2">
                   <i class="bi bi-pencil-square text-primary"></i> Editar Perfil
                </h4>
                <button class="btn-close" (click)="cancelEdit()"></button>
            </div>
            
            <form (ngSubmit)="saveEdit()" #editForm="ngForm" class="edit-form">
              <div class="row g-4">
                <div class="col-sm-6">
                  <label class="form-label text-muted small fw-semibold">Nombres</label>
                  <input type="text" class="form-control form-control-premium shadow-none" [(ngModel)]="editData.nombres" name="nombres" #nombresInput="ngModel" required minlength="3">
                  <div class="invalid-feedback fw-semibold mt-1" [class.d-block]="nombresInput.invalid && nombresInput.touched">
                    Mínimo 3 caracteres.
                  </div>
                </div>
                <div class="col-sm-6">
                  <label class="form-label text-muted small fw-semibold">Apellidos</label>
                  <input type="text" class="form-control form-control-premium shadow-none" [(ngModel)]="editData.apellidos" name="apellidos" #apellidosInput="ngModel" required minlength="3">
                  <div class="invalid-feedback fw-semibold mt-1" [class.d-block]="apellidosInput.invalid && apellidosInput.touched">
                    Mínimo 3 caracteres.
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label text-muted small fw-semibold">Teléfono</label>
                  <input type="text" class="form-control form-control-premium shadow-none" [(ngModel)]="editData.telefono" name="telefono" #telefonoInput="ngModel" required pattern="^[0-9]{10}$" maxlength="10">
                  <div class="invalid-feedback fw-semibold mt-1" [class.d-block]="telefonoInput.invalid && (telefonoInput.touched || editForm.submitted)">
                    Debe contener 10 dígitos numéricos.
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-2">
                <button type="submit" class="btn-premium-primary w-100 justify-content-center" style="height: 44px;" [disabled]="!editForm.form.valid || isSaving">
                  <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </form>
          </div>
        </ng-container>

        <ng-container *ngIf="!isEditing && !isChangingPassword">
          <div class="mt-4 stats-container p-4 rounded-4 border row g-0">
              <div class="col-6 text-center border-end border-light">
                  <h3 class="fw-bolder text-dark mb-0">{{ empresas_asignadas }}</h3>
                  <small class="text-muted fw-semibold">Empresas Asignadas</small>
              </div>
              <div class="col-6 text-center">
                  <h3 class="fw-bolder text-success mb-0">{{ ingresos_generados | currency }}</h3>
                  <small class="text-muted fw-semibold">Total Ganado</small>
              </div>
          </div>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .card-empresas-style {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.05);
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    }
    .header-font {
        font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: -0.5px;
    }
    
    .avatar-circle {
      width: 70px;
      height: 70px;
      background: #161d35;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    
    .btn-action-edit {
        width: 36px; height: 36px;
        border-radius: 10px;
        background: #f8fafc;
        color: #64748b; border: 1px solid #e2e8f0;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
    }
    .btn-action-edit:hover { background: #e2e8f0; color: #1e293b; }

    .custom-badge {
        padding: 0.4rem 1rem; border-radius: 30px;
        font-size: 0.75rem; font-weight: 700;
        display: inline-flex; align-items: center;
    }
    .badge-active { background: #dcfce7; color: #166534; }
    .badge-inactive { background: #fee2e2; color: #991b1b; }

    .form-control-premium {
      background: #f8fafc;
      border: 1.5px solid rgba(0, 0, 0, 0.05);
      border-radius: 14px;
      height: 40px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #161d35;
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium:focus {
      background: #ffffff;
      border-color: #161d35;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
      outline: none;
    }

    .info-box {
        background: #f8fafc;
        border: 1px solid #f1f5f9;
    }
    .info-icon { font-size: 1.5rem; }

    .stats-container { background: #fafafa; }

    .btn-premium-primary {
        background: #161d35;
        color: #ffffff;
        border: none;
        padding: 0 1.5rem;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3);
    }
    .btn-premium-primary:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 30px -8px rgba(22, 29, 53, 0.4);
        background: #232d4d;
    }
    .btn-premium-primary:disabled {
        background: #94a3b8;
        cursor: not-allowed;
        box-shadow: none;
    }

    .animate-fade-in { animation: fadeIn 0.4s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProfileCardComponent implements OnChanges {
  @Input() nombres: string = '';
  @Input() apellidos: string = '';
  @Input() email: string = '';
  @Input() activo: boolean = false;
  @Input() documento_identidad: string = '';
  @Input() telefono: string = '';
  @Input() tipo_comision: string = '';
  @Input() fecha_registro: string = '';
  @Input() empresas_asignadas: number = 0;
  @Input() ingresos_generados: number = 0;
  @Input() isSaving: boolean = false;

  @Output() onUpdate = new EventEmitter<{nombres: string, apellidos: string, telefono: string}>();
  @Output() onChangePassword = new EventEmitter<string>();

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
          if (changes['isSaving'].previousValue === true && changes['isSaving'].currentValue === false) {
              this.isEditing = false;
              this.isChangingPassword = false;
              this.showPassword = false;
              this.nuevaPassword = '';
          }
      }
  }

  getInitials(n: string, a: string): string {
    const first = n?.charAt(0) || '';
    const second = a?.charAt(0) || '';
    const initials = first + second;
    return initials ? initials.toUpperCase() : 'VP';
  }

  startEdit() {
    this.editData = {
      nombres: this.nombres,
      apellidos: this.apellidos,
      telefono: this.telefono
    };
    this.isEditing = true;
    this.isChangingPassword = false;
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

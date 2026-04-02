
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card-premium h-100">
      <div class="card-body p-3">
        <!-- Vista Normal -->
        <ng-container *ngIf="!isEditing">
          <div class="text-center mb-3 position-relative">
            <button class="btn btn-sm btn-outline-primary position-absolute top-0 end-0 rounded-circle" 
                    (click)="startEdit()" 
                    title="Editar Perfil"
                    style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center;">
              <i class="bi bi-pencil-fill"></i>
            </button>
            <div class="avatar-circle mx-auto mb-2">
              {{ getInitials(nombres, apellidos) }}
            </div>
            <h5 class="fw-bold mb-0 header-font">{{ nombres }} {{ apellidos }}</h5>
            <p class="text-muted smallest mb-2">{{ email }}</p>
            <span class="badge" [ngClass]="activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
              {{ activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <hr class="border-light opacity-50 my-3">

          <!-- CAMBIO PASSWORD BUTTON -->
          <div class="mb-4" *ngIf="!isChangingPassword">
             <button class="btn btn-sm btn-link text-primary fw-bold p-0 text-decoration-none" (click)="startChangePassword()">
                <i class="bi bi-key-fill me-1"></i> Cambiar Contraseña
             </button>
          </div>

          <!-- PASSWORD CHANGE FORM -->
          <div *ngIf="isChangingPassword" class="mb-4 animate-fade-in shadow-sm p-3 border rounded-4 bg-light">
              <h5 class="fw-bold header-font mb-3" style="font-size: 1rem;">Actualizar Contraseña</h5>
              <div class="mb-3">
                  <label class="form-label info-label">Nueva Contraseña</label>
                  <div class="input-group">
                      <input [type]="showPassword ? 'text' : 'password'" 
                             class="form-control" 
                             [(ngModel)]="nuevaPassword" 
                             placeholder="Mín. 6 caracteres"
                             style="border-radius: 12px 0 0 12px;">
                      <button class="btn btn-outline-secondary" type="button" 
                              (click)="showPassword = !showPassword"
                              style="border-color: #dee2e6; border-radius: 0 12px 12px 0; background: white;">
                          <i class="bi" [class.bi-eye]="!showPassword" [class.bi-eye-slash]="showPassword"></i>
                      </button>
                  </div>
              </div>
              <div class="d-flex gap-2">
                  <button class="btn btn-primary btn-sm px-3" [disabled]="nuevaPassword.length < 6 || isSaving" (click)="savePassword()" style="border-radius: 10px;">
                      <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-1"></span>
                      Confirmar
                  </button>
                  <button class="btn btn-light btn-sm px-3" (click)="cancelChangePassword()" [disabled]="isSaving" style="border-radius: 10px;">
                      Cancelar
                  </button>
              </div>
          </div>

          <div class="row g-3" *ngIf="!isChangingPassword">
            <div class="col-6">
              <div class="profile-info-item">
                <label class="info-label">Documento</label>
                <p class="info-value">{{ documento_identidad || 'N/A' }}</p>
              </div>
            </div>
            <div class="col-6">
              <div class="profile-info-item">
                <label class="info-label">Teléfono</label>
                <p class="info-value">{{ telefono || 'N/A' }}</p>
              </div>
            </div>
            <div class="col-6">
              <div class="profile-info-item">
                <label class="info-label">Tipo Comisión</label>
                <p class="info-value">{{ tipo_comision || 'N/A' }}</p>
              </div>
            </div>
            <div class="col-6">
               <div class="profile-info-item">
                <label class="info-label">Fecha Registro</label>
                <p class="info-value">{{ fecha_registro | date:'mediumDate' }}</p>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Vista de Edición -->
        <ng-container *ngIf="isEditing">
          <div class="mb-4">
            <h4 class="fw-bold header-font mb-3">Editar Perfil</h4>
            
            <form (ngSubmit)="saveEdit()" #editForm="ngForm">
              <div class="row g-3">
                <div class="col-sm-6">
                  <label class="form-label info-label">Nombres</label>
                  <input type="text" class="form-control" [(ngModel)]="editData.nombres" name="nombres" #nombresInput="ngModel" required minlength="3">
                  <div class="invalid-feedback d-block" *ngIf="nombresInput.invalid && nombresInput.touched">
                    Nombre requerido (mín. 3)
                  </div>
                </div>
                <div class="col-sm-6">
                  <label class="form-label info-label">Apellidos</label>
                  <input type="text" class="form-control" [(ngModel)]="editData.apellidos" name="apellidos" #apellidosInput="ngModel" required minlength="3">
                  <div class="invalid-feedback d-block" *ngIf="apellidosInput.invalid && apellidosInput.touched">
                    Apellido requerido (mín. 3)
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label info-label">Teléfono</label>
                  <input type="text" class="form-control" [(ngModel)]="editData.telefono" name="telefono" #telefonoInput="ngModel" required pattern="^[0-9]{10}$" maxlength="10">
                  <div class="invalid-feedback d-block" *ngIf="telefonoInput.invalid && (telefonoInput.touched || editForm.submitted)">
                    Teléfono requerido (10 dígitos numéricos)
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light" (click)="cancelEdit()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="!editForm.form.valid || isSaving">
                  <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </form>
          </div>
        </ng-container>

        <ng-container *ngIf="!isEditing && !isChangingPassword">
          <div class="mt-4 p-3 rounded-3 bg-light-subtle row g-2">
              <div class="col-6 text-center border-end">
                  <small class="d-block text-muted fw-semibold">Empresas</small>
                  <span class="fs-4 fw-bold text-dark">{{ empresas_asignadas }}</span>
              </div>
              <div class="col-6 text-center">
                  <small class="d-block text-muted fw-semibold">Generado</small>
                  <span class="fs-4 fw-bold text-success">{{ ingresos_generados | currency }}</span>
              </div>
          </div>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .card-premium {
      background: white;
      border: 1px solid #eef2f6;
      border-radius: 20px;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .card-premium:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
    }
    .avatar-circle {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
    }
    .header-font {
        font-family: 'Plus Jakarta Sans', sans-serif;
        color: #1e293b;
    }
    .info-label {
      font-size: 0.625rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 0.15rem;
    }
    .info-value {
      font-size: 0.85rem;
      color: #334155;
      font-weight: 600;
      margin-bottom: 0;
    }
    .badge {
        font-size: 0.75rem;
        padding: 0.5em 1em;
        border-radius: 50px;
        font-weight: 600;
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

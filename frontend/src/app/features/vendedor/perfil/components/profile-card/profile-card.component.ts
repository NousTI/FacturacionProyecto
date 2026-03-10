
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card-premium h-100">
      <div class="card-body p-4">
        <!-- Vista Normal -->
        <ng-container *ngIf="!isEditing">
          <div class="text-center mb-4 position-relative">
            <button class="btn btn-sm btn-outline-primary position-absolute top-0 end-0 rounded-circle" 
                    (click)="startEdit()" 
                    title="Editar Perfil"
                    style="width: 35px; height: 35px; padding: 0; display: flex; align-items: center; justify-content: center;">
              <i class="bi bi-pencil-fill"></i>
            </button>
            <div class="avatar-circle mx-auto mb-3">
              {{ getInitials(nombres, apellidos) }}
            </div>
            <h3 class="fw-bold mb-1 header-font">{{ nombres }} {{ apellidos }}</h3>
            <p class="text-muted mb-2">{{ email }}</p>
            <span class="badge" [ngClass]="activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
              {{ activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <hr class="border-light opacity-50 my-4">

          <div class="row g-3">
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
                  <input type="text" class="form-control" [(ngModel)]="editData.nombres" name="nombres" required>
                </div>
                <div class="col-sm-6">
                  <label class="form-label info-label">Apellidos</label>
                  <input type="text" class="form-control" [(ngModel)]="editData.apellidos" name="apellidos" required>
                </div>
                <div class="col-12">
                  <label class="form-label info-label">Teléfono</label>
                  <input type="text" class="form-control" [(ngModel)]="editData.telefono" name="telefono" pattern="^([0-9]{10})?$">
                  <div class="form-text mt-1" style="font-size: 0.8rem;">Ej: 0991234567</div>
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

        <ng-container *ngIf="!isEditing">
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
      width: 90px;
      height: 90px;
      background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
      box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
    }
    .header-font {
        font-family: 'Plus Jakarta Sans', sans-serif;
        color: #1e293b;
    }
    .info-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .info-value {
      font-size: 0.95rem;
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

  isEditing: boolean = false;
  editData = {
    nombres: '',
    apellidos: '',
    telefono: ''
  };

  ngOnChanges(changes: SimpleChanges) {
      if (changes['isSaving']) {
          if (changes['isSaving'].previousValue === true && changes['isSaving'].currentValue === false) {
              this.isEditing = false;
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
  }

  cancelEdit() {
    this.isEditing = false;
  }

  saveEdit() {
    this.onUpdate.emit(this.editData);
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-personal-data-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="editorial-card mb-3 p-0" style="overflow: hidden;">
      <div class="card-header-minimal px-4 d-flex justify-content-between align-items-center">
        <div><i class="bi bi-person-lines-fill me-2"></i> Datos del Perfil</div>
        <button *ngIf="!isEditing" class="btn btn-sm btn-outline-primary rounded-circle edit-btn-circle" 
                (click)="toggleEdit()" 
                title="Editar Perfil">
          <i class="bi bi-pencil-fill"></i>
        </button>
      </div>
      
      <div class="card-body-minimal p-4">
        <!-- Solo lectura -->
        <ng-container *ngIf="!isEditing">
          <div class="row g-4">
            <div class="col-md-6">
              <div class="info-row">
                <label class="editorial-label">Nombres</label>
                <div class="value">{{ nombres }}</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="info-row">
                <label class="editorial-label">Apellidos</label>
                <div class="value">{{ apellidos }}</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="info-row">
                <label class="editorial-label">Correo Electrónico</label>
                <div class="value text-dark">{{ email }}</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="info-row">
                <label class="editorial-label">Teléfono de Contacto</label>
                <div class="value">{{ telefono || 'No registrado' }}</div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Edición -->
        <ng-container *ngIf="isEditing">
          <form (ngSubmit)="save()" #editForm="ngForm">
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
                  <label class="editorial-label">Teléfono</label>
                  <input type="text" class="editorial-input" 
                         [(ngModel)]="editData.telefono" name="telefono" 
                         #telefonoInput="ngModel" required pattern="^09[0-9]{8}$" maxlength="10" (keypress)="onlyNumbers($event)"
                         [class.is-invalid-editorial]="telefonoInput.invalid && (telefonoInput.dirty || telefonoInput.touched)">
                  <small class="error-text-editorial" *ngIf="telefonoInput.invalid && (telefonoInput.dirty || telefonoInput.touched)">
                    Número inválido (09XXXXXXXX)
                  </small>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-row">
                  <label class="editorial-label">Email (No editable)</label>
                  <div class="value text-dark opacity-50">{{ email }}</div>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button type="button" class="btn btn-light rounded-3" (click)="toggleEdit()">Cancelar</button>
              <button type="submit" class="btn-editorial" 
                      [disabled]="editForm.invalid || isSaving || !hasChanges() || !editData.nombres.trim() || !editData.apellidos.trim() || !editData.telefono.trim()"
                      style="padding: 0.5rem 2rem; border-radius: 12px;">
                <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .editorial-card { max-width: none !important; margin: 0 !important; padding: 0 !important; }
    .card-header-minimal {
      padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color);
      font-weight: 800; font-size: 0.9rem; color: #000000; background: #f8fafc;
    }
    .edit-btn-circle { width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; }
    .info-row label { font-size: 0.65rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; display: block; }
    .info-row .value { font-size: 1.1rem; font-weight: 700; color: #000000; }
    .border-top { border-top: 1px solid var(--border-color) !important; }
    
    .editorial-input.is-invalid-editorial {
      border-color: #ef4444 !important;
      background-color: #fffafb !important;
    }

    .error-text-editorial {
      color: #ef4444; font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.35rem;
      display: block; animation: slideInDown 0.2s ease-out;
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
export class PersonalDataCardComponent {
  @Input() nombres: string = '';
  @Input() apellidos: string = '';
  @Input() email: string = '';
  @Input() telefono: string = '';
  @Input() isSaving: boolean = false;

  @Output() onSave = new EventEmitter<{nombres: string, apellidos: string, telefono: string}>();

  isEditing = false;
  editData = { nombres: '', apellidos: '', telefono: '' };

  toggleEdit() {
    if (!this.isEditing) {
      this.editData = { nombres: this.nombres, apellidos: this.apellidos, telefono: this.telefono || '' };
    }
    this.isEditing = !this.isEditing;
  }

  // Permite al padre cerrar el formulario después de un guardado exitoso
  reset() {
    this.isEditing = false;
  }

  save() {
    this.onSave.emit(this.editData);
  }

  onlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  hasChanges(): boolean {
    // Comparación ultra-robusta
    const n1 = (this.editData.nombres || '').toString().trim();
    const n2 = (this.nombres || '').toString().trim();
    
    const a1 = (this.editData.apellidos || '').toString().trim();
    const a2 = (this.apellidos || '').toString().trim();
    
    const t1 = (this.editData.telefono || '').toString().trim();
    const t2 = (this.telefono || '').toString().trim();

    return n1 !== n2 || a1 !== a2 || t1 !== t2;
  }
}

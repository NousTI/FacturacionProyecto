import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PerfilUsuario } from '../../../../domain/models/perfil.model';

@Component({
  selector: 'app-profile-personal-data-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="editorial-card mb-4 p-0 shadow-sm" style="overflow: hidden;">
      <div class="card-header-minimal-editorial px-4 d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-person-badge text-primary"></i>
          <span>Identidad Personal</span>
        </div>
        <button *ngIf="!isEditing" class="btn-icon-minimal-editorial" 
                (click)="toggleEdit()" 
                title="Editar Datos">
          <i class="bi bi-pencil-fill"></i>
        </button>
      </div>
      
      <div class="card-body-minimal-editorial p-4">
        <!-- MODE: READ ONLY -->
        <ng-container *ngIf="!isEditing">
          <div class="row g-4">
            <div class="col-md-6 text-truncate">
              <div class="info-block-editorial">
                <label>Nombres</label>
                <div class="value-display">{{ perfil.nombres }}</div>
              </div>
            </div>
            <div class="col-md-6 text-truncate">
              <div class="info-block-editorial">
                <label>Apellidos</label>
                <div class="value-display">{{ perfil.apellidos }}</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="info-block-editorial">
                <label>Teléfono Celular</label>
                <div class="value-display text-primary">{{ perfil.telefono || 'Sin registrar' }}</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="info-block-editorial">
                <label>Cuenta de Acceso</label>
                <div class="value-display opacity-75 small">{{ perfil.email }}</div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- MODE: EDIT -->
        <ng-container *ngIf="isEditing">
          <form (ngSubmit)="save()" #editForm="ngForm" class="animate-fade-in">
            <div class="row g-4">
              <div class="col-md-6">
                <div class="info-block-editorial">
                  <label>Nombres Completos</label>
                  <input type="text" class="editorial-input-premium" 
                         [(ngModel)]="editData.nombres" name="nombres" 
                         #nombres="ngModel" required
                         [class.is-invalid-editorial]="nombres.invalid && (nombres.dirty || nombres.touched)">
                  <small class="error-text-editorial" *ngIf="nombres.invalid && (nombres.dirty || nombres.touched)">
                    El nombre es obligatorio
                  </small>
                </div>
              </div>
              <div class="col-md-6">
                <div class="info-block-editorial">
                  <label>Apellidos Completos</label>
                  <input type="text" class="editorial-input-premium" 
                         [(ngModel)]="editData.apellidos" name="apellidos" 
                         #apellidos="ngModel" required
                         [class.is-invalid-editorial]="apellidos.invalid && (apellidos.dirty || apellidos.touched)">
                  <small class="error-text-editorial" *ngIf="apellidos.invalid && (apellidos.dirty || apellidos.touched)">
                    El apellido es obligatorio
                  </small>
                </div>
              </div>
              <div class="col-md-12">
                <div class="info-block-editorial">
                  <label>Número de Teléfono</label>
                  <input type="text" class="editorial-input-premium" 
                         [(ngModel)]="editData.telefono" name="telefono" 
                         #telefono="ngModel" required pattern="^09[0-9]{8}$" maxlength="10"
                         (keypress)="onlyNumbers($event)"
                         [class.is-invalid-editorial]="telefono.invalid && (telefono.dirty || telefono.touched)">
                  <small class="error-text-editorial" *ngIf="telefono.invalid && (telefono.dirty || telefono.touched)">
                    Número inválido (Formato: 09XXXXXXXX)
                  </small>
                  <small class="hint-text-editorial mt-2 d-block" *ngIf="!telefono.invalid">Formato requerido: 09XXXXXXXX (10 dígitos)</small>
                </div>
              </div>
            </div>
            
            <div class="d-flex justify-content-end gap-2 mt-4 pt-4 border-top">
              <button type="button" class="btn-minimal-editorial secondary" (click)="toggleEdit()" [disabled]="isSaving">Cancelar</button>
              <button type="submit" class="btn-minimal-editorial primary" 
                      [disabled]="editForm.invalid || isSaving || !hasChanges() || !editData.nombres.trim() || !editData.apellidos.trim() || !editData.telefono.trim()">
                <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                {{ isSaving ? 'Guardando...' : 'Aplicar Cambios' }}
              </button>
            </div>
          </form>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .editorial-card { background: white; border: 1px solid #f1f5f9; border-radius: 24px; }
    
    .card-header-minimal-editorial {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9;
      font-weight: 900; font-size: 0.85rem; color: #1e293b;
      background: #f8fafc; text-transform: uppercase; letter-spacing: 0.05em;
    }
    
    .btn-icon-minimal-editorial {
      width: 34px; height: 34px; border-radius: 10px; border: none;
      background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
      &:hover { background: #dbeafe; transform: scale(1.05); }
    }
    
    .info-block-editorial label {
      display: block; font-size: 0.65rem; font-weight: 900;
      color: #94a3b8; text-transform: uppercase; margin-bottom: 0.35rem;
      letter-spacing: 0.05em;
    }
    .info-block-editorial .value-display { font-size: 1.15rem; font-weight: 850; color: #334155; letter-spacing: -0.01em; }

    .editorial-input-premium {
      width: 100%; padding: 0.75rem 1rem; border-radius: 14px;
      border: 1.5px solid #e2e8f0; background: #f8fafc;
      font-size: 1rem; font-weight: 700; color: #1e293b; transition: all 0.2s;
      &:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    }
    
    .btn-minimal-editorial {
      padding: 0.75rem 1.75rem; border-radius: 14px; font-weight: 850; font-size: 0.85rem;
      border: none; transition: all 0.2s;
      &.primary { background: #1e293b; color: white; &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px -6px rgba(0,0,0,0.2); } }
      &.secondary { background: #f1f5f9; color: #64748b; &:hover { background: #e2e8f0; } }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .hint-text-editorial { font-size: 0.65rem; color: #94a3b8; font-weight: 700; }
    
    .editorial-input-premium.is-invalid-editorial {
      border-color: #ef4444 !important;
      background: #fffafb !important;
    }

    .error-text-editorial {
      color: #ef4444; font-size: 0.65rem; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.35rem;
      display: block; animation: slideInDown 0.2s ease-out;
    }

    .animate-fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInDown { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ProfilePersonalDataCardComponent {
  @Input() perfil!: PerfilUsuario;
  @Input() isSaving: boolean = false;
  @Output() onSave = new EventEmitter<{nombres: string, apellidos: string, telefono: string}>();

  isEditing = false;
  editData = { nombres: '', apellidos: '', telefono: '' };

  constructor(private cdr: ChangeDetectorRef) {}

  toggleEdit() {
    if (!this.isEditing) {
      this.editData = { 
        nombres: this.perfil.nombres || '', 
        apellidos: this.perfil.apellidos || '', 
        telefono: this.perfil.telefono || '' 
      };
    }
    this.isEditing = !this.isEditing;
    this.cdr.markForCheck();
  }

  hasChanges(): boolean {
    if (!this.perfil) return false;
    
    // Comparación ultra-robusta
    const n1 = (this.editData.nombres || '').toString().trim();
    const n2 = (this.perfil.nombres || '').toString().trim();
    
    const a1 = (this.editData.apellidos || '').toString().trim();
    const a2 = (this.perfil.apellidos || '').toString().trim();
    
    const t1 = (this.editData.telefono || '').toString().trim();
    const t2 = (this.perfil.telefono || '').toString().trim();

    return n1 !== n2 || a1 !== a2 || t1 !== t2;
  }

  onlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) event.preventDefault();
  }

  save() {
    this.onSave.emit(this.editData);
  }

  // Permite cerrar el editor desde el padre tras éxito
  closeEdit() {
    this.isEditing = false;
    this.cdr.markForCheck();
  }
}

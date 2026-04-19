import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Rol } from '../../../../shared/services/roles.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-role-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-content-minimal" (click)="$event.stopPropagation()">
        <div class="modal-header-minimal">
          <h5 class="m-0 fw-bold">{{ editingRole ? 'Detalles del Rol' : 'Nuevo Rol' }}</h5>
          <button class="btn-close-minimal" (click)="onClose.emit()"><i class="bi bi-x"></i></button>
        </div>
        <div class="modal-body-minimal p-4">
           <div class="minimal-form-item mb-4">
              <label>Etiqueta del Rol</label>
              <input type="text" placeholder="Ej: Cajero" [(ngModel)]="roleForm.nombre" [readonly]="editingRole && role?.es_sistema">
           </div>
           <div class="minimal-form-item mb-4">
              <label>Descripción Operativa</label>
              <textarea rows="3" placeholder="Describe brevemente las responsabilidades..." [(ngModel)]="roleForm.descripcion" [readonly]="editingRole && role?.es_sistema"></textarea>
           </div>

           <div class="minimal-toggle-stack" *ngIf="!editingRole || !role?.es_sistema">
              <div class="toggle-item-minimal">
                <span>Estado de Disponibilidad</span>
                <div class="form-check form-switch custom-switch-lux">
                  <input class="form-check-input" type="checkbox" [(ngModel)]="roleForm.activo">
                </div>
              </div>
           </div>
        </div>
        <div class="modal-footer-minimal p-4 pt-2">
          <button class="btn btn-minimal-link me-3" (click)="onClose.emit()">Cancelar</button>
          
          <ng-container *ngIf="!editingRole || !role?.es_sistema">
            <button *hasPermission="'CONFIG_ROLES'"
                    class="btn btn-minimal-dark px-4" 
                    (click)="onSave.emit(roleForm)" 
                    [disabled]="saving">
              <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingRole ? 'ACTUALIZAR' : 'CREAR ROL' }}
            </button>
          </ng-container>

          <button *ngIf="editingRole && role?.es_sistema" 
                  class="btn btn-minimal-dark px-4" 
                  (click)="onClose.emit()">
            CERRAR
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 99999;
    }
    .modal-content-minimal {
      background: white; border-radius: 24px; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.25);
      width: 400px;
    }
    .modal-header-minimal { padding: 1.5rem 2rem; display: flex; justify-content: space-between; }
    .btn-close-minimal { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 8px; color: #94a3b8; }

    .minimal-form-item label { display: block; font-size: 0.7rem; font-weight: 800; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .minimal-form-item input, .minimal-form-item textarea {
      width: 100%; border: 1px solid #e2e8f0; background: #fff; border-radius: 12px; padding: 10px 14px;
      font-weight: 600; font-size: 0.9rem; transition: all 0.2s;
    }
    .minimal-form-item input:focus, .minimal-form-item textarea:focus { border-color: var(--primary-color); outline: none; }

    .minimal-toggle-stack { display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1.25rem; }
    .toggle-item-minimal { display: flex; justify-content: space-between; align-items: center; color: #475569; font-weight: 700; font-size: 0.85rem; }

    .custom-switch-lux .form-check-input { width: 2.8rem; height: 1.4rem; cursor: pointer; }
    .form-check-input:checked { background-color: var(--primary-color); border-color: var(--primary-color); }

    .btn-minimal-dark { background: var(--primary-color); color: white; border: none; border-radius: 12px; padding: 0.8rem 1.5rem; font-weight: 700; }
    .btn-minimal-link { background: transparent; border: none; color: #64748b; font-weight: 700; font-size: 0.8rem; }
  `]
})
export class RoleFormModalComponent implements OnChanges {
  @Input() role: Rol | null = null;
  @Input() saving: boolean = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  editingRole = false;
  roleForm = { nombre: '', descripcion: '', activo: true };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['role']) {
      this.editingRole = !!this.role;
      this.roleForm = { 
        nombre: this.role?.nombre || '', 
        descripcion: this.role?.descripcion || '',
        activo: this.role?.activo !== undefined ? this.role?.activo : true
      };
    }
  }
}


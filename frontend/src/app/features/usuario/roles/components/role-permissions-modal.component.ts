import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Rol, Permiso } from '../../../../shared/services/roles.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-role-permissions-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="modal-overlay" (click)="onClose.emit()">
      <div class="modal-content-minimal wide" (click)="$event.stopPropagation()">
        <div class="modal-header-minimal border-bottom align-items-center">
          <div class="d-flex align-items-center gap-3">
            <div class="module-marker" [ngClass]="modulo?.toLowerCase()"></div>
            <h5 class="m-0 fw-bold">{{ modulo }}</h5>
          </div>
          <button class="btn-close-minimal" (click)="onClose.emit()"><i class="bi bi-x"></i></button>
        </div>
        <div class="modal-body-minimal p-0 overflow-auto" style="max-height: 50vh;">
          <div class="minimal-permission-list">
            <div class="perm-row-minimal" *ngFor="let perm of permisos">
              <div class="perm-info-minimal">
                <div class="perm-name-minimal">{{ perm.nombre }}</div>
                <div class="perm-desc-minimal">{{ perm.descripcion }}</div>
              </div>
              <div class="form-check form-switch custom-switch-lux">
                <input class="form-check-input" type="checkbox" 
                       [(ngModel)]="perm.selected" 
                       [disabled]="role?.es_sistema || saving">
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer-minimal p-4 border-top bg-light-soft justify-content-center">
           <button *hasPermission="'CONFIG_ROLES'"
                   class="btn btn-minimal-dark px-5" 
                   (click)="onSave.emit()" 
                   [disabled]="saving || (!role?.es_sistema && !hasChanges)">
             <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
             {{ role?.es_sistema ? 'CERRAR' : (saving ? 'GUARDANDO...' : 'GUARDAR') }}
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
    }
    .modal-content-minimal.wide { width: 620px; }
    .modal-header-minimal { padding: 1.5rem 2rem; display: flex; justify-content: space-between; }
    .btn-close-minimal { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 8px; color: #94a3b8; }

    .perm-row-minimal {
      padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f8fafc;
    }
    .perm-name-minimal { font-weight: 700; color: var(--primary-color); font-size: 0.85rem; }
    .perm-desc-minimal { font-size: 0.75rem; color: #94a3b8; font-weight: 500; margin-top: 2px; }
    
    .module-marker { width: 4px; height: 16px; border-radius: 10px; }
    .module-marker.clientes { background: #3b82f6; }
    .module-marker.productos { background: #ec4899; }
    .module-marker.facturas { background: #10b981; }
    .module-marker.reportes { background: #f59e0b; }
    .module-marker.configuracion { background: #64748b; }

    .custom-switch-lux .form-check-input { width: 2.8rem; height: 1.4rem; cursor: pointer; }
    .form-check-input:checked { background-color: var(--primary-color); border-color: var(--primary-color); }

    .btn-minimal-dark { background: var(--primary-color); color: white; border: none; border-radius: 12px; padding: 0.8rem 1.5rem; font-weight: 700; }
    .bg-light-soft { background-color: #f8fafc; }
  `]
})
export class RolePermissionsModalComponent {
  @Input() modulo: string | null = null;
  @Input() permisos: Permiso[] = [];
  @Input() role: Rol | null = null;
  @Input() saving: boolean = false;
  @Input() hasChanges: boolean = false;
  @Output() onSave = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();
}


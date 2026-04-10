import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Rol } from '../../../../shared/services/roles.service';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <div class="card card-minimal shadow-soft h-100">
      <div class="card-header-minimal d-flex justify-content-between align-items-center">
        <span class="text-secondary fw-bold small tracking-widest">ROLES</span>
        <button *hasPermission="'ROLES_CREAR'" (click)="onCreate.emit()" class="btn-create-minimal" title="Nuevo Rol">
          <i class="bi bi-plus-lg"></i>
        </button>
      </div>
      <div class="card-body p-2 scroll-thin overflow-auto">
        <div class="roles-stack">
          <div *ngFor="let role of roles" 
               (click)="onSelect.emit(role)"
               [class.selected]="selectedRoleId === role.id"
               class="role-item-minimal mb-1">
            <div class="role-item-content">
              <span class="role-item-name">{{ role.nombre }}</span>
              <span class="role-item-count">{{ role.num_usuarios || 0 }} activos</span>
            </div>
            <button *hasPermission="'ROLES_EDITAR'" class="btn-edit-minimal" (click)="onEditRole($event, role)">
              <i class="bi bi-pencil"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shadow-soft { box-shadow: 0 4px 30px rgba(0,0,0,0.02); }
    .tracking-widest { letter-spacing: 0.1em; }
    .scroll-thin::-webkit-scrollbar { width: 5px; }
    .scroll-thin::-webkit-scrollbar-track { background: transparent; }
    .scroll-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    .card-minimal {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .card-header-minimal { padding: 1.25rem 1.5rem; }

    .role-item-minimal {
      padding: 0.75rem 1.25rem;
      border-radius: 14px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    }
    .role-item-minimal:hover { background: #f8fafc; }
    .role-item-minimal.selected { background: #f1f5f9; }
    .role-item-name { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
    .role-item-count { font-size: 0.7rem; color: #94a3b8; font-weight: 600; display: block; }
    
    .btn-create-minimal {
      width: 32px; height: 32px; border-radius: 10px; border: none;
      background: #f1f5f9; color: #1e293b; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-create-minimal:hover { background: #1e293b; color: #fff; }

    .btn-edit-minimal { border: none; background: transparent; color: #cbd5e1; font-size: 0.8rem; }
    .selected .btn-edit-minimal { color: #1e293b; }
  `]
})
export class RoleListComponent {
  @Input() roles: Rol[] = [];
  @Input() selectedRoleId?: string;
  @Output() onSelect = new EventEmitter<Rol>();
  @Output() onCreate = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<Rol>();

  onEditRole(event: Event, role: Rol) {
    event.stopPropagation();
    this.onEdit.emit(role);
  }
}

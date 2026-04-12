import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-usuarios-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="actions-container">
      <div class="search-wrapper">
        <i class="bi bi-search"></i>
        <input 
          type="text" 
          [(ngModel)]="searchQuery" 
          (ngModelChange)="onSearchChange($event)"
          placeholder="Buscar por nombre, apellido o email..."
          class="search-input"
        >
      </div>

      <div class="buttons-group">
        <!-- FILTRO ESTADO -->
        <div class="dropdown">
          <button class="btn-filter" 
                  type="button" 
                  data-bs-toggle="dropdown"
                  data-bs-popper-config='{"strategy":"fixed"}'>
            <i class="bi bi-circle-fill" [style.color]="getEstadoColor()"></i>
            <span>{{ getEstadoLabel() }}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" (click)="setEstado('ALL')">Todos los Estados</a></li>
            <li><a class="dropdown-item" (click)="setEstado('ACTIVE')">Solo Activos</a></li>
            <li><a class="dropdown-item" (click)="setEstado('INACTIVE')">Solo Inactivos</a></li>
          </ul>
        </div>

        <!-- FILTRO ROL -->
        <div class="dropdown">
          <button class="btn-filter" 
                  type="button" 
                  data-bs-toggle="dropdown"
                  data-bs-popper-config='{"strategy":"fixed"}'>
            <i class="bi bi-shield-lock"></i>
            <span>{{ getRolLabel() }}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" (click)="setFilter('ALL')">Todos los Roles</a></li>
            <li *ngFor="let rol of availableRoles">
              <a class="dropdown-item" (click)="setFilter(rol.id)">{{ rol.nombre }}</a>
            </li>
          </ul>
        </div>

        <button 
          *hasPermission="'USUARIOS_EMPRESA_CREAR'"
          (click)="onCreate.emit()"
          class="btn-primary"
        >
          <i class="bi bi-person-plus-fill"></i>
          <span>Nuevo Usuario</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .actions-container {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1.5rem; background: transparent; padding: 0; border: none;
    }
    .search-wrapper { position: relative; flex: 1; max-width: 500px; }
    .search-wrapper i { position: absolute; left: 1.1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1rem; }
    .search-input {
      width: 100%; padding: 0.75rem 1rem 0.75rem 2.8rem; border-radius: 14px;
      border: 1px solid #e2e8f0; background: #f8fafc; font-size: 0.9rem;
      font-weight: 500; transition: all 0.2s;
    }
    .search-input:focus { outline: none; background: white; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    .buttons-group { display: flex; align-items: center; gap: 0.75rem; }
    .btn-filter, .btn-primary, .btn-icon-round {
      display: flex; align-items: center; justify-content: center; gap: 0.6rem;
      padding: 0.7rem 1.1rem; border-radius: 12px; font-weight: 700; font-size: 0.85rem;
      cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-filter { background: #f1f5f9; color: #475569; }
    .btn-filter:hover { background: #e2e8f0; }
    .btn-primary { background: #1e293b; color: white; padding: 0.7rem 1.3rem; }
    .btn-primary:hover { background: #0f172a; transform: translateY(-1px); }
    .dropdown-menu { border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); padding: 0.5rem; margin-top: 0.5rem; min-width: 200px; }
    .dropdown-item { border-radius: 8px; padding: 0.6rem 1rem; font-weight: 600; font-size: 0.85rem; color: #475569; cursor: pointer; }
    .dropdown-item:hover { background: #f8fafc; color: #1e293b; }
    .spinning i { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @media (max-width: 992px) { .actions-container { flex-direction: column; align-items: stretch; } .search-wrapper { max-width: 100%; } }
  `]
})
export class UsuariosActionsComponent {
  @Input() searchQuery: string = '';
  @Input() isLoading: boolean = false;
  @Input() availableRoles: any[] = [];
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filters = { 
    rol: 'ALL',
    estado: 'ALL'
  };

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilter(rolId: string) {
    this.filters.rol = rolId;
    this.onFilterChangeEmit.emit(this.filters);
  }

  setEstado(estado: string) {
    this.filters.estado = estado;
    this.onFilterChangeEmit.emit(this.filters);
  }

  getRolLabel(): string {
    if (this.filters.rol === 'ALL') return 'Todos los Roles';
    const rol = this.availableRoles.find(r => r.id === this.filters.rol);
    return rol ? rol.nombre : 'Todos los Roles';
  }

  getEstadoLabel(): string {
    switch (this.filters.estado) {
      case 'ACTIVE': return 'Solo Activos';
      case 'INACTIVE': return 'Solo Inactivos';
      default: return 'Todos los Estados';
    }
  }

  getEstadoColor(): string {
    switch (this.filters.estado) {
      case 'ACTIVE': return '#10b981';
      case 'INACTIVE': return '#ef4444';
      default: return '#94a3b8';
    }
  }
}

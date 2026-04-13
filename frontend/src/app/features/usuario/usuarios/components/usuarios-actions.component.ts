import { Component, EventEmitter, Output, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-usuarios-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          
          <!-- Búsqueda Principal -->
          <div class="col-lg-6">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange()"
                placeholder="Q Buscar por nombre, apellido o email..." 
                class="form-control-premium-search"
              >
              <button 
                *ngIf="searchQuery" 
                (click)="clearSearch()" 
                class="btn-clear-search-premium"
              >
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>

          <!-- Filtros y Acción -->
          <div class="col-lg-6">
            <div class="d-flex align-items-center justify-content-lg-end gap-2">
              
              <!-- Filtro Rol -->
              <div class="dropdown">
                <button 
                  class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                  type="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  data-bs-popper-config='{"strategy":"fixed"}'
                >
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-shield-lock text-muted" style="font-size: 0.9rem;"></i>
                        <span>{{ getRolLabel() }}</span>
                    </div>
                </button>
                <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium dropdown-menu-end">
                  <li><a class="dropdown-item" (click)="setFilter('ALL')">Todos los Roles</a></li>
                  <li *ngFor="let rol of availableRoles">
                    <a class="dropdown-item" (click)="setFilter(rol.id)">{{ rol.nombre }}</a>
                  </li>
                </ul>
              </div>

              <!-- Filtro Estado -->
              <div class="dropdown">
                <button 
                  class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                  type="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  data-bs-popper-config='{"strategy":"fixed"}'
                >
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-circle-fill" [style.color]="getEstadoColor()" style="font-size: 0.6rem;"></i>
                        <span>{{ getEstadoLabel() }}</span>
                    </div>
                </button>
                <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium dropdown-menu-end">
                  <li><a class="dropdown-item" (click)="setEstado('ALL')">Todos los Estados</a></li>
                  <li><a class="dropdown-item" (click)="setEstado('ACTIVE')">Solo Activos</a></li>
                  <li><a class="dropdown-item" (click)="setEstado('INACTIVE')">Solo Inactivos</a></li>
                </ul>
              </div>

              <!-- Botón Crear -->
              <button 
                *hasPermission="'USUARIOS_CREAR'"
                (click)="onCreate.emit()"
                class="btn-system-action"
                style="min-width: 150px;"
              >
                <i class="bi bi-person-plus-fill me-2"></i>
                <span>Nuevo Usuario</span>
              </button>

            </div>
          </div>

        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .actions-bar-container { background: transparent; border: none; }
    
    .search-box-premium { position: relative; width: 100%; }
    .search-box-premium i {
      position: absolute; left: 1.1rem; top: 50%; transform: translateY(-50%);
      color: #94a3b8; font-size: 1rem;
    }
    .form-control-premium-search {
      background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 0 2.5rem 0 2.85rem; height: 44px; font-size: 0.95rem; color: #0f172a;
      transition: all 0.2s; width: 100%; font-weight: 500;
    }
    .form-control-premium-search:focus { border-color: #cbd5e1; outline: none; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .btn-clear-search-premium {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      background: transparent; border: none; color: #94a3b8; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }

    .form-select-premium {
      background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 0 1.25rem; height: 44px; font-size: 0.85rem; color: #475569;
      min-width: 170px; cursor: pointer; text-align: left; font-weight: 600;
      transition: all 0.2s;
    }
    .form-select-premium:hover { border-color: #cbd5e1; }

    .dropdown-menu-premium {
      border-radius: 14px !important; padding: 0.5rem !important; min-width: 200px;
      margin-top: 0.5rem !important; border: 1px solid #f1f5f9 !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05) !important;
    }
    .dropdown-item {
      border-radius: 10px !important; padding: 0.65rem 1rem !important;
      color: #475569 !important; font-size: 0.85rem !important;
      font-weight: 600 !important; cursor: pointer; transition: all 0.2s;
    }
    .dropdown-item:hover { background-color: var(--primary-color, #1e293b) !important; color: #ffffff !important; }

    .btn-system-action {
      background: #1e293b; color: #ffffff; border: none; padding: 0 1.5rem;
      height: 44px; border-radius: 14px; font-weight: 700; font-size: 0.85rem;
      display: inline-flex; align-items: center; justify-content: center;
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap;
    }
    .btn-system-action:hover { background: #0f172a; transform: translateY(-1.5px); box-shadow: 0 8px 15px -3px rgba(15, 23, 42, 0.2); }
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

  onSearchChange() {
    this.searchQueryChange.emit(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchQueryChange.emit('');
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
      case 'INACTIVE': return '#f43f5e';
      default: return '#94a3b8';
    }
  }
}

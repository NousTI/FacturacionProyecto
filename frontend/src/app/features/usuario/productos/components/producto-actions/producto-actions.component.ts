import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-producto-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="actions-box-lux">
      <div class="row align-items-center g-3">
        <!-- BUSCADOR -->
        <div class="col-12 col-lg-6">
          <div class="search-input-wrapper">
            <i class="bi bi-search search-icon"></i>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onSearchChange()"
              placeholder="Buscar por código, nombre o descripción..." 
              class="search-input-lux"
            >
          </div>
        </div>

        <!-- FILTROS Y ACCIÓN -->
        <div class="col-12 col-lg-6">
          <div class="d-flex gap-2 justify-content-lg-end align-items-center">
            
            <!-- FILTRO TIPO -->
            <div class="dropdown">
              <button class="btn-filter-lux" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-box-fill me-2"></i>
                {{ filters.tipo === 'ALL' ? 'Todos los Tipos' : (filters.tipo === 'PRODUCTO' ? 'Productos' : 'Servicios') }}
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-premium-lux border-0 p-2">
                <li><a class="dropdown-item" (click)="setTipoFilter('ALL')">Todos los Tipos</a></li>
                <li><a class="dropdown-item" (click)="setTipoFilter('PRODUCTO')">Productos</a></li>
                <li><a class="dropdown-item" (click)="setTipoFilter('SERVICIO')">Servicios</a></li>
              </ul>
            </div>

            <!-- FILTRO ESTADO -->
            <div class="dropdown">
              <button class="btn-filter-lux" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-toggle-on me-2"></i>
                {{ filters.estado === 'ALL' ? 'Todo Estado' : (filters.estado === 'ACTIVO' ? 'Activos' : 'Inactivos') }}
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-premium-lux border-0 p-2">
                <li><a class="dropdown-item" (click)="setEstadoFilter('ALL')">Todo Estado</a></li>
                <li><a class="dropdown-item" (click)="setEstadoFilter('ACTIVO')">Activos</a></li>
                <li><a class="dropdown-item" (click)="setEstadoFilter('INACTIVO')">Inactivos</a></li>
              </ul>
            </div>

            <button
              *hasPermission="'PRODUCTOS_CREAR'"
              (click)="onCreate.emit()"
              class="btn-create-lux"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Nuevo Item</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .actions-box-lux {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      padding: 1rem 1.5rem;
      margin-bottom: 2rem;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 1.25rem;
      color: #94a3b8;
      font-size: 1rem;
      pointer-events: none;
    }

    .search-input-lux {
      width: 100%;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      padding: 0.7rem 1rem 0.7rem 3rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: #1e293b;
      transition: all 0.2s;
    }

    .search-input-lux:focus {
      background: white;
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
      outline: none;
    }

    .btn-filter-lux {
      background: white;
      border: 1px solid #f1f5f9;
      padding: 0.7rem 1.25rem;
      border-radius: 14px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #64748b;
      display: flex;
      align-items: center;
      transition: all 0.2s;
    }

    .btn-filter-lux:hover {
      background: #f8fafc;
      color: #161d35;
      border-color: #cbd5e1;
    }

    .btn-create-lux {
      background: #161d35;
      color: white;
      border: none;
      padding: 0.7rem 1.5rem;
      border-radius: 14px;
      font-size: 0.85rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-create-lux:hover {
      background: #232d4b;
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3);
    }

    .dropdown-menu {
      border-radius: 16px;
      padding: 0.5rem;
      min-width: 200px;
    }

    .dropdown-item {
      padding: 0.7rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
    }

    .dropdown-item:hover {
      background: #f8fafc;
      color: #161d35;
    }

    .shadow-premium-lux {
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.15);
    }
  `]
})
export class ProductoActionsComponent {
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filters = {
    tipo: 'ALL',
    estado: 'ALL'
  };

  onSearchChange() {
    this.searchQueryChange.emit(this.searchQuery);
  }

  setTipoFilter(tipo: string) {
    this.filters.tipo = tipo;
    this.emitFilterChange();
  }

  setEstadoFilter(estado: string) {
    this.filters.estado = estado;
    this.emitFilterChange();
  }

  emitFilterChange() {
    this.onFilterChangeEmit.emit(this.filters);
  }
}

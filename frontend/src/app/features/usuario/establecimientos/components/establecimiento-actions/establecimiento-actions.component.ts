import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-establecimiento-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          <!-- Búsqueda Principal -->
          <div class="col-lg-7">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange()"
                placeholder="Q Buscar por Código, Nombre o Dirección..." 
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

          <!-- Filtro Estado -->
          <div class="col-lg-3">
            <div class="dropdown">
              <button 
                class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <span>{{ getEstadoLabel() }}</span>
              </button>
              <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                <li><a class="dropdown-item" (click)="setEstado('ALL')">Todos los Estados</a></li>
                <li><a class="dropdown-item" (click)="setEstado('ACTIVO')">Activos</a></li>
                <li><a class="dropdown-item" (click)="setEstado('INACTIVO')">Inactivos</a></li>
              </ul>
            </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-2 text-lg-end">
            <button 
              *hasPermission="'ESTABLECIMIENTO_GESTIONAR'"
              (click)="onCreate.emit()"
              class="btn-system-action w-100"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Nuevo Establecimiento</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 1.5rem;
    }
    .actions-bar-container {
      background: transparent;
      border: none;
    }
    .search-box-premium {
      position: relative;
      width: 100%;
    }
    .search-box-premium i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 1rem;
    }
    .form-control-premium-search {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0 2.5rem 0 2.75rem;
      height: 42px;
      font-size: 0.9rem;
      color: #0f172a;
      transition: all 0.2s;
      width: 100%;
      font-weight: 500;
    }
    .form-control-premium-search:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1);
      outline: none;
    }
    .btn-clear-search-premium {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: #f1f5f9;
      border: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-size: 0.75rem;
      transition: all 0.2s;
    }
    .btn-clear-search-premium:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .form-select-premium {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0 1rem;
      height: 42px;
      font-size: 0.9rem;
      color: #475569;
      font-weight: 600;
      width: 100%;
      text-align: left;
      transition: all 0.2s;
    }
    .form-select-premium:hover { border-color: #cbd5e1; }
    .form-select-premium::after { margin-left: auto; }

    .dropdown-menu-premium {
      border-radius: 12px;
      padding: 0.5rem;
      margin-top: 0.5rem !important;
    }
    .dropdown-item {
      border-radius: 8px;
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
    }
    .dropdown-item:hover {
      background: #f8fafc;
      color: var(--primary-color);
    }

    .btn-system-action {
      background: #0f172a;
      color: white;
      border: none;
      height: 42px;
      border-radius: 12px;
      padding: 0 1.25rem;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-system-action:hover {
      background: #1f2937;
      transform: translateY(-1px);
    }
  `]
})
export class EstablecimientoActionsComponent {
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChange = new EventEmitter<{ estado: string }>();
  @Output() onCreate = new EventEmitter<void>();

  estadoFilter: string = 'ALL';

  onSearchChange() {
    this.searchQueryChange.emit(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchQueryChange.emit('');
  }

  setEstado(estado: string) {
    this.estadoFilter = estado;
    this.onFilterChange.emit({ estado: this.estadoFilter });
  }

  getEstadoLabel(): string {
    const labels: any = {
      'ALL': 'Todos los Estados',
      'ACTIVO': 'Activos',
      'INACTIVO': 'Inactivos'
    };
    return labels[this.estadoFilter] || 'Estado';
  }
}

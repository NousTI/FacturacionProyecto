import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-puntos-emision-actions',
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
                placeholder="Q Buscar por Código o Nombre..." 
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
              *hasPermission="'PUNTO_EMISION_GESTIONAR'"
              (click)="onCreate.emit()"
              class="btn-system-action w-100"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Nuevo Punto</span>
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
      font-size: var(--text-md);
      color: #0f172a;
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium-search:focus {
      border-color: #cbd5e1;
      outline: none;
      box-shadow: none;
    }
    .btn-clear-search-premium {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .form-select-premium {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0 1rem;
      height: 42px;
      font-size: var(--text-base);
      color: #475569;
      width: 100%;
      cursor: pointer;
      text-align: left;
    }
    .form-select-premium:focus {
      border-color: #cbd5e1;
      outline: none;
    }
    .dropdown-menu-premium {
      border-radius: 12px !important;
      padding: 0.5rem !important;
      min-width: 100%;
      margin-top: 0.5rem !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      padding: 0.6rem 1rem !important;
      color: #475569 !important;
      font-size: var(--text-base) !important;
      font-weight: 500 !important;
      cursor: pointer;
      transition: all 0.2s;
    }
    .dropdown-item:hover {
      background-color: var(--primary-color, #161d35) !important;
      color: #ffffff !important;
    }
    .btn-system-action {
      background: #111827;
      color: #ffffff;
      border: none;
      padding: 0 1rem;
      height: 42px;
      border-radius: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: var(--text-base);
      white-space: nowrap;
    }
    .btn-system-action:hover {
      background: #1f2937;
      transform: translateY(-1px);
    }
  `]
})
export class PuntosEmisionActionsComponent {
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

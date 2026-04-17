import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-vendedor-plan-actions',
    standalone: true,
    imports: [CommonModule, FormsModule],
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="filters-row">
          <!-- Búsqueda Principal -->
          <div class="filter-item">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="searchQueryChange.emit($event)"
                placeholder="Buscar planes por nombre o descripción..."
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Estado Filter (ACTIVO/INACTIVO) -->
          <div class="filter-item">
            <div class="dropdown w-100">
              <button
                class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span class="text-truncate">{{ getEstadoLabel() }}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-premium w-100">
                <li><a class="dropdown-item" (click)="setFilterEstado('ALL')">Todos los Estados</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" (click)="setFilterEstado('ACTIVO')">Activos</a></li>
                <li><a class="dropdown-item" (click)="setFilterEstado('INACTIVO')">Inactivos</a></li>
              </ul>
            </div>
          </div>

          <!-- Público Filter (VISIBLE/OCULTO) -->
          <div class="filter-item">
            <div class="dropdown w-100">
              <button
                class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span class="text-truncate">{{ getPublicoLabel() }}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-premium w-100">
                <li><a class="dropdown-item" (click)="setFilterPublico('ALL')">Todos</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" (click)="setFilterPublico('VISIBLE')">Públicos</a></li>
                <li><a class="dropdown-item" (click)="setFilterPublico('OCULTO')">Ocultos</a></li>
              </ul>
            </div>
          </div>

          <!-- Categoría Filter -->
          <div class="filter-item">
            <div class="dropdown w-100">
              <button
                class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <span class="text-truncate">{{ getCategoriaLabel() }}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-premium w-100">
                <li><a class="dropdown-item" (click)="setFilterCategoria('ALL')">Todas las Categorías</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" (click)="setFilterCategoria('BASICO')">Básico</a></li>
                <li><a class="dropdown-item" (click)="setFilterCategoria('PROFESIONAL')">Profesional</a></li>
                <li><a class="dropdown-item" (click)="setFilterCategoria('ENTERPRISE')">Enterprise</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }
    .actions-bar-container {
      background: transparent;
      border: none;
      padding: 0;
      width: 100%;
    }
    .filters-row {
      display: flex;
      gap: 1rem;
      width: 100%;
      align-items: center;
    }
    .filter-item {
      flex: 1;
      min-width: 0;
    }
    .form-control-premium-search {
      width: 100%; height: 48px; border-radius: 12px;
      padding: 0 1rem 0 2.75rem; background: #ffffff;
      border: 1px solid var(--border-color); color: var(--text-main);
      font-size: var(--text-md); transition: all 0.2s;
    }
    .form-control-premium-search:focus {
      outline: none; border-color: var(--status-info);
      box-shadow: 0 0 0 4px var(--status-info-bg);
    }
    .form-select-premium {
      width: 100%; height: 48px; border-radius: 12px;
      padding: 0 1.25rem; background: #ffffff;
      border: 1px solid var(--border-color); color: var(--text-main);
      font-weight: 600; font-size: var(--text-md); transition: all 0.2s;
      box-shadow: none !important;
    }
    .form-select-premium:focus {
      outline: none; border-color: var(--status-info);
      box-shadow: 0 0 0 4px var(--status-info-bg) !important;
    }
    .dropdown-menu-premium {
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 1050 !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      padding: 0.6rem 1rem !important;
      font-weight: 500; color: var(--text-main);
    }
    .dropdown-item:hover {
      background: var(--status-info-bg) !important;
      color: var(--status-info-text) !important;
    }
    
    .search-box-premium { position: relative; }
    .search-box-premium i {
      position: absolute; top: 50%; left: 1.1rem;
      transform: translateY(-50%); color: var(--text-muted);
      font-size: 1.1rem; transition: all 0.2s;
    }
    .form-control-premium-search:focus + i { color: var(--status-info); }
  `]
})
export class VendedorPlanActionsComponent {
  @Input() searchQuery: string = '';
  @Input() filterEstado: string = 'ALL';
  @Input() filterPublico: string = 'ALL';
  @Input() filterCategoria: string = 'ALL';

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() filterEstadoChange = new EventEmitter<string>();
  @Output() filterPublicoChange = new EventEmitter<string>();
  @Output() filterCategoriaChange = new EventEmitter<string>();

  setFilterEstado(estado: string) {
    this.filterEstado = estado;
    this.filterEstadoChange.emit(estado);
  }

  setFilterPublico(publico: string) {
    this.filterPublico = publico;
    this.filterPublicoChange.emit(publico);
  }

  setFilterCategoria(categoria: string) {
    this.filterCategoria = categoria;
    this.filterCategoriaChange.emit(categoria);
  }

  getEstadoLabel(): string {
    const labels: any = {
      'ALL': 'Estados',
      'ACTIVO': 'Activos',
      'INACTIVO': 'Inactivos'
    };
    return labels[this.filterEstado] || 'Estado';
  }

  getPublicoLabel(): string {
    const labels: any = {
      'ALL': 'Visibilidad',
      'VISIBLE': 'Públicos',
      'OCULTO': 'Ocultos'
    };
    return labels[this.filterPublico] || 'Público';
  }

  getCategoriaLabel(): string {
    const labels: any = {
      'ALL': 'Categorías',
      'BASICO': 'Básico',
      'PROFESIONAL': 'Profesional',
      'ENTERPRISE': 'Enterprise'
    };
    return labels[this.filterCategoria] || 'Categoría';
  }
}

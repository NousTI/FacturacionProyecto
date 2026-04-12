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
        <div class="row align-items-center g-3">
          <!-- Búsqueda Principal -->
          <div class="col-lg-3">
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
          <div class="col-lg-2">
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
          <div class="col-lg-2">
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
          <div class="col-lg-3">
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

          <!-- Botón Nuevo Plan (Opcional) -->
          <div class="col-lg-2">
            <!-- Reservado para futuro -->
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
      padding: 0 1rem 0 2.75rem;
      height: 42px;
      font-size: var(--text-md, 0.95rem);
      color: #0f172a;
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium-search:focus {
      border-color: #cbd5e1;
      outline: none;
      box-shadow: none;
    }
    .form-select-premium {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0 1rem;
      height: 42px;
      font-size: var(--text-base, 0.85rem);
      color: #0f172a;
      width: 100%;
      cursor: pointer;
      text-align: left;
      font-weight: 500;
      transition: all 0.2s;
    }
    .form-select-premium:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }
    .form-select-premium:focus {
      border-color: #cbd5e1;
      outline: none;
    }
    .form-select-premium[aria-expanded="true"] {
      background: #f8fafc;
      border-color: #cbd5e1;
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
      font-size: var(--text-base, 0.85rem) !important;
      font-weight: 500 !important;
      cursor: pointer;
      transition: all 0.2s;
    }
    .dropdown-item:hover {
      background-color: var(--primary-color, #161d35) !important;
      color: #ffffff !important;
    }
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

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../../core/directives/has-permission.directive';
import { SRI_IVA_TARIFAS } from '../../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-producto-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          <!-- BUSCADOR -->
          <div class="col-12 col-lg-3">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange()"
                placeholder="Buscar producto..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- FILTROS -->
          <div class="col-12 col-lg-7">
            <div class="row g-2">
              <!-- TIPO -->
              <div class="col-md-4">
                <div class="dropdown">
                  <button class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" type="button" data-bs-toggle="dropdown">
                    <span>{{ filters.tipo === 'ALL' ? 'Todos los Tipos' : (filters.tipo === 'PRODUCTO' ? 'Productos' : 'Servicios') }}</span>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-premium border-0 shadow-sm">
                    <li><a class="dropdown-item" (click)="setTipoFilter('ALL')">Todos los Tipos</a></li>
                    <li><a class="dropdown-item" (click)="setTipoFilter('PRODUCTO')">Productos</a></li>
                    <li><a class="dropdown-item" (click)="setTipoFilter('SERVICIO')">Servicios</a></li>
                  </ul>
                </div>
              </div>

              <!-- ESTADO -->
              <div class="col-md-4">
                <div class="dropdown">
                  <button class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" type="button" data-bs-toggle="dropdown">
                    <span>{{ filters.estado === 'ALL' ? 'Todo Estado' : (filters.estado === 'ACTIVO' ? 'Activos' : 'Inactivos') }}</span>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-premium border-0 shadow-sm">
                    <li><a class="dropdown-item" (click)="setEstadoFilter('ALL')">Todo Estado</a></li>
                    <li><a class="dropdown-item" (click)="setEstadoFilter('ACTIVO')">Activos</a></li>
                    <li><a class="dropdown-item" (click)="setEstadoFilter('INACTIVO')">Inactivos</a></li>
                  </ul>
                </div>
              </div>

              <!-- IVA -->
              <div class="col-md-4">
                <div class="dropdown">
                  <button class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" type="button" data-bs-toggle="dropdown">
                    <span>{{ getIvaLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-premium border-0 shadow-sm">
                    <li><a class="dropdown-item" (click)="setIvaFilter('ALL')">Todo IVA</a></li>
                    <li *ngFor="let iva of ivaOptions">
                      <a class="dropdown-item" (click)="setIvaFilter(iva.code)">{{ iva.label }}</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- ACCIÓN -->
          <div class="col-12 col-lg-2 text-lg-end">
            <button
              *hasPermission="'PRODUCTOS_CREAR'"
              (click)="onCreate.emit()"
              class="btn-system-action w-100"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Nuevo Item</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 0;
      font-family: var(--font-main);
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
      padding: 0 1rem 0 2.75rem;
      height: 42px;
      font-size: var(--text-base);
      color: #0f172a;
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium-search:focus {
      border-color: var(--primary-color);
      outline: none;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
    }
    .form-select-premium {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0 1rem;
      height: 42px;
      font-size: var(--text-sm);
      font-weight: 600;
      color: #475569;
      width: 100%;
      cursor: pointer;
      text-align: left;
    }
    .form-select-premium:focus {
      border-color: var(--primary-color);
      outline: none;
    }
    .dropdown-menu-premium {
      border-radius: 12px !important;
      padding: 0.5rem !important;
      min-width: 100%;
      margin-top: 0.5rem !important;
      max-height: 300px;
      overflow-y: auto;
      box-shadow: 0 15px 35px rgba(22, 29, 53, 0.15) !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      padding: 0.6rem 1rem !important;
      color: #475569 !important;
      font-size: var(--text-sm) !important;
      font-weight: 600 !important;
      cursor: pointer;
      transition: all 0.2s;
    }
    .dropdown-item:hover {
      background-color: var(--primary-color) !important;
      color: #ffffff !important;
    }
    .btn-system-action {
      background: var(--primary-color);
      color: #ffffff;
      border: none;
      padding: 0 1.5rem;
      height: 42px;
      border-radius: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: var(--text-base);
    }
    .btn-system-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3);
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
    estado: 'ALL',
    tipo_iva: 'ALL'
  };

  ivaOptions = SRI_IVA_TARIFAS;

  getIvaLabel(): string {
    if (this.filters.tipo_iva === 'ALL') return 'Todo IVA';
    const match = this.ivaOptions.find(i => i.code === this.filters.tipo_iva);
    return match ? match.label : 'IVA';
  }

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

  setIvaFilter(tipo_iva: string) {
    this.filters.tipo_iva = tipo_iva;
    this.emitFilterChange();
  }

  emitFilterChange() {
    this.onFilterChangeEmit.emit(this.filters);
  }
}

import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clientes-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          <!-- Búsqueda Principal -->
          <div class="col-lg-5">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange($event)"
                placeholder="Q Buscar por Nombre, Email o Empresa..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtros Rápidos -->
          <div class="col-lg-5">
            <div class="row g-2">
              <div class="col-md-6">
                <div class="dropdown">
                  <button 
                    class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <span>{{ getEmpresaLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setFilter('empresa', 'ALL')">Todas las Empresas</a></li>
                    <li *ngFor="let emp of empresas">
                      <a class="dropdown-item" (click)="setFilter('empresa', emp)">{{ emp }}</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="col-md-6">
                <div class="dropdown">
                  <button 
                    class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <span>{{ getOrigenLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setFilter('origen', 'ALL')">Todos los Orígenes</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('origen', 'SUPERADMIN')">Superadmin</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('origen', 'VENDEDOR')">Vendedores</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('origen', 'SISTEMA')">Sistema (Auto-registro)</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-2 text-lg-end">
            <button 
              (click)="onCreate.emit()"
              class="btn-system-action w-100"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Nuevo Cliente</span>
            </button>
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
      color: var(--text-muted);
      font-size: 1rem;
    }
    .form-control-premium-search {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0 1rem 0 2.75rem;
      height: 42px;
      font-size: var(--text-md);
      color: var(--text-main);
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium-search:focus {
      border-color: var(--primary-color);
      outline: none;
      box-shadow: none;
    }
    .form-select-premium {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0 1rem;
      height: 42px;
      font-size: var(--text-base);
      color: var(--text-muted);
      width: 100%;
      cursor: pointer;
      text-align: left;
    }
    .form-select-premium:focus {
      border-color: var(--primary-color);
      outline: none;
    }
    .dropdown-menu-premium {
      background: var(--bg-main) !important;
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1) !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      min-width: 100%;
      margin-top: 0.5rem !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      padding: 0.6rem 1rem !important;
      color: var(--text-muted) !important;
      font-size: var(--text-base) !important;
      font-weight: 500 !important;
      cursor: pointer;
      transition: all 0.2s;
    }
    .dropdown-item:hover {
      background-color: var(--status-neutral-bg) !important;
      color: var(--text-main) !important;
    }
    .btn-system-action {
      background: var(--primary-color);
      color: #ffffff;
      border: none;
      padding: 0 1.5rem;
      height: 42px;
      border-radius: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: var(--text-base);
    }
    .btn-system-action:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
  `]
})
export class ClientesActionsComponent {
  @Input() searchQuery: string = '';
  @Input() empresas: string[] = [];

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filters = {
    empresa: 'ALL',
    origen: 'ALL'
  };

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  onFilterChange() {
    this.onFilterChangeEmit.emit(this.filters);
  }

  setFilter(key: string, value: any) {
    (this.filters as any)[key] = value;
    this.onFilterChange();
  }

  getEmpresaLabel(): string {
    return this.filters.empresa === 'ALL' ? 'Todas las Empresas' : this.filters.empresa;
  }

  getOrigenLabel(): string {
    const labels: any = {
      'ALL': 'Todos los Orígenes',
      'SUPERADMIN': 'Superadmin',
      'VENDEDOR': 'Vendedores',
      'SISTEMA': 'Sistema'
    };
    return labels[this.filters.origen] || 'Origen';
  }
}

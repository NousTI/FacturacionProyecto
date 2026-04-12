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

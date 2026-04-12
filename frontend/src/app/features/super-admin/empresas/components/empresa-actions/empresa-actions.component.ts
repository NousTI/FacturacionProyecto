import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-empresa-actions',
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
                placeholder="Q Buscar por Nombre, Cédula o RUC" 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtros Rápidos -->
          <div class="col-lg-5">
            <div class="row g-2">
              <div class="col-md-4">
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
                    <li><a class="dropdown-item" (click)="setFilter('estado', 'ALL')">Todos los Estados</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('estado', 'ACTIVO')">Activos</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('estado', 'INACTIVO')">Inactivos</a></li>
                  </ul>
                </div>
              </div>
              <div class="col-md-4">
                <div class="dropdown">
                  <button 
                    class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <span>{{ getPlanLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setFilter('plan', 'ALL')">Todos los Planes</a></li>
                    <li *ngFor="let plan of planes">
                      <a class="dropdown-item" (click)="setFilter('plan', plan.id)">{{ plan.nombre }}</a>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="col-md-4">
                <div class="dropdown">
                  <button 
                    class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <span>{{ getVendedorLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setFilter('vendedor', 'ALL')">Cualquier Vendedor</a></li>
                    <li *ngFor="let v of vendedores">
                      <a class="dropdown-item" (click)="setFilter('vendedor', v.id)">{{ v.nombre }}</a>
                    </li>
                    <li><a class="dropdown-item" (click)="setFilter('vendedor', 'NONE')">Sin Vendedor</a></li>
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
              <span>Nueva Empresa</span>
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
    /* Estilos dropdown personalizados */
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
      background: #1f2937;
      transform: translateY(-1px);
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EmpresaActionsComponent {
  @Input() searchQuery: string = '';
  @Input() planes: any[] = [];
  @Input() vendedores: any[] = [];

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filters = {
    estado: 'ALL',
    plan: 'ALL',
    vendedor: 'ALL'
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

  getEstadoLabel(): string {
    const labels: any = {
      'ALL': 'Todos los Estados',
      'ACTIVO': 'Activos',
      'INACTIVO': 'Inactivos'
    };
    return labels[this.filters.estado] || 'Estado';
  }

  getPlanLabel(): string {
    if (this.filters.plan === 'ALL') return 'Todos los Planes';
    const plan = this.planes.find(p => p.id == this.filters.plan);
    return plan ? plan.nombre : 'Plan';
  }

  getVendedorLabel(): string {
    if (this.filters.vendedor === 'ALL') return 'Cualquier Vendedor';
    if (this.filters.vendedor === 'NONE') return 'Sin Vendedor';
    const v = this.vendedores.find(vendor => vendor.id == this.filters.vendedor);
    return v ? v.nombre : 'Vendedor';
  }
}

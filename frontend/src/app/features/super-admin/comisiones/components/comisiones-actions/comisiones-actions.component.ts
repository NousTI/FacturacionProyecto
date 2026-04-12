import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-comisiones-actions',
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
                placeholder="Q Buscar por vendedor o concepto..."
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
                    <span>{{ getEstadoLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setFilter('estado', 'ALL')">Todos los Estados</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('estado', 'PENDIENTE')">Pendientes</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('estado', 'APROBADA')">Aprobadas</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('estado', 'PAGADA')">Pagadas</a></li>
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
                    <span>{{ getPeriodoLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setFilter('periodo', 'ALL')">Todos los Periodos</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('periodo', 'HOY')">Hoy</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('periodo', 'SEMANA')">Esta Semana</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('periodo', 'MES')">Este Mes</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-2 text-lg-end">
            <button
              (click)="onAction.emit()"
              class="btn-system-action w-100"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Nueva Comisión</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ComisionesActionsComponent {
  @Input() searchQuery: string = '';

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onAction = new EventEmitter<void>();

  filters = {
    estado: 'ALL',
    periodo: 'ALL'
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
      'PENDIENTE': 'Pendientes',
      'APROBADA': 'Aprobadas',
      'PAGADA': 'Pagadas'
    };
    return labels[this.filters.estado] || 'Estado';
  }

  getPeriodoLabel(): string {
    const labels: any = {
      'ALL': 'Todos los Periodos',
      'HOY': 'Hoy',
      'SEMANA': 'Esta Semana',
      'MES': 'Este Mes'
    };
    return labels[this.filters.periodo] || 'Periodo';
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-plan-actions',
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
                placeholder="Q Buscar por nombre o descripción..."
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
                    <span>{{ getPublicoLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setFilter('publico', 'ALL')">Todos</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('publico', true)">Visibles</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('publico', false)">Ocultos</a></li>
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
                    <span>{{ getEstadoLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setFilter('estado', 'ALL')">Todos los Estados</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('estado', 'ACTIVO')">Activos</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('estado', 'INACTIVO')">Inactivos</a></li>
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
              <span>Nuevo Plan</span>
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
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PlanActionsComponent {
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filters = {
    publico: 'ALL',
    estado: 'ALL'
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

  getPublicoLabel(): string {
    const labels: any = {
      'ALL': 'Todos',
      'true': 'Visibles',
      'false': 'Ocultos'
    };
    return labels[String(this.filters.publico)] || 'Público';
  }

  getEstadoLabel(): string {
    const labels: any = {
      'ALL': 'Todos los Estados',
      'ACTIVO': 'Activos',
      'INACTIVO': 'Inactivos'
    };
    return labels[(this.filters as any).estado] || 'Estado';
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-recurrente-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="recurrente-actions-container">
      <div class="row g-3 align-items-center">
        <!-- BUSCADOR -->
        <div class="col-12 col-lg-4">
          <div class="search-input-wrapper">
            <i class="bi bi-search"></i>
            <input 
              type="text" 
              class="search-input-lux" 
              placeholder="Buscar por cliente o concepto..." 
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
            >
          </div>
        </div>

        <!-- FILTROS -->
        <div class="col-12 col-lg-8">
          <div class="d-flex gap-2 justify-content-lg-end flex-wrap align-items-center">
            
            <!-- Filtro Estado -->
            <div class="dropdown" [class.show]="openDropdowns['estado']">
              <button class="btn-filter-lux" type="button" (click)="toggleDropdown('estado', $event)">
                <i class="bi bi-toggle-on"></i>
                {{ getEstadoLabel(filters.estado) }}
              </button>
              <ul class="dropdown-menu border-0 p-2 rounded-4" [class.show]="openDropdowns['estado']">
                <li><h6 class="dropdown-header text-uppercase fs-xs fw-bold text-muted mb-2" style="font-size: 0.65rem;">Estado</h6></li>
                <li><a class="dropdown-item" [class.active]="filters.estado === 'ALL'" (click)="setFilter('estado', 'ALL')">Todos los Estados</a></li>
                <li><a class="dropdown-item" [class.active]="filters.estado === 'ACTIVO'" (click)="setFilter('estado', 'ACTIVO')">Activas</a></li>
                <li><a class="dropdown-item" [class.active]="filters.estado === 'INACTIVO'" (click)="setFilter('estado', 'INACTIVO')">Inactivas</a></li>
              </ul>
            </div>

            <!-- Filtro Frecuencia -->
            <div class="dropdown" [class.show]="openDropdowns['frecuencia']">
              <button class="btn-filter-lux" type="button" (click)="toggleDropdown('frecuencia', $event)">
                <i class="bi bi-calendar-range"></i>
                {{ getFrecuenciaLabel(filters.frecuencia) }}
              </button>
              <ul class="dropdown-menu border-0 p-2 rounded-4" [class.show]="openDropdowns['frecuencia']">
                <li><h6 class="dropdown-header text-uppercase fs-xs fw-bold text-muted mb-2" style="font-size: 0.65rem;">Frecuencia</h6></li>
                <li><a class="dropdown-item" [class.active]="filters.frecuencia === 'ALL'" (click)="setFilter('frecuencia', 'ALL')">Todas las Frecuencias</a></li>
                <li><a class="dropdown-item" [class.active]="filters.frecuencia === 'MENSUAL'" (click)="setFilter('frecuencia', 'MENSUAL')">Mensual</a></li>
                <li><a class="dropdown-item" [class.active]="filters.frecuencia === 'TRIMESTRAL'" (click)="setFilter('frecuencia', 'TRIMESTRAL')">Trimestral</a></li>
                <li><a class="dropdown-item" [class.active]="filters.frecuencia === 'ANUAL'" (click)="setFilter('frecuencia', 'ANUAL')">Anual</a></li>
              </ul>
            </div>

            <div class="ms-lg-2">
              <button
                class="btn-create-lux"
                [disabled]="disabledCreate"
                *hasPermission="'FACTURA_PROGRAMADA_CREAR'"
                (click)="!disabledCreate && onCreate.emit()">
                <i class="bi bi-plus-lg"></i>
                <span>Nueva Programación</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recurrente-actions-container {
      margin-bottom: 2rem;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input-wrapper i {
      position: absolute;
      left: 1rem;
      color: #94a3b8;
      font-size: 1.1rem;
    }

    .search-input-lux {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 0.75rem 1rem 0.75rem 2.8rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
      width: 100%;
      outline: none;
      transition: all 0.2s;
    }

    .search-input-lux:focus {
      border-color: #161d35;
      background: white;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }

    .btn-filter-lux {
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
      padding: 0.75rem 1.25rem;
      height: 44px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.825rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transition: all 0.2s;
    }

    .btn-filter-lux:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #161d35;
    }

    .btn-create-lux {
      background: #161d35;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      height: 44px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transition: all 0.2s;
    }

    .btn-create-lux:hover {
      background: #232d4b;
      transform: translateY(-1px);
    }

    .btn-create-lux:disabled {
      background: #cbd5e1;
      transform: none;
      cursor: not-allowed;
    }

    .dropdown-menu {
      z-index: 1000;
      min-width: 220px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08) !important;
    }

    .dropdown-item {
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
      padding: 0.7rem 1rem;
      border-radius: 10px;
      margin-bottom: 2px;
      cursor: pointer;
    }

    .dropdown-item:hover, .dropdown-item.active {
      background: #f8fafc;
      color: #161d35;
    }
  `]
})
export class RecurrenteActionsComponent {
  @Input() searchQuery: string = '';
  @Input() disabledCreate: boolean = false;
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChange = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filters = {
    estado: 'ALL',
    frecuencia: 'ALL'
  };

  openDropdowns: { [key: string]: boolean } = {};

  toggleDropdown(key: string, event: Event) {
    event.stopPropagation();
    const current = !!this.openDropdowns[key];
    this.openDropdowns = {};
    this.openDropdowns[key] = !current;
  }

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilter(type: 'estado' | 'frecuencia', value: string) {
    this.filters[type] = value;
    this.openDropdowns = {};
    this.onFilterChange.emit(this.filters);
  }

  getEstadoLabel(val: string): string {
    const map: any = { ALL: 'Todos los Estados', ACTIVO: 'Activas', INACTIVO: 'Inactivas' };
    return map[val] || val;
  }

  getFrecuenciaLabel(val: string): string {
    const map: any = { ALL: 'Todas las Frecuencias', MENSUAL: 'Mensual', TRIMESTRAL: 'Trimestral', ANUAL: 'Anual' };
    return map[val] || val;
  }
}

import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-establecimiento-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="actions-container">
      <!-- Campo de Búsqueda -->
      <div class="search-box">
        <i class="bi bi-search"></i>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (input)="onSearchChange()"
          placeholder="Buscar por código, nombre, dirección..."
          class="search-input"
        >
        <button
          *ngIf="searchQuery"
          (click)="clearSearch()"
          class="btn-clear-search"
          type="button"
        >
          <i class="bi bi-x-circle-fill"></i>
        </button>
      </div>

      <!-- Filtro Estado -->
      <select
        [(ngModel)]="estadoFilter"
        (change)="onEstadoFilterChange()"
        class="filter-select"
      >
        <option value="ALL">Todos</option>
        <option value="ACTIVO">🟢 Activos</option>
        <option value="INACTIVO">⚫ Inactivos</option>
      </select>

      <!-- Botón Crear -->
      <button
        (click)="onCreate.emit()"
        class="btn-create-premium"
        type="button"
      >
        <i class="bi bi-plus-lg"></i>
        <span>Crear Establecimiento</span>
      </button>
    </div>
  `,
  styles: [`
    .actions-container {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-box i {
      position: absolute;
      left: 1.25rem;
      color: #94a3b8;
      font-size: 1rem;
      z-index: 5;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1.25rem 0.75rem 2.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #ffffff;
      font-size: 0.9rem;
      color: #475569;
      font-weight: 600;
      transition: all 0.2s;
      font-family: inherit;
    }

    .search-input:focus {
      border-color: #161d35;
      outline: none;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
      background: #ffffff;
    }

    .search-input::placeholder {
      color: #cbd5e1;
    }

    .btn-clear-search {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.5rem;
      transition: all 0.2s;
      z-index: 6;
    }

    .btn-clear-search:hover {
      color: #161d35;
      transform: scale(1.1);
    }

    .filter-select {
      padding: 0.75rem 1.25rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #ffffff;
      color: #475569;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }

    .filter-select:focus {
      border-color: #161d35;
      outline: none;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }

    .filter-select:hover {
      border-color: #cbd5e1;
    }

    .btn-create-premium {
      background: #161d35;
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-family: inherit;
    }

    .btn-create-premium:hover {
      background: #232d4d;
      transform: translateY(-1px);
      box-shadow: 0 10px 25px -5px rgba(22, 29, 53, 0.15);
    }

    .btn-create-premium:active {
      transform: translateY(0);
    }

    .btn-create-premium i {
      font-size: 1.1rem;
    }

    @media (max-width: 1024px) {
      .actions-container {
        flex-direction: column;
      }

      .search-box {
        width: 100%;
      }

      .btn-create-premium {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 767px) {
      .actions-container {
        gap: 0.75rem;
      }

      .search-input,
      .filter-select,
      .btn-create-premium {
        font-size: 0.85rem;
        padding: 0.65rem 1rem;
      }

      .search-box i {
        left: 1rem;
      }

      .search-input {
        padding-left: 2.5rem;
      }
    }
  `]
})
export class EstablecimientoActionsComponent {
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

  onEstadoFilterChange() {
    this.onFilterChange.emit({ estado: this.estadoFilter });
  }
}

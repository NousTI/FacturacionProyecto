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
          <div class="col-lg-4">
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
            <select
              [(ngModel)]="filterEstado"
              (ngModelChange)="filterEstadoChange.emit($event)"
              class="form-select-premium"
              title="Filtrar por estado de activación"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>

          <!-- Público Filter (VISIBLE/OCULTO) -->
          <div class="col-lg-2">
            <select
              [(ngModel)]="filterPublico"
              (ngModelChange)="filterPublicoChange.emit($event)"
              class="form-select-premium"
              title="Filtrar por visibilidad pública"
            >
              <option value="ALL">Todos</option>
              <option value="VISIBLE">Públicos</option>
              <option value="OCULTO">Ocultos</option>
            </select>
          </div>

          <!-- Categoría Filter -->
          <div class="col-lg-2">
            <select
              [(ngModel)]="filterCategoria"
              (ngModelChange)="filterCategoriaChange.emit($event)"
              class="form-select-premium"
              title="Filtrar por categoría del plan"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="BASICO">Básico</option>
              <option value="PROFESIONAL">Profesional</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          <!-- Botón Nuevo Plan (Opcional) -->
          <div class="col-lg-2 text-end">
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
      color: #475569;
      width: 100%;
      cursor: pointer;
      text-align: left;
    }
    .form-select-premium:focus {
      border-color: #cbd5e1;
      outline: none;
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
}

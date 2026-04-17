import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-gastos-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          <!-- Búsqueda Principal -->
          <div class="col-lg-7">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange()"
                placeholder="Q Buscar por concepto, factura o proveedor..." 
                class="form-control-premium-search"
              >
              <button 
                *ngIf="searchQuery" 
                (click)="clearSearch()" 
                class="btn-clear-search-premium"
              >
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>

          <!-- Filtro Estado -->
          <div class="col-lg-3">
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
                <li><a class="dropdown-item" (click)="setEstado('')">Todos los Estados</a></li>
                <li><a class="dropdown-item" (click)="setEstado('pendiente')">Pendientes</a></li>
                <li><a class="dropdown-item" (click)="setEstado('pagado')">Pagados</a></li>
                <li><a class="dropdown-item" (click)="setEstado('vencido')">Vencidos</a></li>
              </ul>
            </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-2 text-lg-end">
            <button 
              *hasPermission="'GESTIONAR_GASTOS'"
              (click)="onCreate.emit()"
              class="btn-system-action w-100"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Nuevo Gasto</span>
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
    .search-box-premium { position: relative; width: 100%; }
    .search-box-premium i {
      position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
      color: var(--text-muted); font-size: 1rem;
    }
    .form-control-premium-search {
      background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px;
      padding: 0 2.5rem 0 2.75rem; height: 42px; font-size: 0.9rem; color: #0f172a;
      transition: all 0.2s; width: 100%;
    }
    .form-control-premium-search:focus {
      border-color: var(--primary-color); outline: none;
      box-shadow: 0 0 0 3px rgba(22, 29, 53, 0.06);
    }
    .btn-clear-search-premium {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      background: transparent; border: none; color: var(--text-muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }
    .form-select-premium {
      background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px;
      padding: 0 1rem; height: 42px; font-size: 0.9rem; color: #475569;
      width: 100%; cursor: pointer; text-align: left; font-weight: 600; transition: all 0.2s;
    }
    .form-select-premium:hover { border-color: var(--primary-color); }
    .form-select-premium:focus { border-color: var(--primary-color); outline: none; }
    .dropdown-menu-premium {
      border-radius: 12px !important; padding: 0.5rem !important;
      min-width: 100%; margin-top: 0.5rem !important;
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05) !important;
    }
    .dropdown-item {
      border-radius: 8px !important; padding: 0.6rem 1rem !important;
      color: #475569 !important; font-size: 0.9rem !important;
      font-weight: 500 !important; cursor: pointer; transition: all 0.2s;
    }
    .dropdown-item:hover { background-color: var(--primary-color) !important; color: #ffffff !important; }
    .btn-system-action {
      background: var(--primary-color); color: #ffffff; border: none;
      padding: 0 1rem; height: 42px; border-radius: 12px; font-weight: 600;
      display: inline-flex; align-items: center; justify-content: center;
      transition: all 0.2s; font-size: 0.9rem; white-space: nowrap;
    }
    .btn-system-action:hover { background: var(--primary-hover); transform: translateY(-1px); }
  `]
})
export class GastosActionsComponent {
  @Input() searchQuery: string = '';
  @Input() filterEstado: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() filterEstadoChange = new EventEmitter<string>();
  @Output() onCreate = new EventEmitter<void>();

  onSearchChange() {
    this.searchQueryChange.emit(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchQueryChange.emit('');
  }

  setEstado(estado: string) {
    this.filterEstado = estado;
    this.filterEstadoChange.emit(estado);
  }

  getEstadoLabel(): string {
    const labels: any = {
      '': 'Todos los Estados',
      'pendiente': 'Pendientes',
      'pagado': 'Pagados',
      'vencido': 'Vencidos'
    };
    return labels[this.filterEstado] || 'Estado';
  }
}

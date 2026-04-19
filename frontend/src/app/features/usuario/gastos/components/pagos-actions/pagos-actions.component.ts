import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';
import { SRI_FORMAS_PAGO } from '../../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-pagos-actions',
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
                placeholder="Q Buscar por referencia o información del gasto..." 
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

          <!-- Filtro Método de Pago -->
          <div class="col-lg-3">
            <div class="dropdown">
              <button 
                class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <span class="text-truncate">{{ getMetodoLabel() }}</span>
              </button>
              <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium dropdown-menu-end" style="max-height: 350px; overflow-y: auto;">
                <li><a class="dropdown-item" (click)="setMetodo('')">Todos los Métodos</a></li>
                <li><hr class="dropdown-divider"></li>
                <li *ngFor="let m of metodosPago">
                  <a class="dropdown-item" (click)="setMetodo(m.codigo)">{{ m.label }}</a>
                </li>
              </ul>
            </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-2 text-lg-end" *hasPermission="'GESTIONAR_PAGOS'">
            <button 
              (click)="onCreate.emit()"
              class="btn-system-action w-100"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Registrar Pago</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .actions-bar-container { background: transparent; border: none; padding: 0; }

    .search-box-premium { position: relative; width: 100%; }
    .search-box-premium i {
      position: absolute; left: 1.1rem; top: 50%; transform: translateY(-50%);
      color: var(--text-muted); font-size: 1rem;
    }
    .form-control-premium-search {
      background: #ffffff; border: 1px solid var(--border-color); border-radius: 14px;
      padding: 0 2.5rem 0 2.85rem; height: 44px; font-size: 0.95rem; color: var(--primary-color);
      transition: all 0.2s; width: 100%; font-weight: 500;
    }
    .form-control-premium-search:focus { border-color: var(--primary-color); outline: none; box-shadow: 0 0 0 3px rgba(22, 29, 53, 0.06); }
    .btn-clear-search-premium {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      background: transparent; border: none; color: var(--text-muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }

    .form-select-premium {
      background: #ffffff; border: 1px solid var(--border-color); border-radius: 14px;
      padding: 0 1.25rem; height: 44px; font-size: 0.9rem; color: #475569;
      width: 100%; cursor: pointer; text-align: left; font-weight: 600;
      transition: all 0.2s;
    }
    .form-select-premium:hover { border-color: var(--primary-color); }

    .dropdown-menu-premium {
      border-radius: 12px !important; padding: 0.5rem !important; min-width: 250px;
      margin-top: 0.5rem !important; border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05) !important;
    }
    .dropdown-item {
      border-radius: 8px !important; padding: 0.65rem 1rem !important;
      color: #475569 !important; font-size: 0.85rem !important;
      font-weight: 600 !important; cursor: pointer; transition: all 0.2s;
    }
    .dropdown-item:hover { background-color: var(--primary-color) !important; color: #ffffff !important; }

    .btn-system-action {
      background: var(--primary-color); color: #ffffff; border: none; padding: 0 1rem;
      height: 44px; border-radius: 14px; font-weight: 700; font-size: 0.85rem;
      display: inline-flex; align-items: center; justify-content: center;
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap;
    }
    .btn-system-action:hover { background: var(--primary-hover); transform: translateY(-1.5px); box-shadow: 0 8px 15px -3px rgba(22, 29, 53, 0.25); }
  `]
})
export class PagosActionsComponent {
  @Input() searchQuery: string = '';
  @Input() filterMetodo: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() filterMetodoChange = new EventEmitter<string>();
  @Output() onCreate = new EventEmitter<void>();

  metodosPago = SRI_FORMAS_PAGO;

  onSearchChange() {
    this.searchQueryChange.emit(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchQueryChange.emit('');
  }

  setMetodo(codigo: string) {
    this.filterMetodo = codigo;
    this.filterMetodoChange.emit(codigo);
  }

  getMetodoLabel(): string {
    if (!this.filterMetodo) return 'Todos los Métodos';
    const method = this.metodosPago.find(m => m.codigo === this.filterMetodo);
    return method ? method.label : 'Método';
  }
}


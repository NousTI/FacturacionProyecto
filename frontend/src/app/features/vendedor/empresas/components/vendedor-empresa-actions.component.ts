import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vendedor-empresa-actions',
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
                placeholder="Buscar por Razón Social o RUC..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtro Estado -->
          <div class="col-lg-2">
             <select 
               class="form-select-premium" 
               [(ngModel)]="filterEstado"
               (ngModelChange)="onFilterChange()"
             >
                <option value="ALL">Estados</option>
                <option value="ACTIVO">Activas</option>
                <option value="INACTIVO">Inactivas</option>
             </select>
          </div>

          <!-- Filtro Planes (Premium Dropdown) -->
          <div class="col-lg-2">
            <div class="dropdown">
              <button 
                class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <span class="text-truncate">{{ getPlanLabel() }}</span>
              </button>
              <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium w-100">
                <li><a class="dropdown-item" (click)="setFilterPlan('ALL')">Todos los Planes</a></li>
                <li><hr class="dropdown-divider"></li>
                <li *ngFor="let plan of planes">
                  <a class="dropdown-item" (click)="setFilterPlan(plan.id)">{{ plan.nombre }}</a>
                </li>
              </ul>
            </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-3 text-lg-end">
            <div class="d-inline-block w-100" [title]="!canCreate ? 'No tienes permiso para crear empresas' : ''">
              <button 
                [disabled]="!canCreate"
                [class.restricted-btn]="!canCreate"
                (click)="onCreate.emit()"
                class="btn-system-action w-100"
              >
                <i class="bi" [ngClass]="canCreate ? 'bi-plus-lg' : 'bi-lock-fill'"></i>
                <span class="ms-2">{{ canCreate ? 'Nueva Empresa' : 'Creación Restringida' }}</span>
              </button>
            </div>
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
    .form-control-premium-search {
      width: 100%; height: 48px; border-radius: 12px;
      padding: 0 1rem 0 2.75rem; background: #ffffff;
      border: 1px solid var(--border-color); color: var(--text-main);
      font-size: var(--text-md); transition: all 0.2s;
    }
    .form-control-premium-search:focus {
      outline: none; border-color: var(--status-info);
      box-shadow: 0 0 0 4px var(--status-info-bg);
    }
    .form-select-premium {
      width: 100%; height: 48px; border-radius: 12px;
      padding: 0 1rem; background: #ffffff;
      border: 1px solid var(--border-color); color: var(--text-main);
      font-weight: 600; font-size: var(--text-md); transition: all 0.2s;
    }
    .form-select-premium:focus {
      outline: none; border-color: var(--status-info);
      box-shadow: 0 0 0 4px var(--status-info-bg);
    }
    .restricted-btn {
      background: var(--status-neutral) !important;
      cursor: not-allowed !important;
      box-shadow: none !important;
      opacity: 0.6;
    }
    .restricted-btn:hover {
      transform: none !important;
    }
    .btn-system-action {
      height: 48px;
    }
  `]
})
export class VendedorEmpresaActionsComponent {
  @Input() searchQuery: string = '';
  @Input() filterEstado: string = 'ALL';
  @Input() filterPlan: string = 'ALL';
  @Input() planes: any[] = [];
  @Input() canCreate: boolean = false;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() filterEstadoChange = new EventEmitter<string>();
  @Output() filterPlanChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<void>();
  @Output() onCreate = new EventEmitter<void>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  onFilterChange() {
    this.filterEstadoChange.emit(this.filterEstado);
    this.filterPlanChange.emit(this.filterPlan);
    this.onFilterChangeEmit.emit();
  }

  setFilterPlan(id: string) {
    this.filterPlan = id;
    this.onFilterChange();
  }

  getPlanLabel(): string {
    if (this.filterPlan === 'ALL') return 'Todos los Planes';
    const plan = this.planes.find(p => p.id.toString() === this.filterPlan.toString());
    return plan ? plan.nombre : 'Plan';
  }
}

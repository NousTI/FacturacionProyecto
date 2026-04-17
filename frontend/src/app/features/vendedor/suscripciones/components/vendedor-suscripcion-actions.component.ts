import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vendedor-suscripcion-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          <!-- Búsqueda -->
          <div class="col-lg-4">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange($event)"
                placeholder="Empresa o Plan..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtro Status -->
          <div class="col-lg-2">
            <div class="dropdown">
              <button class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <span class="text-truncate">{{ getStatusLabel() }}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-premium w-100">
                <li><a class="dropdown-item" (click)="setFilter('ALL')">Todos los Estados</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" (click)="setFilter('ACTIVA')">Activas</a></li>
                <li><a class="dropdown-item" (click)="setFilter('VENCIDA')">Vencidas</a></li>
              </ul>
            </div>
          </div>

          <!-- Filtro Pago -->
          <div class="col-lg-2">
            <div class="dropdown">
              <button class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <span class="text-truncate">{{ getPagoLabel() }}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-premium w-100">
                <li><a class="dropdown-item" (click)="setFilterPago('ALL')">Todos los Pagos</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" (click)="setFilterPago('PAGADO')">Pagados</a></li>
                <li><a class="dropdown-item" (click)="setFilterPago('PENDIENTE')">Pendientes</a></li>
                <li><a class="dropdown-item" (click)="setFilterPago('ANULADO')">Anulados</a></li>
              </ul>
            </div>
          </div>

          <!-- Filtro Planes -->
          <div class="col-lg-2">
            <div class="dropdown">
              <button class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <span class="text-truncate">{{ getPlanLabel() }}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-premium w-100">
                <li><a class="dropdown-item" (click)="setFilterPlan('ALL')">Todos los Planes</a></li>
                <li><hr class="dropdown-divider"></li>
                <li *ngFor="let plan of planes">
                  <a class="dropdown-item" (click)="setFilterPlan(plan.id)">{{ plan.nombre }}</a>
                </li>
              </ul>
            </div>
          </div>

          <!-- Botón Historial -->
          <div class="col-lg-2 text-lg-end">
            <button (click)="onOpenHistory.emit()" class="btn-system-action w-100 px-2" title="Historial General">
              <i class="bi bi-clock-history me-1"></i>
              <span class="d-none d-xl-inline">Historial</span>
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
      padding: 0 1.25rem; background: #ffffff;
      border: 1px solid var(--border-color); color: var(--text-main);
      font-weight: 600; font-size: var(--text-md); transition: all 0.2s;
      box-shadow: none !important;
    }
    .form-select-premium:focus {
      outline: none; border-color: var(--status-info);
      box-shadow: 0 0 0 4px var(--status-info-bg) !important;
    }
    .dropdown-menu-premium {
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      padding: 0.6rem 1rem !important;
      font-weight: 500; color: var(--text-main);
    }
    .dropdown-item:hover {
      background: var(--status-info-bg) !important;
      color: var(--status-info-text) !important;
    }
    .btn-system-action {
      height: 48px;
    }
    
    .search-box-premium { position: relative; }
    .search-box-premium i {
      position: absolute; top: 50%; left: 1.1rem;
      transform: translateY(-50%); color: var(--text-muted);
      font-size: 1.1rem; transition: all 0.2s;
    }
    .form-control-premium-search:focus + i { color: var(--status-info); }
  `]
})
export class VendedorSuscripcionActionsComponent {
  @Input() searchQuery: string = '';
  @Input() filterStatus: string = 'ALL';
  @Input() filterPago: string = 'ALL';
  @Input() filterPlan: string = 'ALL';
  @Input() planes: any[] = [];

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() filterStatusChange = new EventEmitter<string>();
  @Output() filterPagoChange = new EventEmitter<string>();
  @Output() filterPlanChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<void>();
  @Output() onOpenHistory = new EventEmitter<void>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilter(status: string) {
    this.filterStatus = status;
    this.filterStatusChange.emit(status);
    this.onFilterChangeEmit.emit();
  }

  getStatusLabel(): string {
    const labels: any = {
      'ALL': 'Todos los Estados',
      'ACTIVA': 'Activas',
      'VENCIDA': 'Vencidas',
      'SUSPENDIDA': 'Suspendidas',
      'CANCELADA': 'Canceladas'
    };
    return labels[this.filterStatus] || 'Estado';
  }

  onFilterChange() {
    this.filterPagoChange.emit(this.filterPago);
    this.filterPlanChange.emit(this.filterPlan);
    this.onFilterChangeEmit.emit();
  }

  getPlanLabel(): string {
    if (this.filterPlan === 'ALL') return 'Todos los Planes';
    const plan = this.planes.find(p => p.id.toString() === this.filterPlan.toString());
    return plan ? plan.nombre : 'Plan';
  }

  getPagoLabel(): string {
    const labels: any = {
      'ALL': 'Todos los Pagos',
      'PAGADO': 'Pagados',
      'PENDIENTE': 'Pendientes',
      'ANULADO': 'Anulados'
    };
    return labels[this.filterPago] || 'Estado Pago';
  }

  setFilterPago(val: string) {
    this.filterPago = val;
    this.onFilterChange();
  }

  setFilterPlan(val: string) {
    this.filterPlan = val;
    this.onFilterChange();
  }
}

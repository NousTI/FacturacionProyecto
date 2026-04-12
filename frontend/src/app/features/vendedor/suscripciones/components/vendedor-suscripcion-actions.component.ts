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
    .filter-tabs-premium {
      background: #f1f5f9;
      padding: 0.35rem;
      border-radius: 12px;
      display: inline-flex;
      width: 100%;
    }
    .btn-tab-premium {
      flex: 1;
      border: none;
      background: transparent;
      color: #64748b;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-tab-premium.active {
      background: white;
      color: #161d35;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .btn-tab-premium:hover:not(.active) {
      background: rgba(255, 255, 255, 0.5);
      color: #161d35;
    }
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

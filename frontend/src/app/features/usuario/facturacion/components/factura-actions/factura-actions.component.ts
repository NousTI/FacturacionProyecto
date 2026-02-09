import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-factura-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="actions-container mb-4">
      <!-- SRI WARNING -->
      <div *ngIf="sriError" class="alert alert-warning d-flex align-items-center mb-3 shadow-sm border-warning rounded-3" role="alert">
        <i class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2 fs-4"></i>
        <div>
          <strong>Atención:</strong> {{ sriError }}
        </div>
      </div>

      <div class="row g-3 align-items-center">
        <!-- BUSCADOR -->
        <div class="col-12 col-md-5 col-lg-4">
          <div class="search-box-premium">
            <i class="bi bi-search text-muted"></i>
            <input 
              type="text" 
              class="form-control" 
              placeholder="Buscar por número, cliente o CI/RUC..." 
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
            >
          </div>
        </div>

        <!-- FILTROS -->
        <div class="col-12 col-md-7 col-lg-8">
          <div class="d-flex gap-2 justify-content-md-end overflow-auto pb-1 pb-md-0">
            <!-- Filtro Estado Emisión -->
            <div class="dropdown">
              <button class="btn btn-filter-premium dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-funnel"></i>
                {{ getFilterLabel(filters.estado) }}
              </button>
              <ul class="dropdown-menu shadow-premium border-0 p-2 rounded-4">
                <li><h6 class="dropdown-header text-uppercase fs-xs fw-bold text-muted">Estado Emisión</h6></li>
                <li><a class="dropdown-item rounded-3" [class.active]="filters.estado === 'ALL'" (click)="setFilter('estado', 'ALL')">Todos</a></li>
                <li><a class="dropdown-item rounded-3" [class.active]="filters.estado === 'BORRADOR'" (click)="setFilter('estado', 'BORRADOR')">Borrador</a></li>
                <li><a class="dropdown-item rounded-3" [class.active]="filters.estado === 'EMITIDA'" (click)="setFilter('estado', 'EMITIDA')">Emitida</a></li>
                <li><a class="dropdown-item rounded-3" [class.active]="filters.estado === 'ANULADA'" (click)="setFilter('estado', 'ANULADA')">Anulada</a></li>
              </ul>
            </div>

            <!-- Filtro Estado Pago -->
             <div class="dropdown">
              <button class="btn btn-filter-premium dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-currency-dollar"></i>
                {{ getPaymentFilterLabel(filters.estado_pago) }}
              </button>
              <ul class="dropdown-menu shadow-premium border-0 p-2 rounded-4">
                 <li><h6 class="dropdown-header text-uppercase fs-xs fw-bold text-muted">Estado Pago</h6></li>
                <li><a class="dropdown-item rounded-3" [class.active]="filters.estado_pago === 'ALL'" (click)="setFilter('estado_pago', 'ALL')">Todos</a></li>
                <li><a class="dropdown-item rounded-3" [class.active]="filters.estado_pago === 'PENDIENTE'" (click)="setFilter('estado_pago', 'PENDIENTE')">Pendiente</a></li>
                <li><a class="dropdown-item rounded-3" [class.active]="filters.estado_pago === 'PAGADO'" (click)="setFilter('estado_pago', 'PAGADO')">Pagado</a></li>
                <li><a class="dropdown-item rounded-3" [class.active]="filters.estado_pago === 'PARCIAL'" (click)="setFilter('estado_pago', 'PARCIAL')">Parcial</a></li>
              </ul>
            </div>

            <!-- BOTÓN NUEVA FACTURA -->
            <button 
              *appHasPermission="'FACTURAS_CREAR'"
              class="btn btn-primary-premium d-flex align-items-center gap-2" 
              [disabled]="!!sriError"
              [title]="sriError || 'Crear nueva factura'"
              (click)="!sriError && onCreate.emit()">
              <i class="bi bi-plus-lg"></i>
              <span class="d-none d-sm-inline">Nueva Factura</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-box-premium {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.6rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.2s;
    }
    .search-box-premium:focus-within {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    .search-box-premium input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.9rem;
      color: #1e293b;
    }
    .search-box-premium input::placeholder { color: #94a3b8; }

    .btn-filter-premium {
      background: white;
      border: 1px solid #e2e8f0;
      color: #64748b;
      padding: 0.6rem 1rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .btn-filter-premium:hover, .btn-filter-premium.show {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #1e293b;
    }

    .btn-primary-premium {
      background: #161d35;
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(22, 29, 53, 0.15);
    }
    .btn-primary-premium:hover {
      background: #252f50;
      transform: translateY(-1px);
    }
    .btn-primary-premium:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      box-shadow: none;
    }

    .dropdown-menu { z-index: 1050; }
    .dropdown-item.active {
      background-color: #f1f5f9;
      color: #161d35;
      font-weight: 700;
    }
    .fs-xs { font-size: 0.75rem; }
    
    .alert-warning {
        background-color: #fffbeb;
        border-color: #fcd34d;
        color: #92400e;
    }
  `]
})
export class FacturaActionsComponent {
  @Input() searchQuery: string = '';
  @Input() sriError: string | null = null;
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filters = {
    estado: 'ALL',
    estado_pago: 'ALL'
  };

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilter(type: 'estado' | 'estado_pago', value: string) {
    this.filters[type] = value;
    this.onFilterChangeEmit.emit(this.filters);
  }

  getFilterLabel(value: string): string {
    const map: Record<string, string> = {
      'ALL': 'Todos los Estados',
      'BORRADOR': 'Borradores',
      'EMITIDA': 'Emitidas',
      'ANULADA': 'Anuladas'
    };
    return map[value] || value;
  }

  getPaymentFilterLabel(value: string): string {
    const map: Record<string, string> = {
      'ALL': 'Todos los Pagos',
      'PENDIENTE': 'Pendientes',
      'PAGADO': 'Pagados',
      'PARCIAL': 'Parciales'
    };
    return map[value] || value;
  }
}

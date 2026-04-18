import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-factura-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="actions-container">
      <!-- SRI WARNING -->
      <div *ngIf="sriError" class="alert-sri-lux mb-4">
        <i class="bi bi-shield-lock-fill"></i>
        <span>{{ sriError }}</span>
      </div>

      <div class="actions-box-lux">
        <div class="row g-3 align-items-center">
          <!-- BUSCADOR -->
          <div class="col-12 col-md-4">
            <div class="search-input-wrapper">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                class="search-input-lux" 
                placeholder="Buscar comprobantes..." 
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
              >
            </div>
          </div>

          <!-- FILTROS -->
          <div class="col-12 col-md-8">
            <div class="d-flex gap-2 justify-content-md-end flex-wrap">
              <!-- Filtro Estado Emisión -->
              <div class="dropdown" [class.show]="openDropdowns['estado']">
                <button class="btn-filter-lux" type="button" (click)="toggleDropdown('estado', $event)">
                  <i class="bi bi-funnel"></i>
                  {{ getFilterLabel(filters.estado) }}
                </button>
                <ul class="dropdown-menu border-0 p-2 rounded-4" [class.show]="openDropdowns['estado']">
                  <li><h6 class="dropdown-header text-uppercase fs-xs fw-bold text-muted mb-2" style="font-size: 0.65rem;">Estado Emisión</h6></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado === 'ALL'" (click)="setFilter('estado', 'ALL')">Todos los Estados</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado === 'BORRADOR'" (click)="setFilter('estado', 'BORRADOR')">Borrador</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado === 'EN_PROCESO'" (click)="setFilter('estado', 'EN_PROCESO')">En Proceso</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado === 'AUTORIZADA'" (click)="setFilter('estado', 'AUTORIZADA')">Autorizada</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado === 'DEVUELTA'" (click)="setFilter('estado', 'DEVUELTA')">Devuelta</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado === 'NO_AUTORIZADA'" (click)="setFilter('estado', 'NO_AUTORIZADA')">No Autorizada</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado === 'ERROR_TECNICO'" (click)="setFilter('estado', 'ERROR_TECNICO')">Error Técnico</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado === 'ANULADA'" (click)="setFilter('estado', 'ANULADA')">Anulada</a></li>
                </ul>
              </div>

              <!-- Filtro Estado Pago -->
               <div class="dropdown" [class.show]="openDropdowns['pago']">
                <button class="btn-filter-lux" type="button" (click)="toggleDropdown('pago', $event)">
                  <i class="bi bi-credit-card"></i>
                  {{ getPaymentFilterLabel(filters.estado_pago) }}
                </button>
                <ul class="dropdown-menu border-0 p-2 rounded-4" [class.show]="openDropdowns['pago']">
                  <li><h6 class="dropdown-header text-uppercase fs-xs fw-bold text-muted mb-2" style="font-size: 0.65rem;">Estado Pago</h6></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado_pago === 'ALL'" (click)="setFilter('estado_pago', 'ALL')">Todos los Pagos</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado_pago === 'PENDIENTE'" (click)="setFilter('estado_pago', 'PENDIENTE')">Pendiente</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado_pago === 'PAGADO'" (click)="setFilter('estado_pago', 'PAGADO')">Pagado</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.estado_pago === 'PARCIAL'" (click)="setFilter('estado_pago', 'PARCIAL')">Parcial</a></li>
                </ul>
              </div>

              <!-- Filtro Método de Pago -->
              <div class="dropdown" [class.show]="openDropdowns['forma']">
                <button class="btn-filter-lux" type="button" (click)="toggleDropdown('forma', $event)">
                  <i class="bi bi-wallet2"></i>
                  {{ getFormaPagoFilterLabel(filters.forma_pago) }}
                </button>
                <ul class="dropdown-menu border-0 p-2 rounded-4" [class.show]="openDropdowns['forma']">
                  <li><h6 class="dropdown-header text-uppercase fs-xs fw-bold text-muted mb-2" style="font-size: 0.65rem;">Método de Pago</h6></li>
                  <li><a class="dropdown-item" [class.active]="filters.forma_pago === 'ALL'" (click)="setFilter('forma_pago', 'ALL')">Todos los Métodos</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.forma_pago === '01'" (click)="setFilter('forma_pago', '01')">Efectivo</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.forma_pago === '15'" (click)="setFilter('forma_pago', '15')">Compensación Deudas</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.forma_pago === '16'" (click)="setFilter('forma_pago', '16')">Tarjeta Débito</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.forma_pago === '17'" (click)="setFilter('forma_pago', '17')">Dinero Electrónico</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.forma_pago === '18'" (click)="setFilter('forma_pago', '18')">Tarjeta Prepago</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.forma_pago === '19'" (click)="setFilter('forma_pago', '19')">Tarjeta Crédito</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.forma_pago === '20'" (click)="setFilter('forma_pago', '20')">Transf./Otros</a></li>
                  <li><a class="dropdown-item" [class.active]="filters.forma_pago === '21'" (click)="setFilter('forma_pago', '21')">Endoso Títulos</a></li>
                </ul>
              </div>

              <div class="ms-md-2">
                <button
                  class="btn-create-lux"
                  [disabled]="!!sriError"
                  *hasPermission="'FACTURAS_CREAR'"
                  (click)="!sriError && onCreate.emit()">
                  <i class="bi bi-plus-lg"></i>
                  <span>Nueva Factura</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .actions-box-lux {
      background: transparent;
      border: none;
      padding: 0;
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
      border-radius: 14px;
      font-weight: 700;
      font-size: 0.825rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transition: all 0.2s;
    }

    .btn-filter-lux:hover, .btn-filter-lux.active {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #161d35;
    }

    .btn-create-lux {
      background: #161d35;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
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
      z-index: 10000; 
      min-width: 220px;
      border: 1px solid #e2e8f0 !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08) !important;
      padding: 0.5rem;
    }

    .dropdown-item {
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
      padding: 0.7rem 1rem;
      border-radius: 10px;
      margin-bottom: 2px;
    }

    .dropdown-item:hover {
      background: #f8fafc;
      color: #161d35;
    }

    .dropdown-item.active {
      background: #f1f5f9;
      color: #161d35;
    }

    .alert-sri-lux {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 14px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      color: #92400e;
      font-size: 0.875rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.75rem;
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
    estado_pago: 'ALL',
    forma_pago: 'ALL'
  };

  openDropdowns: { [key: string]: boolean } = {};

  toggleDropdown(key: string, event: Event) {
    event.stopPropagation();
    const current = !!this.openDropdowns[key];
    this.openDropdowns = {}; // close others
    this.openDropdowns[key] = !current;
  }

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilter(type: 'estado' | 'estado_pago' | 'forma_pago', value: string) {
    this.filters[type] = value;
    this.openDropdowns = {}; // close on select
    this.onFilterChangeEmit.emit(this.filters);
  }

  getFilterLabel(value: string): string {
    const map: Record<string, string> = {
      'ALL': 'Todos los Estados',
      'BORRADOR': 'Borradores',
      'EN_PROCESO': 'En Proceso',
      'AUTORIZADA': 'Autorizadas',
      'DEVUELTA': 'Devueltas',
      'NO_AUTORIZADA': 'No Autorizadas',
      'ANULADA': 'Anuladas',
      'ERROR_TECNICO': 'Error Técnico'
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

  getFormaPagoFilterLabel(codigo: string): string {
    const map: Record<string, string> = {
      'ALL': 'Todos los Métodos',
      '01': 'Efectivo',
      '15': 'Compensación',
      '16': 'T. Débito',
      '17': 'Dinero Electr.',
      '18': 'T. Prepago',
      '19': 'T. Crédito',
      '20': 'Otros Sist. Fin.',
      '21': 'Endoso Títulos'
    };
    return map[codigo] || 'Método Pago';
  }
}

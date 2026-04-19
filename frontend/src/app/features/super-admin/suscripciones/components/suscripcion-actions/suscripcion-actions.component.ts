import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-suscripcion-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          <!-- Búsqueda Principal -->
          <div class="col-lg-4 col-md-6">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange($event)"
                placeholder="Q Buscar empresa..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Mantenimiento y Filtros -->
          <div class="col-lg-8 col-md-6 text-lg-end">
            <div class="d-flex gap-2 justify-content-lg-end flex-wrap align-items-center">
                <!-- Botón Mantenimiento -->
                <button 
                  class="btn-action-premium" 
                  [disabled]="isRunningMaintenance"
                  (click)="onMaintenance.emit()"
                >
                  <i class="bi" [class.bi-gear-fill]="!isRunningMaintenance" [class.spinner-border]="isRunningMaintenance" [class.spinner-border-sm]="isRunningMaintenance"></i>
                  <span class="ms-2 d-none d-md-inline">{{ isRunningMaintenance ? 'Procesando...' : 'Mantenimiento' }}</span>
                </button>

                <div class="vr mx-1 opacity-25 d-none d-lg-block"></div>

                <!-- Botón Historial -->
                <button class="btn-filter-lux" (click)="onOpenHistory.emit()">
                   <i class="bi bi-clock-history me-1"></i> Historial
                </button>

                <div class="vr mx-1 opacity-25 d-none d-lg-block"></div>

                <!-- Filtro Estado Suscripción (Dropdown) -->
                <div class="dropdown" style="min-width: 180px;">
                  <button 
                    class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <span>{{ getEstadoLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setFilter('ALL')">Todas las Suscripciones</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('ACTIVA')">Suscripciones Activas</a></li>
                    <li><a class="dropdown-item" (click)="setFilter('VENCIDA')">Suscripciones Vencidas</a></li>
                  </ul>
                </div>

                <!-- Filtro Estado Pago (Dropdown) -->
                <div class="dropdown" style="min-width: 160px;">
                  <button 
                    class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <span>{{ getPagoLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setPagoFilter('ALL')">Cualquier Pago</a></li>
                    <li><a class="dropdown-item" (click)="setPagoFilter('PAGADO')">Pagados</a></li>
                    <li><a class="dropdown-item" (click)="setPagoFilter('PENDIENTE')">Pendientes</a></li>
                    <li><a class="dropdown-item" (click)="setPagoFilter('ATRASADO')">Atrasados</a></li>
                  </ul>
                </div>
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
    .search-box-premium {
      position: relative;
      width: 100%;
    }
    .search-box-premium i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 1rem;
    }
    .form-control-premium-search {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0 1rem 0 2.75rem;
      height: 42px;
      font-size: var(--text-md);
      color: var(--text-main);
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium-search:focus {
      border-color: var(--primary-color);
      outline: none;
      box-shadow: none;
    }
    
    .btn-filter-lux {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 0 1.25rem;
      height: 42px;
      border-radius: 12px;
      font-weight: 700;
      font-size: var(--text-base);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transition: all 0.2s;
    }
    .btn-filter-lux:hover {
      background: var(--status-neutral-bg);
      border-color: var(--primary-color);
      color: var(--text-main);
    }

    .form-select-premium {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0 1rem;
      height: 42px;
      font-size: var(--text-base);
      color: var(--text-muted);
      width: 100%;
      cursor: pointer;
      text-align: left;
    }
    .form-select-premium:focus {
      border-color: var(--primary-color);
      outline: none;
      box-shadow: none;
    }

    .dropdown-menu-premium {
      background: var(--bg-main) !important;
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1) !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      min-width: 100%;
      margin-top: 0.5rem !important;
    }
    .dropdown-item {
      border-radius: 8px !important;
      padding: 0.6rem 1rem !important;
      color: var(--text-muted) !important;
      font-size: var(--text-base) !important;
      font-weight: 500 !important;
      cursor: pointer;
      transition: all 0.2s;
    }
    .dropdown-item:hover {
      background-color: var(--status-neutral-bg) !important;
      color: var(--text-main) !important;
    }

    .btn-action-premium {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      color: var(--primary-color);
      padding: 0 1.25rem;
      height: 42px;
      border-radius: 12px;
      font-weight: 700;
      font-size: var(--text-base);
      display: flex;
      align-items: center;
      transition: all 0.2s;
    }
    .btn-action-premium:hover:not(:disabled) {
      background: var(--status-neutral-bg);
      transform: translateY(-1px);
      border-color: var(--primary-color);
    }
    .btn-action-premium:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class SuscripcionActionsComponent {
  @Input() searchQuery: string = '';
  @Input() filterStatus: string = 'ALL';
  @Input() filterPagoStatus: string = 'ALL';
  @Input() isRunningMaintenance: boolean = false;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() filterStatusChange = new EventEmitter<string>();
  @Output() filterPagoStatusChange = new EventEmitter<string>();
  @Output() onMaintenance = new EventEmitter<void>();
  @Output() onOpenHistory = new EventEmitter<void>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilter(status: string) {
    this.filterStatusChange.emit(status);
  }

  setPagoFilter(status: string) {
    this.filterPagoStatusChange.emit(status);
  }

  getEstadoLabel(): string {
    const labels: any = {
      'ALL': 'Todas las Suscripciones',
      'ACTIVA': 'Suscripciones Activas',
      'VENCIDA': 'Suscripciones Vencidas'
    };
    return labels[this.filterStatus] || 'Estado';
  }

  getPagoLabel(): string {
    const labels: any = {
      'ALL': 'Cualquier Pago',
      'PAGADO': 'Pagados',
      'PENDIENTE': 'Pendientes',
      'ATRASADO': 'Atrasados'
    };
    return labels[this.filterPagoStatus] || 'Estado Pago';
  }
}

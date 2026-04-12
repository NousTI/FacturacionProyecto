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

                <!-- Botón Historial (Solicitado dejarlo como está por defecto) -->
                <button class="btn-filter-lux" (click)="onOpenHistory.emit()">
                   <i class="bi bi-clock-history me-1"></i> Historial
                </button>

                <div class="vr mx-1 opacity-25 d-none d-lg-block"></div>

                <!-- Filtros Rápidos -->
                <div class="d-flex gap-1">
                    <button 
                      class="btn-filter-lux" 
                      [class.active]="filterStatus === 'ALL'" 
                      (click)="setFilter('ALL')"
                    >
                        Todos
                    </button>
                    <button 
                      class="btn-filter-lux" 
                      [class.active]="filterStatus === 'ACTIVA'" 
                      (click)="setFilter('ACTIVA')"
                    >
                        Activas
                    </button>
                    <button 
                      class="btn-filter-lux" 
                      [class.active]="filterStatus === 'VENCIDA'" 
                      (click)="setFilter('VENCIDA')"
                    >
                        Vencidas
                    </button>
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
    .btn-filter-lux {
      background: #ffffff;
      border: 1px solid var(--border-color, #e2e8f0);
      color: #64748b;
      padding: 0 1.25rem;
      height: 42px;
      border-radius: 12px;
      font-weight: 700;
      font-size: var(--text-base, 0.85rem);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transition: all 0.2s;
    }
    .btn-filter-lux:hover, .btn-filter-lux.active {
      background: #ffffff;
      border-color: #cbd5e1;
      color: var(--primary-color, #161d35);
    }
    .btn-filter-lux.active {
      border-color: var(--primary-color, #161d35);
      background-color: #f8fafc;
    }

    .btn-action-premium {
      background: #f8fafc;
      border: 1px solid var(--border-color, #e2e8f0);
      color: var(--primary-color, #161d35);
      padding: 0 1.25rem;
      height: 42px;
      border-radius: 12px;
      font-weight: 700;
      font-size: var(--text-base, 0.85rem);
      display: flex;
      align-items: center;
      transition: all 0.2s;
    }
    .btn-action-premium:hover:not(:disabled) {
      background: #f1f5f9;
      transform: translateY(-1px);
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
  @Input() isRunningMaintenance: boolean = false;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() filterStatusChange = new EventEmitter<string>();
  @Output() onMaintenance = new EventEmitter<void>();
  @Output() onOpenHistory = new EventEmitter<void>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilter(status: string) {
    this.filterStatusChange.emit(status);
  }
}

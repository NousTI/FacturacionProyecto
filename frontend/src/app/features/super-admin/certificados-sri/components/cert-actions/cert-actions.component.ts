import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cert-actions',
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
                placeholder="Q Buscar por Empresa o RUC..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtros Rápidos -->
          <div class="col-lg-7 text-lg-end">
            <div class="d-flex gap-2 justify-content-lg-end flex-wrap align-items-center">
                <button 
                  class="btn-filter-lux" 
                  [class.active]="filterStatus === 'ALL'" 
                  (click)="setFilter('ALL')"
                >
                    Todos
                </button>
                <button 
                  class="btn-filter-lux" 
                  [class.active]="filterStatus === 'ACTIVE'" 
                  (click)="setFilter('ACTIVE')"
                >
                    <i class="bi bi-check-circle-fill text-success" *ngIf="filterStatus === 'ACTIVE'"></i>
                    Vigentes
                </button>
                <button 
                  class="btn-filter-lux" 
                  [class.active]="filterStatus === 'EXPIRING'" 
                  (click)="setFilter('EXPIRING')"
                >
                    <i class="bi bi-exclamation-triangle-fill text-warning" *ngIf="filterStatus === 'EXPIRING'"></i>
                    Por Vencer
                </button>
                <button 
                  class="btn-filter-lux" 
                  [class.active]="filterStatus === 'EXPIRED'" 
                  (click)="setFilter('EXPIRED')"
                >
                    <i class="bi bi-x-circle-fill text-danger" *ngIf="filterStatus === 'EXPIRED'"></i>
                    Vencidos
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
    .text-success { color: var(--status-success) !important; }
    .text-warning { color: var(--status-warning) !important; }
    .text-danger { color: var(--status-danger) !important; }
  `]
})
export class CertActionsComponent {
  @Input() searchQuery: string = '';
  @Input() filterStatus: string = 'ALL';

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() filterStatusChange = new EventEmitter<string>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilter(status: string) {
    this.filterStatusChange.emit(status);
  }
}

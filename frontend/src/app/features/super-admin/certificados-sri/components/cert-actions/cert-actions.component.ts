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
      color: var(--text-main);
    }
    .btn-filter-lux.active {
      border-color: var(--status-info);
      background-color: var(--status-info-bg);
      color: var(--status-info-text);
    }
    .form-control-premium-search {
      background: #ffffff;
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
      border-color: var(--status-info);
      box-shadow: 0 0 0 4px var(--status-info-bg);
      outline: none;
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

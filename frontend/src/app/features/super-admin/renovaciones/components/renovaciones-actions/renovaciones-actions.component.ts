import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-renovaciones-actions',
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

          <!-- Filtros -->
          <div class="col-lg-8 col-md-6 text-lg-end">
            <div class="d-flex gap-2 justify-content-lg-end flex-wrap align-items-center">
                <!-- Selector de Estado -->
                <div class="dropdown">
                  <button 
                    class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                    style="min-width: 180px;"
                  >
                    <span>{{ getStatusLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-lg dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setStatus('ALL')">Todos los Estados</a></li>
                    <li><a class="dropdown-item" (click)="setStatus('PENDIENTE')">Pendientes</a></li>
                    <li><a class="dropdown-item" (click)="setStatus('ACEPTADA')">Aceptadas</a></li>
                    <li><a class="dropdown-item" (click)="setStatus('RECHAZADA')">Rechazadas</a></li>
                  </ul>
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .actions-bar-container { background: transparent; border: none; }
    
    .form-select-premium {
      background: #ffffff; border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px; padding: 0 1rem; height: 42px;
      font-size: var(--text-base); color: #475569;
      width: 100%; cursor: pointer; text-align: left;
    }
    .form-select-premium:focus { border-color: var(--primary-color, #161d35); outline: none; }

    .dropdown-menu-premium {
      border-radius: 12px !important; padding: 0.5rem !important;
      min-width: 100%; margin-top: 0.5rem !important;
      background: #ffffff;
    }
    .dropdown-item {
      border-radius: 8px !important; padding: 0.6rem 1rem !important;
      color: #475569 !important; font-size: var(--text-base) !important;
      font-weight: 500 !important; cursor: pointer; transition: all 0.2s;
    }
    .dropdown-item:hover { background-color: var(--primary-color, #161d35) !important; color: #ffffff !important; }

    /* Standard Search Styling */
    .search-box-premium { position: relative; width: 100%; }
    .search-box-premium i {
      position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
      color: #94a3b8; font-size: 1rem;
    }
    .form-control-premium-search {
      height: 42px; padding: 0 16px 0 44px; border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0); background: #ffffff;
      font-weight: 500; font-size: 0.9rem; width: 100%; transition: all 0.2s;
    }
    .form-control-premium-search:focus {
      outline: none; border-color: var(--primary-color, #161d35);
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
  `]
})
export class RenovacionesActionsComponent {
  @Input() searchQuery: string = '';
  @Input() currentStatus: string = 'ALL';

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onStatusChange = new EventEmitter<string>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setStatus(status: string) {
    this.currentStatus = status;
    this.onStatusChange.emit(status);
  }

  getStatusLabel(): string {
    const labels: any = {
      'ALL': 'Todos los Estados',
      'PENDIENTE': 'Pendientes',
      'ACEPTADA': 'Aceptadas',
      'RECHAZADA': 'Rechazadas'
    };
    return labels[this.currentStatus] || 'Filtrar por Estado';
  }
}

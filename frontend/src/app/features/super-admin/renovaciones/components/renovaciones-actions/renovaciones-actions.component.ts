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

          <!-- Filtros y Refrescar -->
          <div class="col-lg-8 col-md-6 text-lg-end">
            <div class="d-flex gap-2 justify-content-lg-end flex-wrap align-items-center">
                <!-- Botón Refrescar -->
                <button 
                  class="btn-refresh-lux" 
                  (click)="onRefresh.emit()"
                  title="Actualizar datos"
                >
                  <i class="bi bi-arrow-clockwise"></i>
                </button>

                <div class="vr mx-1 opacity-25 d-none d-lg-block"></div>

                <!-- Toggle Historial -->
                <button 
                  class="btn-filter-lux" 
                  [class.active]="verHistorial" 
                  (click)="onToggleHistorial.emit()"
                >
                  <i class="bi" [ngClass]="verHistorial ? 'bi-journal-check' : 'bi-journal-text'"></i>
                  <span class="ms-2 d-none d-md-inline">{{ verHistorial ? 'Viendo Historial' : 'Ver Historial' }}</span>
                </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .actions-bar-container { background: transparent; border: none; }
    
    .btn-refresh-lux {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      background: #ffffff; border: 1px solid var(--border-color, #e2e8f0);
      color: #64748b; transition: all 0.2s;
    }
    .btn-refresh-lux:hover {
      background: #f8fafc; color: var(--primary-color, #161d35);
      transform: rotate(30deg);
    }

    .btn-filter-lux {
      background: #ffffff; border: 1px solid var(--border-color, #e2e8f0);
      color: #64748b; padding: 0 1.25rem; height: 42px; border-radius: 12px;
      font-weight: 700; font-size: 0.85rem; display: flex; align-items: center;
      transition: all 0.2s;
    }
    .btn-filter-lux:hover, .btn-filter-lux.active {
      background: #ffffff; border-color: #cbd5e1; color: var(--primary-color, #161d35);
    }
    .btn-filter-lux.active {
      border-color: var(--primary-color, #161d35);
      background-color: #f8fafc;
    }

    /* Standard Search Styling */
    .search-box-premium {
      position: relative; width: 100%;
    }
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
  @Input() verHistorial: boolean = false;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onToggleHistorial = new EventEmitter<void>();
  @Output() onRefresh = new EventEmitter<void>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }
}

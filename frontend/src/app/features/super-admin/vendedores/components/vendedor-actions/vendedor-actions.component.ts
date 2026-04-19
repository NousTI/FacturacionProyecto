import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vendedor-actions',
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          <!-- Búsqueda Principal -->
          <div class="col-lg-6">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="searchQueryChange.emit($event)"
                placeholder="Q Buscar por Nombre, Email o Documento..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtros Rápidos -->
          <div class="col-lg-3">
            <div class="dropdown">
              <button 
                class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <span>Estado: {{ getStatusLabel() }}</span>
              </button>
              <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                <li *ngFor="let tab of statusTabs">
                  <a class="dropdown-item" (click)="onTabChange.emit(tab.id)">{{ tab.label }}</a>
                </li>
              </ul>
            </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-3 text-lg-end">
            <button 
              (click)="onCreate.emit()"
              class="btn-system-action w-100"
            >
              <i class="bi bi-person-plus-fill me-2"></i>
              <span>Nuevo Vendedor</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 0;
    }
    .actions-bar-container {
      background: transparent;
      border: none;
      padding: 0;
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
      font-weight: 600;
    }
    .form-select-premium:focus {
      border-color: var(--primary-color);
      outline: none;
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
    .btn-system-action {
      background: var(--primary-color);
      color: #ffffff;
      border: none;
      padding: 0 1.5rem;
      height: 42px;
      border-radius: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: var(--text-base);
    }
    .btn-system-action:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
  `]
,
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VendedorActionsComponent {
  @Input() searchQuery: string = '';
  @Input() currentTab: string = 'ALL';
  @Input() statusTabs: any[] = [];
  
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onTabChange = new EventEmitter<string>();
  @Output() onCreate = new EventEmitter<void>();

  getStatusLabel(): string {
    const tab = this.statusTabs.find(t => t.id === this.currentTab);
    return tab ? tab.label : 'Todos';
  }
}

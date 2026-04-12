import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-clientes-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="actions-container">
      <div class="search-wrapper">
        <i class="bi bi-search"></i>
        <input 
          type="text" 
          [(ngModel)]="searchQuery" 
          (ngModelChange)="onSearchChange($event)"
          placeholder="Buscar por cliente, identificación o email..."
          class="search-input"
        >
      </div>

      <div class="buttons-group">
        <!-- FILTRO ESTADO -->
        <div class="dropdown">
          <button class="btn-filter" 
                  type="button" 
                  data-bs-toggle="dropdown"
                  data-bs-popper-config='{"strategy":"fixed"}'>
            <i class="bi bi-filter"></i>
            <span>{{ filters.estado === 'ALL' ? 'Todos' : (filters.estado === 'ACTIVO' ? 'Activos' : 'Inactivos') }}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" (click)="setFilter('ALL')">Todos los Estados</a></li>
            <li><a class="dropdown-item" (click)="setFilter('ACTIVO')">Activos</a></li>
            <li><a class="dropdown-item" (click)="setFilter('INACTIVO')">Inactivos</a></li>
          </ul>
        </div>

        <button 
          *hasPermission="'CLIENTES_EXPORTAR'"
          (click)="onExport.emit()"
          class="btn-icon"
          title="Exportar Clientes"
        >
          <i class="bi bi-download"></i>
          <span>Exportar</span>
        </button>

        <button 
          *hasPermission="'CLIENTES_CREAR'"
          (click)="onCreate.emit()"
          class="btn-primary"
        >
          <i class="bi bi-plus-lg"></i>
          <span>Nuevo Cliente</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .actions-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      background: transparent;
      padding: 0;
      border: none;
    }
    .search-wrapper {
      position: relative;
      flex: 1;
      max-width: 500px;
    }
    .search-wrapper i {
      position: absolute;
      left: 1.1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 1rem;
    }
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.8rem;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .search-input:focus {
      outline: none;
      background: white;
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }
    .buttons-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-filter, .btn-icon, .btn-primary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 0.7rem 1.1rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-filter {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-filter:hover {
      background: #e2e8f0;
    }
    .btn-icon {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-icon:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
    .btn-primary {
      background: #1e293b;
      color: white;
      padding: 0.7rem 1.3rem;
    }
    .btn-primary:hover {
      background: #0f172a;
      transform: translateY(-1px);
    }
    .dropdown-menu {
      border-radius: 12px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      padding: 0.5rem;
      margin-top: 0.5rem;
    }
    .dropdown-item {
      border-radius: 8px;
      padding: 0.6rem 1rem;
      font-weight: 600;
      font-size: 0.85rem;
      color: #475569;
      cursor: pointer;
    }
    .dropdown-item:hover {
      background: #f8fafc;
      color: #1e293b;
    }
    @media (max-width: 768px) {
      .actions-container {
        flex-direction: column;
        align-items: stretch;
      }
      .search-wrapper {
        max-width: 100%;
      }
    }
  `]
})
export class ClientesActionsComponent {
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();
  @Output() onExport = new EventEmitter<void>();

  filters = {
    estado: 'ALL'
  };

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilter(estado: string) {
    this.filters.estado = estado;
    this.onFilterChangeEmit.emit(this.filters);
  }
}

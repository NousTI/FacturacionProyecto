import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
    selector: 'app-cliente-actions',
    standalone: true,
    imports: [CommonModule, FormsModule, HasPermissionDirective],
    template: `
    <div class="filters-card mb-4">
      <div class="row g-3">
        <!-- BUSCADOR -->
        <div class="col-md-6">
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input 
              type="text" 
              class="form-control" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onSearchChange($event)"
              placeholder="Buscar por cliente, identificación o email..." 
            >
          </div>
        </div>

        <!-- FILTROS Y ACCIÓN -->
        <div class="col-md-6 d-flex gap-2 justify-content-end">
          
          <!-- FILTRO ESTADO -->
          <div class="dropdown">
            <button class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <i class="bi bi-filter me-1"></i>
              {{ filters.estado === 'ALL' ? 'Todos' : (filters.estado === 'ACTIVO' ? 'Activos' : 'Inactivos') }}
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow border-0 p-2">
              <li><a class="dropdown-item" (click)="setFilter('ALL')">Todos los Estados</a></li>
              <li><a class="dropdown-item" (click)="setFilter('ACTIVO')">Activos</a></li>
              <li><a class="dropdown-item" (click)="setFilter('INACTIVO')">Inactivos</a></li>
            </ul>
          </div>

          <button 
            *appHasPermission="'CLIENTES_EXPORTAR'"
            (click)="onExport.emit()"
            class="btn btn-light"
          >
            <i class="bi bi-download"></i>
          </button>

          <button 
            *appHasPermission="'CLIENTES_CREAR'"
            (click)="onCreate.emit()"
            class="btn btn-primary"
          >
            <i class="bi bi-plus-lg me-2"></i> Nuevo Cliente
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filters-card { background: white; border-radius: 16px; padding: 1.25rem; border: 1px solid #f1f5f9; }
    
    .search-box { position: relative; }
    .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-box .form-control { padding-left: 2.5rem; border-radius: 10px; border-color: #e2e8f0; font-size: 0.9rem; }
    
    .btn { border-radius: 10px; font-weight: 600; padding: 0.6rem 1rem; font-size: 0.9rem; }
    .btn-primary { background: #2563eb; border: none; }
    .btn-light { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; }
    .btn-light:hover { background: #f1f5f9; color: #1e293b; }

    .dropdown-menu { border-radius: 12px; font-size: 0.85rem; min-width: 180px; }
    .dropdown-item { border-radius: 8px; padding: 0.5rem 0.75rem; font-weight: 500; cursor: pointer; }
  `]
})
export class ClienteActionsComponent {
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

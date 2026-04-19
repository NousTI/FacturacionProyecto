import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../core/directives/has-permission.directive';

@Component({
  selector: 'app-productos-actions',
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
          placeholder="Buscar por código o nombre de producto..."
          class="search-input"
        >
      </div>

      <div class="buttons-group">
        <!-- FILTRO TIPO -->
        <div class="dropdown">
          <button class="btn-filter" type="button" data-bs-toggle="dropdown" data-bs-popper-config='{"strategy":"fixed"}'>
            <i class="bi bi-tag"></i>
            <span>{{ getTipoLabel() }}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" (click)="setFilter('tipo', 'ALL')">Todos los Tipos</a></li>
            <li><a class="dropdown-item" (click)="setFilter('tipo', 'PRODUCTO')">Productos</a></li>
            <li><a class="dropdown-item" (click)="setFilter('tipo', 'SERVICIO')">Servicios</a></li>
          </ul>
        </div>

        <!-- FILTRO ESTADO -->
        <div class="dropdown">
          <button class="btn-filter" type="button" data-bs-toggle="dropdown" data-bs-popper-config='{"strategy":"fixed"}'>
            <i class="bi bi-circle-fill" [style.color]="getEstadoColor()"></i>
            <span>{{ getEstadoLabel() }}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" (click)="setFilter('estado', 'ALL')">Todos los Estados</a></li>
            <li><a class="dropdown-item" (click)="setFilter('estado', 'ACTIVO')">Activos</a></li>
            <li><a class="dropdown-item" (click)="setFilter('estado', 'INACTIVO')">Inactivos</a></li>
          </ul>
        </div>

        <!-- FILTRO IVA -->
        <div class="dropdown">
          <button class="btn-filter" type="button" data-bs-toggle="dropdown" data-bs-popper-config='{"strategy":"fixed"}'>
            <i class="bi bi-percent"></i>
            <span>{{ getIvaLabel() }}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" (click)="setFilter('tipo_iva', 'ALL')">Todos los IVAs</a></li>
            <li><a class="dropdown-item" (click)="setFilter('tipo_iva', 'IVA_15')">IVA 15%</a></li>
            <li><a class="dropdown-item" (click)="setFilter('tipo_iva', 'IVA_0')">IVA 0%</a></li>
            <li><a class="dropdown-item" (click)="setFilter('tipo_iva', 'EXENTO')">Exento</a></li>
            <li><a class="dropdown-item" (click)="setFilter('tipo_iva', 'NO_OBJETO')">No Objeto</a></li>
          </ul>
        </div>

        <button 
          *hasPermission="'PRODUCTOS_CREAR'"
          (click)="onCreate.emit()"
          class="btn-primary"
        >
          <i class="bi bi-plus-lg"></i>
          <span>Nuevo Producto</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .actions-container {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1.5rem; background: transparent; padding: 0; border: none;
    }
    .search-wrapper { position: relative; flex: 1; max-width: 500px; }
    .search-wrapper i { position: absolute; left: 1.1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1rem; }
    .search-input {
      width: 100%; padding: 0.75rem 1rem 0.75rem 2.8rem; border-radius: 14px;
      border: 1px solid var(--border-color); background: #f8fafc; font-size: 0.9rem;
      font-weight: 500; transition: all 0.2s;
    }
    .search-input:focus { outline: none; background: white; border-color: black; box-shadow: 0 0 0 3px rgba(22, 29, 53, 0.06); }
    .buttons-group { display: flex; align-items: center; gap: 0.75rem; }
    .btn-filter, .btn-primary {
      display: flex; align-items: center; justify-content: center; gap: 0.6rem;
      padding: 0.7rem 1.1rem; border-radius: 12px; font-weight: 700; font-size: 0.82rem;
      cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-filter { background: var(--status-neutral-bg); color: var(--status-neutral-text); }
    .btn-filter:hover { background: var(--border-color); }
    .btn-primary { background: var(--primary-color); color: white; padding: 0.7rem 1.3rem; }
    .btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .dropdown-menu { border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08); padding: 0.5rem; margin-top: 0.5rem; min-width: 180px; }
    .dropdown-item { border-radius: 8px; padding: 0.6rem 1rem; font-weight: 600; font-size: 0.82rem; color: #475569; cursor: pointer; }
    .dropdown-item:hover { background: var(--primary-color); color: #ffffff; }
    @media (max-width: 1200px) { .actions-container { flex-direction: column; align-items: stretch; } .search-wrapper { max-width: 100%; } .buttons-group { flex-wrap: wrap; } }
  `]
})
export class ProductosActionsComponent {
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filters: any = {
    tipo: 'ALL',
    estado: 'ALL',
    tipo_iva: 'ALL'
  };

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilter(key: string, value: string) {
    this.filters[key] = value;
    this.onFilterChangeEmit.emit(this.filters);
  }

  getTipoLabel(): string {
    switch (this.filters.tipo) {
      case 'PRODUCTO': return 'Solo Productos';
      case 'SERVICIO': return 'Solo Servicios';
      default: return 'Todos los Tipos';
    }
  }

  getEstadoLabel(): string {
    switch (this.filters.estado) {
      case 'ACTIVO': return 'Habilitados';
      case 'INACTIVO': return 'Inactivos';
      default: return 'Todos los Estados';
    }
  }

  getEstadoColor(): string {
    switch (this.filters.estado) {
      case 'ACTIVO': return '#10b981';
      case 'INACTIVO': return '#ef4444';
      default: return '#94a3b8';
    }
  }

  getIvaLabel(): string {
    switch (this.filters.tipo_iva) {
      case 'IVA_15': return 'IVA 15%';
      case 'IVA_0': return 'IVA 0%';
      case 'EXENTO': return 'Exento';
      case 'NO_OBJETO': return 'No Objeto';
      default: return 'Cualquier IVA';
    }
  }
}


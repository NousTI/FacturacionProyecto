import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionsService } from '../../../../../core/auth/permissions.service';

@Component({
  selector: 'app-producto-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="module-actions mb-4">
      <div class="actions-bar-container shadow-sm py-2 px-4 rounded-4">
        <div class="row align-items-center g-3">
          <!-- Búsqueda Principal -->
          <div class="col-lg-5">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange()"
                placeholder="Buscar por código, nombre o descripción..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtros Rápidos -->
          <div class="col-lg-4">
            <div class="d-flex gap-2">
              <select class="form-select-premium" [(ngModel)]="filters.tipo" (change)="emitFilterChange()">
                <option value="ALL">Todos los Tipos</option>
                <option value="PRODUCTO">Productos</option>
                <option value="SERVICIO">Servicios</option>
              </select>
              <select class="form-select-premium" [(ngModel)]="filters.estado" (change)="emitFilterChange()">
                <option value="ALL">Todo Estado</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-3 text-lg-end">
            <button 
              *ngIf="canCreate"
              (click)="onCreate.emit()"
              class="btn-system-action w-100 shadow-sm"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Nuevo Item</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .actions-bar-container { background: #ffffff; border: 1px solid rgba(0, 0, 0, 0.05); }
    .search-box-premium { position: relative; width: 100%; }
    .search-box-premium i { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem; }
    .form-control-premium-search {
      background: #f8fafc; border: 1.5px solid rgba(0, 0, 0, 0.05); border-radius: 14px;
      padding: 0 1.25rem 0 3.25rem; height: 40px; font-size: 0.9rem; font-weight: 500;
      color: #161d35; transition: all 0.2s; width: 100%;
    }
    .form-control-premium-search:focus { background: #ffffff; border-color: #161d35; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05); outline: none; }
    .form-select-premium {
      background: #f8fafc; border: 1.5px solid rgba(0, 0, 0, 0.05); border-radius: 14px;
      padding: 0 1rem; height: 40px; font-size: 0.85rem; font-weight: 600;
      color: #475569; width: 100%; cursor: pointer; transition: all 0.2s;
    }
    .form-select-premium:focus { border-color: #161d35; outline: none; }
    .btn-system-action {
      background: #161d35; color: #ffffff; border: 1.5px solid transparent; padding: 0 1.5rem;
      height: 40px; border-radius: 14px; font-weight: 700; display: inline-flex;
      align-items: center; justify-content: center; transition: all 0.2s; font-size: 0.9rem;
    }
    .btn-system-action:hover { background: #232d4d; transform: translateY(-1px); box-shadow: 0 10px 15px -3px rgba(22, 29, 53, 0.2); }
  `]
})
export class ProductoActionsComponent {
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filters = {
    tipo: 'ALL',
    estado: 'ALL'
  };

  canCreate: boolean;

  constructor(private permissionsService: PermissionsService) {
    this.canCreate = this.permissionsService.hasPermission('PRODUCTOS_CREAR') ||
      this.permissionsService.hasPermission('PRODUCTO_CREAR');
  }

  onSearchChange() {
    this.searchQueryChange.emit(this.searchQuery);
  }

  emitFilterChange() {
    this.onFilterChangeEmit.emit(this.filters);
  }
}

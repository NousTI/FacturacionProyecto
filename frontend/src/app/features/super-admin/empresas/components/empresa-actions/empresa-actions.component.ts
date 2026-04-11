import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-empresa-actions',
  template: `
    <section class="module-actions mb-4">
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
                placeholder="Buscar por razón social, RUC o email..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtros Rápidos -->
          <div class="col-lg-5">
            <div class="row g-2">
              <div class="col-md-4">
                <select class="form-select-premium" [(ngModel)]="filters.estado" (change)="onFilterChange()">
                  <option value="ALL">Todos los Estados</option>
                  <option value="ACTIVO">Activos</option>
                  <option value="INACTIVO">Inactivos</option>
                </select>
              </div>
              <div class="col-md-4">
                <select class="form-select-premium" [(ngModel)]="filters.plan" (change)="onFilterChange()">
                  <option value="ALL">Todos los Planes</option>
                  <option *ngFor="let plan of planes" [value]="plan.id">{{ plan.nombre }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <select class="form-select-premium" [(ngModel)]="filters.vendedor" (change)="onFilterChange()">
                  <option value="ALL">Cualquier Vendedor</option>
                  <option *ngFor="let v of vendedores" [value]="v.id">{{ v.nombre }}</option>
                  <option value="NONE">Sin Vendedor</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-2 text-lg-end">
            <button 
              (click)="onCreate.emit()"
              class="btn-system-action w-100"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Nueva Empresa</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .actions-bar-container {
      background: transparent;
      border: none;
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
      color: #94a3b8;
      font-size: 1rem;
    }
    .form-control-premium-search {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0 1rem 0 2.75rem;
      height: 42px;
      font-size: 0.95rem;
      color: #0f172a;
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium-search:focus {
      border-color: #cbd5e1;
      outline: none;
      box-shadow: none;
    }
    .form-select-premium {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0 1rem;
      height: 42px;
      font-size: 0.9rem;
      color: #475569;
      width: 100%;
      cursor: pointer;
    }
    .form-select-premium:focus {
      border-color: #cbd5e1;
      outline: none;
    }
    .btn-system-action {
      background: #111827;
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
      font-size: 0.9rem;
    }
    .btn-system-action:hover {
      background: #1f2937;
      transform: translateY(-1px);
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EmpresaActionsComponent {
  @Input() searchQuery: string = '';
  @Input() planes: any[] = [];
  @Input() vendedores: any[] = [];

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filters = {
    estado: 'ALL',
    plan: 'ALL',
    vendedor: 'ALL'
  };

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  onFilterChange() {
    this.onFilterChangeEmit.emit(this.filters);
  }
}

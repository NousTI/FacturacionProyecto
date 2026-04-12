import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vendedor-clientes-actions',
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
                placeholder="Buscar por Nombre, Email o Empresa..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtro Empresa -->
          <div class="col-lg-3">
             <div class="dropdown w-100">
               <button 
                 class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                 type="button" 
                 data-bs-toggle="dropdown" 
                 aria-expanded="false"
               >
                 <span class="text-truncate">{{ getEmpresaLabel() }}</span>
               </button>
               <ul class="dropdown-menu dropdown-menu-premium w-100" style="max-height: 300px; overflow-y: auto;">
                 <li><a class="dropdown-item" (click)="setFilterEmpresa('ALL')">Todas las Empresas</a></li>
                 <li><hr class="dropdown-divider"></li>
                 <li *ngFor="let emp of empresas">
                   <a class="dropdown-item d-flex flex-column py-2" (click)="setFilterEmpresa(emp.id)">
                     <span class="fw-bold">{{ emp.razon_social }}</span>
                     <small class="text-muted" style="font-size: 0.7rem;">RUC: {{ emp.ruc }}</small>
                   </a>
                 </li>
               </ul>
             </div>
          </div>

          <!-- Filtro Estado -->
          <div class="col-lg-2">
             <div class="dropdown w-100">
               <button 
                 class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                 type="button" 
                 data-bs-toggle="dropdown" 
                 aria-expanded="false"
               >
                 <span class="text-truncate">{{ getEstadoLabel() }}</span>
               </button>
               <ul class="dropdown-menu dropdown-menu-premium w-100">
                 <li><a class="dropdown-item" (click)="setFilterEstado('ALL')">Todos los Estados</a></li>
                 <li><hr class="dropdown-divider"></li>
                 <li><a class="dropdown-item" (click)="setFilterEstado('ACTIVO')">Activos</a></li>
                 <li><a class="dropdown-item" (click)="setFilterEstado('INACTIVO')">Inactivos</a></li>
               </ul>
             </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-2 text-lg-end">
            <div class="d-inline-block w-100" [title]="!canCreate ? 'No tienes permiso para crear usuarios' : ''">
              <button 
                [disabled]="!canCreate"
                class="btn-system-action w-100"
                [class.restricted-btn]="!canCreate"
                (click)="onCreate.emit()"
              >
                <i class="bi" [ngClass]="canCreate ? 'bi-plus-lg' : 'bi-lock-fill'"></i>
                <span class="ms-1">{{ canCreate ? 'Nuevo' : 'Bloqueado' }}</span>
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
      border: none !important;
      background: transparent !important;
      padding: 0 !important;
    }
    .restricted-btn {
      background: #f1f5f9 !important;
      color: #94a3b8 !important;
      cursor: not-allowed !important;
      border: 1px solid #e2e8f0 !important;
      box-shadow: none !important;
    }
  `]
})
export class VendedorClientesActionsComponent {
  @Input() searchQuery: string = '';
  @Input() filterEstado: string = 'ALL';
  @Input() filterEmpresa: string = 'ALL';
  @Input() empresas: any[] = [];
  @Input() canCreate: boolean = false;

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() filterEstadoChange = new EventEmitter<string>();
  @Output() filterEmpresaChange = new EventEmitter<string>();
  @Output() onFilterChangeEmit = new EventEmitter<void>();
  @Output() onCreate = new EventEmitter<void>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setFilterEstado(estado: string) {
    this.filterEstado = estado;
    this.filterEstadoChange.emit(estado);
    this.onFilterChangeEmit.emit();
  }

  setFilterEmpresa(empresaId: string) {
    this.filterEmpresa = empresaId;
    this.filterEmpresaChange.emit(empresaId);
    this.onFilterChangeEmit.emit();
  }

  getEstadoLabel(): string {
    const labels: any = {
      'ALL': 'Estados',
      'ACTIVO': 'Activos',
      'INACTIVO': 'Inactivos'
    };
    return labels[this.filterEstado] || 'Estado';
  }

  getEmpresaLabel(): string {
    if (this.filterEmpresa === 'ALL') return 'Todas las Empresas';
    const emp = this.empresas.find(e => e.id === this.filterEmpresa);
    return emp ? emp.razon_social : 'Empresa';
  }
}

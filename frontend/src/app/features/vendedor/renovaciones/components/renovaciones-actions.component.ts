import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-renovaciones-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="module-actions animate__animated animate__fadeInUp">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          <!-- Búsqueda Principal -->
          <div class="col-lg-6">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange($event)"
                placeholder="Buscar por Empresa o Plan solicitado..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtros Rápidos -->
          <div class="col-lg-3">
            <div class="dropdown w-100">
              <button 
                class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                type="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <span>{{ getStatusLabel() }}</span>
              </button>
              <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                <li><a class="dropdown-item" (click)="setStatus('ALL')">Todos los Estados</a></li>
                <li><a class="dropdown-item" (click)="setStatus('PENDIENTE')">En Revisión</a></li>
                <li><a class="dropdown-item" (click)="setStatus('ACEPTADA')">Aprobadas</a></li>
                <li><a class="dropdown-item" (click)="setStatus('RECHAZADA')">Rechazadas</a></li>
              </ul>
            </div>
          </div>

          <!-- Botón de Acción -->
          <div class="col-lg-3 text-lg-end d-flex gap-2">
            <button (click)="onRefresh.emit()" class="btn-system-action bg-light text-dark border flex-shrink-0" title="Actualizar">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
            <button 
              (click)="onCreate.emit()"
              class="btn-system-action w-100"
            >
              <i class="bi bi-plus-lg me-2"></i>
              <span>Nueva Solicitud</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; position: relative; z-index: 10; }
    .actions-bar-container {
      background: transparent;
      border: none;
    }
    .dropdown-menu-premium {
      z-index: 1000;
    }
  `]
})
export class RenovacionesActionsComponent {
  @Input() searchQuery: string = '';
  @Input() currentStatus: string = 'ALL';

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onStatusChange = new EventEmitter<string>();
  @Output() onCreate = new EventEmitter<void>();
  @Output() onRefresh = new EventEmitter<void>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setStatus(status: string) {
    this.onStatusChange.emit(status);
  }

  getStatusLabel(): string {
    const labels: any = {
      'ALL': 'Todos los Estados',
      'PENDIENTE': 'En Revisión (Pendiente)',
      'ACEPTADA': 'Aprobadas',
      'RECHAZADA': 'Rechazadas'
    };
    return labels[this.currentStatus] || 'Estado';
  }
}

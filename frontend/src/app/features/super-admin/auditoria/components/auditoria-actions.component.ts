import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FiltrosAuditoria {
  usuario: string;
  evento: string;
  fecha_inicio: string;
  fecha_fin: string;
}

@Component({
  selector: 'app-auditoria-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          <!-- Búsqueda Principal -->
          <div class="col-lg-4">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="filtros.usuario" 
                (ngModelChange)="onFilterChange()"
                placeholder="Buscar por Usuario o Email..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtros Rápidos -->
          <div class="col-lg-6">
            <div class="row g-2">
              <!-- Evento -->
              <div class="col-md-4">
                <div class="dropdown">
                  <button 
                    class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <span>{{ getEventoLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li><a class="dropdown-item" (click)="setFilter('evento', '')">Todos los Eventos</a></li>
                    <li *ngFor="let ev of tiposEventos">
                      <a class="dropdown-item" (click)="setFilter('evento', ev.value)">{{ ev.label }}</a>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Fecha Inicio -->
              <div class="col-md-4">
                <input 
                  type="date" 
                  class="form-select-premium" 
                  [(ngModel)]="filtros.fecha_inicio"
                  (change)="onFilterChange()"
                >
              </div>

              <!-- Fecha Fin -->
              <div class="col-md-4">
                <input 
                  type="date" 
                  class="form-select-premium" 
                  [(ngModel)]="filtros.fecha_fin"
                  (change)="onFilterChange()"
                >
              </div>
            </div>
          </div>

          <!-- Botón de Exportación -->
          <div class="col-lg-2 text-lg-end">
            <button 
              (click)="exportar.emit()" 
              class="btn-system-action w-100"
              style="background: #10b981;"
            >
              <i class="bi bi-file-earmark-excel me-2"></i>
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }
    .module-actions {
      margin-bottom: 0;
    }
    .actions-bar-container {
      background: transparent;
      border: none;
    }
    .form-select-premium {
      height: 48px;
    }
  `]
})
export class AuditoriaActionsComponent {
  @Input() filtros: FiltrosAuditoria = {
    usuario: '',
    evento: '',
    fecha_inicio: '',
    fecha_fin: ''
  };

  @Output() filtrar = new EventEmitter<FiltrosAuditoria>();
  @Output() exportar = new EventEmitter<void>();

  tiposEventos = [
    { label: 'Login OK', value: 'LOGIN_OK' },
    { label: 'Login Fallido', value: 'LOGIN_FALLIDO' },
    { label: 'Logout', value: 'LOGOUT' },
    { label: 'Password Cambiada', value: 'PASSWORD_CAMBIADA' },
    { label: 'Comisión Pagar', value: 'COMISION_PENDIENTE' },
    { label: 'Plan Activa', value: 'PLAN_ACTIVA' },
    { label: 'Vendedor Creado', value: 'VENDEDOR_CREADO' },
    { label: 'SRI Emitido', value: 'SRI_EMITIDO' }
  ];

  onFilterChange() {
    this.filtrar.emit(this.filtros);
  }

  setFilter(key: keyof FiltrosAuditoria, value: string) {
    this.filtros[key] = value;
    this.onFilterChange();
  }

  getEventoLabel(): string {
    if (!this.filtros.evento) return 'Todos los Eventos';
    const found = this.tiposEventos.find(e => e.value === this.filtros.evento);
    return found ? found.label : this.filtros.evento;
  }
}

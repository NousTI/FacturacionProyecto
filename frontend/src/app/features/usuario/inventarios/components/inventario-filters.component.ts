import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-inventario-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HasPermissionDirective],
  template: `
    <div class="filter-bar">
      <form [formGroup]="filterForm" class="filter-form">
        <div class="filter-group mini">
          <label>Tipo</label>
          <select formControlName="tipo" class="form-control-sm">
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
            <option value="devolucion">Devolución</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Desde</label>
          <input type="date" formControlName="fecha_inicio" class="form-control-sm">
        </div>
        <div class="filter-group">
          <label>Hasta</label>
          <input type="date" formControlName="fecha_fin" class="form-control-sm">
        </div>
        <div class="filter-actions">
          <button type="button" class="btn-primary" (click)="onCreate.emit()" *hasPermission="'INVENTARIO_CREAR'">
            <i class="bi bi-plus-lg"></i> Nuevo Movimiento
          </button>
          <button type="button" class="btn-refresh" (click)="onFilter.emit(filterForm.value)" [disabled]="isLoading">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .filter-bar { background: #f8fafc; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
    .filter-form { display: flex; align-items: flex-end; gap: 1rem; flex-wrap: wrap; }
    .filter-group { display: flex; flex-direction: column; gap: 0.5rem; min-width: 150px; }
    .filter-group.mini { min-width: 100px; }
    .filter-group label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .form-control-sm { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.875rem; }
    .filter-actions { display: flex; gap: 0.75rem; margin-left: auto; }
    .btn-primary { background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    .btn-refresh { padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; }
  `]
})
export class InventarioFiltersComponent {
  @Input() isLoading = false;
  @Output() onFilter = new EventEmitter<any>();
  @Output() onCreate = new EventEmitter<void>();

  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      tipo: [''],
      fecha_inicio: [''],
      fecha_fin: ['']
    });
  }
}

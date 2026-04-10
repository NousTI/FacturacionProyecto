import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

export type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'personalizado';

@Component({
  selector: 'app-reportes-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="filters-card mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="filter-label">Rango de Fecha</label>
          <select class="form-select" [(ngModel)]="rangoTipo" (change)="onRangoChangeInternal()">
            <option value="mes_actual">Mes Actual</option>
            <option value="mes_anterior">Mes Anterior</option>
            <option value="anio_actual">Año Actual</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div class="col-md-3" *ngIf="rangoTipo === 'personalizado'">
          <label class="filter-label">Desde</label>
          <input type="date" class="form-control" [(ngModel)]="fechaInicio" (change)="emitDates()">
        </div>
        <div class="col-md-3" *ngIf="rangoTipo === 'personalizado'">
          <label class="filter-label">Hasta</label>
          <input type="date" class="form-control" [(ngModel)]="fechaFin" (change)="emitDates()">
        </div>
        <div class="col-auto">
          <button *hasPermission="'REPORTES_GENERAR'" class="btn-refresh" (click)="generate.emit()" [disabled]="loading">
            <i class="bi bi-arrow-repeat me-2" [class.spin]="loading"></i>
            {{ loading ? 'Cargando...' : 'Generar Reporte' }}
          </button>
        </div>
        <div class="col-auto ms-auto">
          <button *hasPermission="'REPORTES_EXPORTAR'" class="btn-export" (click)="export.emit()">
            <i class="bi bi-file-earmark-pdf me-2"></i>Exportar PDF
          </button>
        </div>
      </div>
      <div class="rango-info mt-2" *ngIf="fechaInicio && fechaFin">
        <span>Período: <strong>{{ fechaInicio }}</strong> al <strong>{{ fechaFin }}</strong></span>
      </div>
    </div>
  `,
  styles: [`
    .filters-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .filter-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; display: block; margin-bottom: 0.5rem; }
    .btn-refresh {
      background: #3b82f6; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700;
      transition: all 0.2s;
    }
    .btn-refresh:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
    .btn-export {
      background: #fff; color: #ef4444; border: 2px solid #fecaca; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700;
      transition: all 0.2s;
    }
    .btn-export:hover { background: #fef2f2; border-color: #f87171; }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class ReportesFiltersComponent {
  @Input() loading = false;
  @Input() rangoTipo: RangoTipo = 'mes_actual';
  @Input() fechaInicio = '';
  @Input() fechaFin = '';

  @Output() rangoChange = new EventEmitter<{tipo: RangoTipo, inicio: string, fin: string}>();
  @Output() generate = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();

  onRangoChangeInternal() {
    this.calculateDates();
    this.emitDates();
  }

  calculateDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    switch (this.rangoTipo) {
      case 'mes_actual':
        this.fechaInicio = this.formatDate(firstDay);
        this.fechaFin = this.formatDate(today);
        break;
      case 'mes_anterior':
        const lastMonthFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthLast = new Date(today.getFullYear(), today.getMonth(), 0);
        this.fechaInicio = this.formatDate(lastMonthFirst);
        this.fechaFin = this.formatDate(lastMonthLast);
        break;
      case 'anio_actual':
        this.fechaInicio = this.formatDate(new Date(today.getFullYear(), 0, 1));
        this.fechaFin = this.formatDate(today);
        break;
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  emitDates() {
    this.rangoChange.emit({ tipo: this.rangoTipo, inicio: this.fechaInicio, fin: this.fechaFin });
  }
}

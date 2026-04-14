import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'personalizado';

@Component({
  selector: 'app-vendedor-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="compact-filters animate__animated animate__fadeIn">
      <div class="d-flex align-items-center gap-2">
        <!-- Selector de Rango -->
        <div class="filter-group">
          <select class="form-select select-compact" [(ngModel)]="rangoTipo" (change)="onRangoChangeInternal()">
            <option value="mes_actual">Mes Actual</option>
            <option value="mes_anterior">Mes Anterior</option>
            <option value="anio_actual">Año Actual</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        
        <!-- Rango Personalizado -->
        <ng-container *ngIf="rangoTipo === 'personalizado'">
          <div class="filter-group d-flex align-items-center gap-1">
            <input type="date" class="form-control control-compact date-small" [(ngModel)]="fechaInicio" (change)="emitDates()">
            <span class="to-text">-</span>
            <input type="date" class="form-control control-compact date-small" [(ngModel)]="fechaFin" (change)="emitDates()">
          </div>
        </ng-container>

        <!-- Botón Consultar -->
        <button class="btn-refresh-compact px-3 w-auto" (click)="generate.emit()" [disabled]="loading">
          <i class="bi bi-search me-2" [class.bi-spin]="loading"></i>
          {{ loading ? 'Generando...' : 'Generar Reporte' }}
        </button>
        
        <!-- Botón Exportar PDF -->
        <button class="btn-export-compact" (click)="export.emit()">
          <i class="bi bi-file-earmark-pdf"></i>
          <span class="ms-2">Exportar PDF</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .compact-filters { padding: 0.25rem 0; }
    
    .select-compact {
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      padding: 0.4rem 0.6rem;
      font-weight: 700;
      font-size: 0.8rem;
      color: #1e293b;
      background-color: #f8fafc;
      min-width: 120px;
      cursor: pointer;
    }

    .control-compact {
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      padding: 0.4rem 0.5rem;
      font-weight: 600;
      font-size: 0.75rem;
      color: #1e293b;
      background-color: #f8fafc;
    }
    
    .date-small { width: 110px; }

    .to-text { font-size: 0.75rem; font-weight: 900; color: #cbd5e1; }

    .btn-refresh-compact {
      background: #1e293b; color: #fff; border: none; 
      height: 32px; border-radius: 10px; 
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
      white-space: nowrap;
      cursor: pointer;
    }
    .btn-refresh-compact:hover { background: #000; transform: scale(1.05); }

    .btn-export-compact {
      background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;
      padding: 0.4rem 0.75rem; border-radius: 10px; font-weight: 800;
      font-size: 0.75rem; display: flex; align-items: center;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-export-compact:hover { background: #fef2f2; transform: translateY(-1px); border-color: #fca5a5; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .bi-spin { animation: spin 1.5s linear infinite; }
  `]
})
export class VendedorFiltersComponent {
  @Input() loading = false;
  @Input() showDiasRenovacion = false;
  @Input() rangoTipo: RangoTipo = 'mes_actual';
  @Input() fechaInicio = '';
  @Input() fechaFin = '';
  @Input() diasRenovacion = 15;

  @Output() rangoChange = new EventEmitter<{tipo: RangoTipo, inicio: string, fin: string, dias?: number}>();
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  emitDates() {
    this.rangoChange.emit({ 
        tipo: this.rangoTipo, 
        inicio: this.fechaInicio, 
        fin: this.fechaFin,
        dias: this.diasRenovacion
    });
  }
}

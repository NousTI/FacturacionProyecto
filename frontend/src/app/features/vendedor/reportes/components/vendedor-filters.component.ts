import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'personalizado';

@Component({
  selector: 'app-vendedor-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filters-card mb-4 animate__animated animate__fadeIn">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="filter-label">Rango de Consulta</label>
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

        <!-- Filtro adicional para Renovaciones (Próximos días) -->
        <div class="col-md-2" *ngIf="showDiasRenovacion">
            <label class="filter-label">Días a vencer</label>
            <input type="number" class="form-control" [(ngModel)]="diasRenovacion" (change)="emitDates()" min="1" max="90">
        </div>

        <div class="col-auto">
          <button class="btn-refresh" (click)="generate.emit()" [disabled]="loading">
            <i class="bi bi-search me-2" [class.bi-spin]="loading"></i>
            {{ loading ? 'Buscando...' : 'Consultar' }}
          </button>
        </div>
        
        <div class="col-auto ms-auto">
          <button class="btn-export" (click)="export.emit()">
            <i class="bi bi-file-earmark-pdf me-2"></i>Descargar PDF
          </button>
        </div>
      </div>
      
      <div class="rango-info mt-3" *ngIf="fechaInicio && fechaFin">
        <i class="bi bi-calendar-check me-2 text-primary"></i>
        <span>Consulta del <strong>{{ fechaInicio | date:'mediumDate' }}</strong> al <strong>{{ fechaFin | date:'mediumDate' }}</strong></span>
      </div>
    </div>
  `,
  styles: [`
    .filters-card { 
      background: #fff; 
      border: 1px solid #e2e8f0; 
      border-radius: 20px; 
      padding: 1.5rem; 
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); 
    }
    
    .filter-label { 
      font-size: 0.75rem; 
      font-weight: 800; 
      text-transform: uppercase; 
      color: #64748b; 
      letter-spacing: 0.05em; 
      display: block; 
      margin-bottom: 0.5rem; 
    }
    
    .form-select, .form-control {
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      padding: 0.65rem 1rem;
      font-weight: 500;
      color: #1e293b;
    }
    
    .form-select:focus, .form-control:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .btn-refresh {
      background: #1e293b; 
      color: #fff; 
      border: none; 
      padding: 0.75rem 1.5rem; 
      border-radius: 12px; 
      font-weight: 700;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
    }
    
    .btn-refresh:hover:not(:disabled) { 
      background: #0f172a; 
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);
    }
    
    .btn-refresh:disabled { opacity: 0.7; cursor: not-allowed; }
    
    .btn-export {
      background: #fef2f2; 
      color: #ef4444; 
      border: 1px solid #fee2e2; 
      padding: 0.75rem 1.5rem; 
      border-radius: 12px; 
      font-weight: 700;
      transition: all 0.2s;
    }
    
    .btn-export:hover { 
      background: #fee2e2; 
      border-color: #fecaca;
      transform: translateY(-2px);
    }
    
    .rango-info {
      font-size: 0.85rem;
      color: #64748b;
      display: flex;
      align-items: center;
      padding-top: 0.5rem;
      border-top: 1px solid #f1f5f9;
    }
    
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .bi-spin { animation: spin 1.5s linear infinite; display: inline-block; }
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

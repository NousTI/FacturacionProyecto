import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

export type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'personalizado';

@Component({
  selector: 'app-super-admin-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="compact-filters animate__animated animate__fadeIn">
      <div class="d-flex align-items-center gap-2">
        
        <!-- Filtros Comunes: Rango -->
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
            <input type="date" class="form-control control-compact date-small" [(ngModel)]="fechaInicio" (change)="emitChanges()">
            <span class="to-text">-</span>
            <input type="date" class="form-control control-compact date-small" [(ngModel)]="fechaFin" (change)="emitChanges()">
          </div>
        </ng-container>


        <!-- Botón Consultar -->
        <button class="btn-refresh-compact px-3" (click)="generate.emit()" [disabled]="loading">
          <i class="bi bi-search me-2" [class.bi-spin]="loading"></i>
          {{ loading ? 'Generando...' : 'Generar Reporte' }}
        </button>
        
        <!-- Botón Exportar PDF -->
        <button class="btn-export-compact" (click)="export.emit()" [disabled]="loadingPDF">
          <i class="bi bi-file-earmark-pdf" *ngIf="!loadingPDF"></i>
          <span class="spinner-border spinner-border-sm me-2" *ngIf="loadingPDF"></span>
          <span class="ms-1">{{ loadingPDF ? 'Generando...' : 'Exportar PDF' }}</span>
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
      min-width: 125px;
      max-width: 180px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .select-compact:hover { border-color: #cbd5e1; background-color: #fff; }
    .select-compact:focus { outline: none; border-color: #1e293b; box-shadow: 0 0 0 2px rgba(30,41,59,0.05); }


    .control-compact {
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      padding: 0.4rem 0.5rem;
      font-weight: 600;
      font-size: 0.75rem;
      color: #1e293b;
      background-color: #f8fafc;
    }
    
    .date-small { width: 115px; }
    .to-text { font-size: 0.75rem; font-weight: 900; color: #cbd5e1; }

    .btn-refresh-compact {
      background: #1e293b; color: #fff; border: none; 
      height: 35px; border-radius: 10px; 
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
      white-space: nowrap;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .btn-refresh-compact:hover:not(:disabled) { background: #000; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .btn-refresh-compact:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-export-compact {
      background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;
      height: 35px; padding: 0 1rem; border-radius: 10px; font-weight: 800;
      font-size: 0.75rem; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-export-compact:hover:not(:disabled) { background: #fef2f2; transform: translateY(-1px); border-color: #fca5a5; }
    .btn-export-compact:disabled { opacity: 0.6; cursor: not-allowed; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .bi-spin { animation: spin 1.5s linear infinite; display: inline-block; }
  `]
})
export class SuperAdminFiltersComponent implements OnInit {
  @Input() loading = false;
  @Input() loadingPDF = false;
  @Input() activeTab: 'global' | 'comisiones' | 'uso' = 'global';
  
  @Input() rangoTipo: RangoTipo = 'mes_actual';
  @Input() fechaInicio = '';
  @Input() fechaFin = '';
  @Input() vendedorId = '';
  @Input() estado = '';

  @Output() filterChange = new EventEmitter<any>();
  @Output() generate = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();

  ngOnInit() {
    if (!this.fechaInicio || !this.fechaFin) {
        this.calculateDates();
    }
    // Emitir estado inicial para que el padre sincronice
    this.emitChanges();
  }

  onRangoChangeInternal() {
    this.calculateDates();
    this.emitChanges();
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

  emitChanges() {
    this.filterChange.emit({
      rangoTipo: this.rangoTipo,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      vendedorId: this.vendedorId,
      estado: this.estado
    });
  }
}

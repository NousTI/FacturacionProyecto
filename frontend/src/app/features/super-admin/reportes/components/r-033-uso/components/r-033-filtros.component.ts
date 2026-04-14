import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'mes_especifico' | 'anio_especifico' | 'personalizado';

@Component({
  selector: 'app-r-033-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filtros-card mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label-sm">Rango</label>
          <select class="form-select form-select-sm" [(ngModel)]="rangoTipo" (change)="onRangoChange()">
            <option value="mes_actual">Mes actual</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="anio_actual">Año actual</option>
            <option value="mes_especifico">Mes específico</option>
            <option value="anio_especifico">Año específico</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'mes_especifico'">
          <label class="form-label-sm">Mes</label>
          <select class="form-select form-select-sm" [(ngModel)]="mesFiltro" (change)="onRangoChange()">
            <option *ngFor="let m of meses; let i = index" [value]="i+1">{{ m }}</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'mes_especifico' || rangoTipo === 'anio_especifico'">
          <label class="form-label-sm">Año</label>
          <input type="number" class="form-control form-control-sm" [(ngModel)]="anioFiltro" (change)="onRangoChange()" [min]="2020" [max]="anioActual">
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'personalizado'">
          <label class="form-label-sm">Desde</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaInicio" (change)="emitirCambio()">
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'personalizado'">
          <label class="form-label-sm">Hasta</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaFin" (change)="emitirCambio()">
        </div>
        <div class="col-auto">
          <span class="rango-preview">{{ fechaInicio }} → {{ fechaFin }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filtros-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1rem; }
    .form-label-sm { font-size: 0.75rem; font-weight: 600; color: #374151; display: block; margin-bottom: 0.25rem; }
    .form-select-sm, .form-control-sm { font-size: 0.8rem; padding: 0.25rem 0.5rem; }
    .rango-preview { color: #64748b; font-size: 0.8rem; }
  `]
})
export class R033FiltrosComponent implements OnInit {
  @Input() initialRango: RangoTipo = 'mes_actual';
  @Output() cambioFiltros = new EventEmitter<{ fechaInicio: string, fechaFin: string }>();

  rangoTipo: RangoTipo = 'mes_actual';
  mesFiltro = new Date().getMonth() + 1;
  anioFiltro = new Date().getFullYear();
  fechaInicio = '';
  fechaFin = '';

  anioActual = new Date().getFullYear();
  meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  ngOnInit() {
    this.rangoTipo = this.initialRango;
    this.onRangoChange();
  }

  onRangoChange() {
    const now = new Date();
    switch (this.rangoTipo) {
      case 'mes_actual':
        this.fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        this.fechaFin = now.toISOString().split('T')[0];
        break;
      case 'mes_anterior': {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        this.fechaInicio = prev.toISOString().split('T')[0];
        this.fechaFin = prevEnd.toISOString().split('T')[0];
        break;
      }
      case 'anio_actual':
        this.fechaInicio = `${now.getFullYear()}-01-01`;
        this.fechaFin = now.toISOString().split('T')[0];
        break;
      case 'mes_especifico': {
        const y = this.anioFiltro, m = this.mesFiltro;
        this.fechaInicio = `${y}-${String(m).padStart(2,'0')}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        this.fechaFin = `${y}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
        break;
      }
      case 'anio_especifico':
        this.fechaInicio = `${this.anioFiltro}-01-01`;
        this.fechaFin = `${this.anioFiltro}-12-31`;
        break;
    }
    this.emitirCambio();
  }

  emitirCambio() {
    this.cambioFiltros.emit({ fechaInicio: this.fechaInicio, fechaFin: this.fechaFin });
  }
}

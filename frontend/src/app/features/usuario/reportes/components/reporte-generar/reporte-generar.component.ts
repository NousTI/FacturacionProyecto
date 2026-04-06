import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reporte-generar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reporte-generar-container p-4">
      <div class="row g-4">
        <div class="col-md-6">
          <label class="form-label fw-700 text-dark">Título del Reporte</label>
          <input type="text" class="form-control minimal-input" 
                 [(ngModel)]="reporte.nombre" 
                 placeholder="Ej. Reporte Trimestral Q1">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-700 text-dark">Tipo de Reporte</label>
          <select class="form-select minimal-input" [(ngModel)]="reporte.tipo">
            <option value="ESTADO_RESULTADOS">Estado de Resultados (PyG)</option>
            <option value="IVA_104">Declaración de IVA (104)</option>
            <option value="VENTAS_PLANAS">Ventas Planas (Exportación)</option>
          </select>
        </div>

        <div class="col-md-6" *ngIf="reporte.tipo !== 'IVA_104'">
          <label class="form-label fw-700 text-dark">Fecha Inicio</label>
          <input type="date" class="form-control minimal-input" [(ngModel)]="reporte.fecha_inicio">
        </div>
        <div class="col-md-6" *ngIf="reporte.tipo !== 'IVA_104'">
          <label class="form-label fw-700 text-dark">Fecha Fin</label>
          <input type="date" class="form-control minimal-input" [(ngModel)]="reporte.fecha_fin">
        </div>

        <div class="col-md-3" *ngIf="reporte.tipo === 'IVA_104'">
          <label class="form-label fw-700 text-dark">Mes</label>
          <select class="form-select minimal-input" [(ngModel)]="reporte.mes">
            <option *ngFor="let m of meses" [value]="m.val">{{ m.nom }}</option>
          </select>
        </div>
        <div class="col-md-3" *ngIf="reporte.tipo === 'IVA_104'">
          <label class="form-label fw-700 text-dark">Año</label>
          <input type="number" class="form-control minimal-input" [(ngModel)]="reporte.anio">
        </div>

        <div class="col-12 mt-4 d-flex gap-3 justify-content-end">
          <button class="btn btn-outline-secondary rounded-pill px-4" 
                  [disabled]="loading"
                  (click)="onPreview.emit(reporte)">
            <i class="bi bi-eye me-2"></i> Previsualizar
          </button>
          <button class="btn btn-primary rounded-pill px-4 shadow-sm" 
                  [disabled]="loading"
                  (click)="onGenerate.emit(reporte)">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i class="bi bi-file-earmark-arrow-down me-2" *ngIf="!loading"></i>
            Generar y Descargar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .minimal-input {
      border-radius: 12px;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
    }
    .minimal-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }
    .fw-700 { font-weight: 700; }
  `]
})
export class ReporteGenerarComponent {
  @Input() loading: boolean = false;
  @Output() onPreview = new EventEmitter<any>();
  @Output() onGenerate = new EventEmitter<any>();

  reporte = {
    nombre: '',
    tipo: 'ESTADO_RESULTADOS',
    fecha_inicio: new Date().toISOString().substring(0, 10),
    fecha_fin: new Date().toISOString().substring(0, 10),
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  };

  meses = [
    { val: 1, nom: 'Enero' }, { val: 2, nom: 'Febrero' }, { val: 3, nom: 'Marzo' },
    { val: 4, nom: 'Abril' }, { val: 5, nom: 'Mayo' }, { val: 6, nom: 'Junio' },
    { val: 7, nom: 'Julio' }, { val: 8, nom: 'Agosto' }, { val: 9, nom: 'Septiembre' },
    { val: 10, nom: 'Octubre' }, { val: 11, nom: 'Noviembre' }, { val: 12, nom: 'Diciembre' }
  ];
}

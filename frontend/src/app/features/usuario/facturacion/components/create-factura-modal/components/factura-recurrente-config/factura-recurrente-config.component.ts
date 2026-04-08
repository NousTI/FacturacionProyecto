import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-factura-recurrente-config',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div *ngIf="mode === 'RECURRENTE'" class="section-lux-dark mb-4 animate__animated animate__fadeIn" [formGroup]="parentForm">
      <div class="section-title-lux mb-3 text-white-50 border-white-10">Configuración Recurrente</div>
      <div class="row g-2">
        <div class="col-6">
          <label class="form-label-lux text-white-50">Frecuencia</label>
          <div class="select-lux-wrapper">
            <select class="select-lux input-sm bg-white-10 text-white border-0" formControlName="tipo_frecuencia">
              <option value="MENSUAL">MENSUAL</option>
              <option value="TRIMESTRAL">TRIMESTRAL</option>
              <option value="ANUAL">ANUAL</option>
            </select>
          </div>
        </div>
        <div class="col-6">
          <label class="form-label-lux text-white-50">Día de Emisión</label>
          <input type="number" class="input-lux input-sm bg-white-10 text-white border-0" formControlName="dia_emision" min="1" max="31">
        </div>
        <div class="col-6">
          <label class="form-label-lux text-white-50">Fecha Inicio</label>
          <input type="date" class="input-lux input-sm bg-white-10 text-white border-0" formControlName="fecha_inicio">
        </div>
        <div class="col-6">
          <label class="form-label-lux text-white-50">Fecha Fin (Opcional)</label>
          <input type="date" class="input-lux input-sm bg-white-10 text-white border-0" formControlName="fecha_fin">
        </div>
      </div>
    </div>
  `
})
export class FacturaRecurrenteConfigComponent {
  @Input() parentForm!: FormGroup;
  @Input() mode: 'NORMAL' | 'RECURRENTE' = 'NORMAL';
}

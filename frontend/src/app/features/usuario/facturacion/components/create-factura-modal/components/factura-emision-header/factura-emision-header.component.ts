import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Establecimiento } from '../../../../../../../domain/models/establecimiento.model';
import { PuntoEmision } from '../../../../../../../domain/models/punto-emision.model';

@Component({
  selector: 'app-factura-emision-header',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="section-lux h-100 p-3 border shadow-sm rounded-4 bg-white" [formGroup]="parentForm">
      <div class="section-title-lux mb-3 border-0 p-0" style="color: #1e293b;">
        <i class="bi bi-file-earmark-text-fill me-2 text-primary"></i> Información de Emisión
      </div>
      
      <div class="row g-2">
        <div class="col-md-6">
          <label class="form-label-lux">Establecimiento</label>
          <div class="select-lux-wrapper">
            <select class="select-lux input-sm" formControlName="establecimiento_id">
              <option [ngValue]="null" disabled>Seleccione...</option>
              <option *ngFor="let est of establecimientos" [value]="est.id">{{ est.nombre }} ({{ est.codigo }})</option>
            </select>
          </div>
        </div>
        
        <div class="col-md-6">
          <label class="form-label-lux">Punto Emisión</label>
          <div class="select-lux-wrapper">
            <select class="select-lux input-sm" formControlName="punto_emision_id">
              <option [ngValue]="null" disabled>Seleccione...</option>
              <option *ngFor="let pto of puntosEmisionFiltered" [value]="pto.id">{{ pto.codigo }}</option>
            </select>
          </div>
        </div>

        <div class="col-md-5">
          <label class="form-label-lux">Fecha Emisión</label>
          <div class="input-lux-wrapper input-sm">
            <i class="bi bi-calendar-event"></i>
            <input type="date" class="input-lux" formControlName="fecha_emision">
          </div>
        </div>

        <div class="col-md-7">
          <label class="form-label-lux">Forma de Pago SRI</label>
          <div class="select-lux-wrapper">
            <select class="select-lux input-sm" formControlName="forma_pago_sri">
              <option value="01">EFECTIVO</option>
              <option value="15">COMPENSACIÓN DE DEUDAS</option>
              <option value="16">TARJETA DE DÉBITO</option>
              <option value="17">DINERO ELECTRÓNICO</option>
              <option value="18">TARJETA PREPAGO</option>
              <option value="19">TARJETA DE CRÉDITO</option>
              <option value="20">SISTEMA FINANCIERO (OTROS)</option>
              <option value="21">ENDOSO DE TÍTULOS</option>
            </select>
          </div>
        </div>

        <div class="col-12 mt-1">
          <label class="form-label-lux">Guía Remisión</label>
          <div class="input-lux-wrapper input-sm">
            <i class="bi bi-truck"></i>
            <input type="text" class="input-lux" formControlName="guia_remision" placeholder="000-000-000000000">
          </div>
        </div>
      </div>
    </div>
  `
})
export class FacturaEmisionHeaderComponent {
  @Input() parentForm!: FormGroup;
  @Input() establecimientos: Establecimiento[] = [];
  @Input() puntosEmisionFiltered: PuntoEmision[] = [];
}

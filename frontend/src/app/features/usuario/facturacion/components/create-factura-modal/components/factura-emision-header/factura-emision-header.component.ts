import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Establecimiento } from '../../../../../../../domain/models/establecimiento.model';
import { PuntoEmision } from '../../../../../../../domain/models/punto-emision.model';
import { SRI_FORMAS_PAGO, FORMA_PAGO_REQUIERE_PLAZO } from '../../../../../../../core/constants/sri-iva.constants';

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

        <div class="col-md-5" style="display: none;">
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
              <option *ngFor="let fp of formasPago" [value]="fp.codigo">{{ fp.label | uppercase }}</option>
            </select>
          </div>
        </div>

        <!-- Plazo y unidad: solo cuando la forma de pago lo requiere -->
        <ng-container *ngIf="requierePlazo">
          <div class="col-md-4">
            <label class="form-label-lux">Plazo</label>
            <div class="input-lux-wrapper input-sm">
              <i class="bi bi-clock"></i>
              <input type="number" class="input-lux" formControlName="plazo" min="0" placeholder="0">
            </div>
          </div>
          <div class="col-md-8">
            <label class="form-label-lux">Unidad de Tiempo</label>
            <div class="select-lux-wrapper">
              <select class="select-lux input-sm" formControlName="unidad_tiempo">
                <option value="DIAS">Días</option>
                <option value="MESES">Meses</option>
                <option value="ANIOS">Años</option>
              </select>
            </div>
          </div>
        </ng-container>

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
export class FacturaEmisionHeaderComponent implements OnInit {
  @Input() parentForm!: FormGroup;
  @Input() establecimientos: Establecimiento[] = [];
  @Input() puntosEmisionFiltered: PuntoEmision[] = [];

  readonly formasPago = SRI_FORMAS_PAGO;

  get requierePlazo(): boolean {
    return FORMA_PAGO_REQUIERE_PLAZO(this.parentForm?.get('forma_pago_sri')?.value);
  }

  ngOnInit() {}
}

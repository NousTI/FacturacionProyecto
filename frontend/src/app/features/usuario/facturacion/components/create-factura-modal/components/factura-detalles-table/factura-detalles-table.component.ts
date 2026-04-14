import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { Producto } from '../../../../../../../domain/models/producto.model';
import { SRI_IVA_TARIFAS } from '../../../../../../../core/constants/sri-iva.constants';

import { FacturaCalculationService } from '../../../../services/factura-calculation.service';

@Component({
  selector: 'app-factura-detalles-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="section-lux mb-4" [formGroup]="parentForm">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="section-title-lux mb-0">
          <i class="bi bi-cart-fill me-2"></i> Detalle de Productos
        </div>
        <button type="button" class="btn btn-add-lux-white" (click)="onAdd.emit()">
          <i class="bi bi-plus-lg"></i> Agregar Item
        </button>
      </div>

      <div class="table-responsive rounded-3 overflow-hidden border">
        <table class="table table-lux-white align-middle mb-0">
          <thead>
            <tr>
              <th style="min-width: 250px;">Producto / Descripción</th>
              <th style="width: 90px;" class="text-center">Cant.</th>
              <th style="width: 140px;" class="text-center">P. Unit ($)</th>
              <th style="width: 130px;" class="text-center">Desc. ($)</th>
              <th style="width: 130px;">IVA</th>
              <th style="width: 130px;" class="text-end">Subtotal</th>
              <th style="width: 50px;"></th>
            </tr>
          </thead>
          <tbody formArrayName="detalles">
            <tr *ngFor="let item of getDetallesControls(); let i=index" [formGroupName]="i" class="border-bottom-light">
              <td>
                <div class="select-lux-wrapper mb-1">
                  <select class="select-lux input-sm" formControlName="producto_id" (change)="onProductSelect.emit(i)">
                    <option [ngValue]="null">Seleccione Producto...</option>
                    <option *ngFor="let prod of productos" [value]="prod.id">{{ prod.nombre }}</option>
                  </select>
                </div>
                <input *ngIf="!item.get('producto_id')?.value" type="text" 
                       class="input-lux input-sm" 
                       placeholder="Descripción manual..." 
                       formControlName="descripcion">
              </td>
              <td>
                <input type="text" class="input-lux input-sm text-end" 
                       [class.is-invalid]="item.get('cantidad')?.invalid && item.get('cantidad')?.touched"
                       formControlName="cantidad" placeholder="0.00"
                       (keypress)="validateInput($event)"
                       (input)="onInputChange($event, 'cantidad', i)">
              </td>
              <td>
                <div class="input-lux-wrapper input-sm">
                  <span class="prefix">$</span>
                  <input type="text" class="input-lux text-end" 
                         [class.is-invalid]="item.get('precio_unitario')?.invalid && item.get('precio_unitario')?.touched"
                         formControlName="precio_unitario" placeholder="0.00"
                         (keypress)="validateInput($event)"
                         (input)="onInputChange($event, 'precio_unitario', i)">
                </div>
              </td>
                <td>
                <div class="input-lux-wrapper input-sm">
                  <span class="prefix">$</span>
                  <input type="text" class="input-lux text-end" 
                         [class.is-invalid]="item.get('descuento')?.invalid && item.get('descuento')?.touched"
                         formControlName="descuento" placeholder="0.00"
                         (keypress)="validateInput($event)"
                         (input)="onInputChange($event, 'descuento', i)">
                </div>
              </td>
              <td>
                <div class="select-lux-wrapper">
                  <select class="select-lux input-sm" formControlName="tipo_iva">
                    <option *ngFor="let rate of IVA_RATES" [value]="rate.code">
                      {{ rate.percentage }}%
                    </option>
                  </select>
                </div>
              </td>
              <td class="text-end fw-bold text-dark font-monospace">
                {{ calculateRowTotal(i) | currency:'USD':'symbol':'1.2-2' }}
              </td>
              <td class="text-center">
                <button type="button" class="btn-delete-lux" (click)="onRemove.emit(i)">
                  <i class="bi bi-trash-fill"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div *ngIf="getDetallesControls().length === 0" class="empty-state-lux py-5 text-center">
        <i class="bi bi-bag-plus text-muted mb-3 d-block" style="font-size: 2.5rem;"></i>
        <p class="text-muted small fw-bold mb-0">No se han agregado productos a la factura</p>
      </div>
    </div>
  `
})
export class FacturaDetallesTableComponent {
  @Input() parentForm!: FormGroup;
  @Input() productos: Producto[] = [];

  readonly IVA_RATES = SRI_IVA_TARIFAS;

  @Output() onAdd = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<number>();
  @Output() onProductSelect = new EventEmitter<number>();

  constructor(private calculationService: FacturaCalculationService) {}

  getDetallesControls() {
    const array = this.parentForm.get('detalles') as FormArray;
    return array ? array.controls : [];
  }

  calculateRowTotal(index: number): number {
    const array = this.parentForm.get('detalles') as FormArray;
    if (!array || !array.at(index)) return 0;
    return this.calculationService.calculateRowTotal(array.at(index).value);
  }

  validateInput(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    // Permitir números (48-57) y punto (46). Bloquear el resto (incluyendo -)
    if (charCode !== 46 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    // No permitir más de un punto via teclado
    const input = event.target as HTMLInputElement;
    if (charCode === 46 && input.value.includes('.')) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onInputChange(event: any, controlName: string, index: number) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // 1. Limpieza de caracteres no permitidos (por si pegan texto)
    value = value.replace(/[^0-9.]/g, '');

    // 2. Solo un punto permitido
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }

    // 3. Limitar a 2 decimales
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }

    // 4. Limite de valor (1,000,000)
    const numeric = parseFloat(value);
    if (!isNaN(numeric) && numeric > 1000000) {
      value = '1000000';
    }

    // Actualizar control sin disparar recursividad infinita si es posible
    const array = this.parentForm.get('detalles') as FormArray;
    const control = array.at(index).get(controlName);
    
    if (control && control.value !== value) {
      control.setValue(value, { emitEvent: true });
      input.value = value;
    }
  }
}

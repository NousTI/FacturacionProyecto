import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormArray } from '@angular/forms';
import { Producto } from '../../../../../../../domain/models/producto.model';

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
              <th style="min-width: 300px;">Producto / Descripción</th>
              <th style="width: 100px;">Cant.</th>
              <th style="width: 140px;">P. Unit ($)</th>
              <th style="width: 120px;">Desc. ($)</th>
              <th style="width: 110px;">IVA</th>
              <th style="width: 140px;" class="text-end">Subtotal</th>
              <th style="width: 60px;"></th>
            </tr>
          </thead>
          <tbody formArrayName="detalles">
            <tr *ngFor="let item of getDetallesControls(); let i=index" [formGroupName]="i" class="border-bottom-light">
              <td>
                <div class="select-lux-wrapper">
                  <select class="select-lux input-sm" formControlName="producto_id" (change)="onProductSelect.emit(i)">
                    <option [ngValue]="null">Seleccione Producto...</option>
                    <option *ngFor="let prod of productos" [value]="prod.id">{{ prod.nombre }}</option>
                  </select>
                </div>
                <input *ngIf="!item.get('producto_id')?.value" type="text" 
                       class="input-lux input-sm mt-2" 
                       placeholder="Descripción manual..." 
                       formControlName="descripcion">
              </td>
              <td>
                <input type="number" class="input-lux input-sm text-center" 
                       formControlName="cantidad" min="1">
              </td>
              <td>
                <div class="input-lux-wrapper input-sm">
                  <span class="prefix">$</span>
                  <input type="number" class="input-lux" 
                         formControlName="precio_unitario" min="0">
                </div>
              </td>
                <td>
                <div class="input-lux-wrapper input-sm">
                  <span class="prefix">$</span>
                  <input type="number" class="input-lux" 
                         formControlName="descuento" min="0">
                </div>
              </td>
              <td>
                <div class="select-lux-wrapper">
                  <select class="select-lux input-sm" formControlName="tipo_iva">
                    <option value="0">0%</option>
                    <option value="4">15% (Actual)</option>
                  </select>
                </div>
              </td>
              <td class="text-end fw-bold text-dark fs-6">
                {{ calculateRowTotal(i) | currency:'USD' }}
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

  @Output() onAdd = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<number>();
  @Output() onProductSelect = new EventEmitter<number>();

  getDetallesControls() {
    const array = this.parentForm.get('detalles') as FormArray;
    return array ? array.controls : [];
  }

  calculateRowTotal(index: number): number {
    const array = this.parentForm.get('detalles') as FormArray;
    if (!array || !array.at(index)) return 0;
    const row = array.at(index).value;
    const subtotal = (row.cantidad * row.precio_unitario) - (row.descuento || 0);
    return subtotal > 0 ? subtotal : 0;
  }
}

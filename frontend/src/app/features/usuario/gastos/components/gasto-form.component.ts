import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Gasto, GastoCreate, GastoUpdate } from '../../../../domain/models/gasto.model';
import { CategoriaGasto } from '../../../../domain/models/categoria-gasto.model';
import { Proveedor } from '../../../../domain/models/proveedor.model';

@Component({
  selector: 'app-gasto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="editorial-form-wrapper">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="editorial-grid-2">
          <!-- Concepto -->
          <div class="col-span-2">
            <label class="editorial-label">Concepto / Descripción</label>
            <input 
              type="text" 
              class="editorial-input" 
              formControlName="concepto" 
              placeholder="Ej: Pago de servicios básicos - Marzo"
              [class.is-invalid]="isInvalid('concepto')"
            >
            <div class="invalid-feedback-minimal" *ngIf="isInvalid('concepto')">Este campo es obligatorio.</div>
          </div>

          <!-- Categoría -->
          <div>
            <label class="editorial-label">Categoría</label>
            <select 
              class="editorial-input" 
              formControlName="categoria_gasto_id" 
              [class.is-invalid]="isInvalid('categoria_gasto_id')"
            >
              <option value="">Seleccionar...</option>
              <option *ngFor="let cat of categorias" [value]="cat.id">{{ cat.tipo | uppercase }} | {{ cat.nombre }}</option>
            </select>
          </div>

          <!-- Proveedor -->
          <div>
            <label class="editorial-label">Proveedor</label>
            <select class="editorial-input" formControlName="proveedor_id">
              <option value="">S/P | Ninguno</option>
              <option *ngFor="let prov of proveedores" [value]="prov.id">{{ prov.razon_social }}</option>
            </select>
          </div>

          <!-- Factura -->
          <div>
            <label class="editorial-label">Nº de Factura</label>
            <input type="text" class="editorial-input" formControlName="numero_factura" placeholder="000-000-000000000">
          </div>

          <!-- Fecha Emisión -->
          <div>
            <label class="editorial-label">Fecha de Emisión</label>
            <input 
              type="date" 
              class="editorial-input" 
              formControlName="fecha_emision" 
              [class.is-invalid]="isInvalid('fecha_emision')"
            >
          </div>

          <!-- Subtotal -->
          <div>
            <label class="editorial-label">Subtotal</label>
            <div class="input-editorial-group">
              <span class="addon">$</span>
              <input
                type="number"
                class="editorial-input addon-field"
                formControlName="subtotal"
                step="0.01"
                (keydown)="onlyPositiveNumbers($event)"
                (input)="limitDecimalInput($event); calculateTotal()"
                [class.is-invalid]="isInvalid('subtotal')"
              >
            </div>
          </div>

          <!-- IVA -->
          <div>
            <label class="editorial-label">IVA</label>
            <div class="input-editorial-group">
              <span class="addon">$</span>
              <input
                type="number"
                class="editorial-input addon-field"
                formControlName="iva"
                step="0.01"
                (keydown)="onlyPositiveNumbers($event)"
                (input)="limitDecimalInput($event); calculateTotal()"
                [class.is-invalid]="isInvalid('iva')"
              >
            </div>
          </div>

          <!-- Total (Integrated Result) -->
          <div class="total-result-area">
            <label class="editorial-label text-white-muted">Total a Pagar</label>
            <div class="d-flex align-items-center">
              <span class="currency-symbol">$</span>
              <input 
                type="number" 
                class="total-input-clean" 
                formControlName="total" 
                readonly
              >
            </div>
          </div>

          <!-- Estado -->
          <div>
            <label class="editorial-label">Estado Inicial</label>
            <select class="editorial-input" formControlName="estado_pago">
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado Total</option>
            </select>
          </div>

          <!-- Observaciones -->
          <div class="col-span-2">
            <label class="editorial-label">Observaciones</label>
            <textarea class="editorial-input" formControlName="observaciones" rows="1"></textarea>
          </div>
        </div>

        <!-- Acciones -->
        <div class="d-flex justify-content-end gap-3 mt-5 pt-3 border-top-editorial" *ngIf="!viewOnly">
          <button type="button" class="btn-editorial-secondary" (click)="cancel.emit()">
            Cancelar
          </button>
          <button type="submit" class="btn-system-action px-5" [disabled]="form.invalid || loading || (editMode && !hasChanges)">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ editMode ? 'GUARDAR CAMBIOS' : 'REGISTRAR GASTO' }}
          </button>
        </div>

        <div class="d-flex justify-content-end mt-5 pt-3 border-top-editorial" *ngIf="viewOnly">
          <button type="button" class="btn-system-action px-5" (click)="cancel.emit()">
            CERRAR DETALLES
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .editorial-form-wrapper { padding: 1.5rem; }
    
    .editorial-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .col-span-2 { grid-column: span 2; }
    
    .editorial-label { 
      display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 0.5rem;
    }
    .text-white-muted { color: #94a3b8; }
    
    .editorial-input { 
      width: 100%; padding: 0.85rem 1.25rem; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; font-weight: 500; color: #1a1a1a; transition: all 0.2s ease; background: #ffffff;
    }
    .editorial-input:focus { outline: none; border-color: #161d35; background-color: #ffffff; }
    .editorial-input.is-invalid { border-color: #ef4444; }
    
    .input-editorial-group { display: flex; align-items: stretch; border-radius: 12px; overflow: hidden; border: 1.5px solid #e2e8f0; }
    .input-editorial-group:focus-within { border-color: #161d35; }
    .addon { background: #f8fafc; padding: 0 1rem; display: flex; align-items: center; border-right: 1.5px solid #e2e8f0; color: #64748b; font-weight: 700; }
    .addon-field { border: none !important; border-radius: 0; }
    
    .total-result-area { background: #161d35; padding: 1rem 1.25rem; border-radius: 16px; color: white; display: flex; flex-direction: column; justify-content: center; }
    .currency-symbol { font-size: 1.25rem; font-weight: 800; margin-right: 0.5rem; color: #94a3b8; }
    .total-input-clean { background: transparent; border: none; font-size: 1.75rem; font-weight: 900; color: white; width: 100%; outline: none; pointer-events: none; }
    
    .invalid-feedback-minimal { font-size: 0.75rem; color: #ef4444; font-weight: 500; margin-top: 0.4rem; }
    
    .border-top-editorial { border-top: 1px solid #f1f5f9; }
    
    .btn-system-action { 
      background: #111827; color: #ffffff; border: none; padding: 1rem 2.5rem; border-radius: 12px; font-weight: 800; font-size: 0.85rem; letter-spacing: 0.05em; transition: all 0.2s; 
    }
    .btn-system-action:hover { background: #000000; transform: translateY(-1px); }
    
    .btn-editorial-secondary { 
      background: #f8fafc; color: #64748b; border: 1.5px solid #e2e8f0; padding: 1rem 2.5rem; border-radius: 12px; font-weight: 800; font-size: 0.85rem; letter-spacing: 0.05em; transition: all 0.2s; 
    }
    .btn-editorial-secondary:hover { background: #f1f5f9; color: #1a1a1a; border-color: #cbd5e1; }
  `]
})
export class GastoFormComponent implements OnInit {
  @Input() editData: Gasto | null = null;
  @Input() categorias: CategoriaGasto[] = [];
  @Input() proveedores: Proveedor[] = [];
  @Input() loading = false;
  @Input() viewOnly = false;

  @Output() onSubmit = new EventEmitter<GastoCreate | GastoUpdate>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  editMode = false;
  private initialValue: any;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      categoria_gasto_id: ['', Validators.required],
      proveedor_id: [''],
      numero_factura: [''],
      concepto: ['', [Validators.required, Validators.minLength(3)]],
      fecha_emision: [new Date().toISOString().split('T')[0], Validators.required],
      fecha_vencimiento: [''],
      subtotal: [0, [Validators.required, Validators.min(0.01)]],
      iva: [0, [Validators.min(0)]],
      total: [{ value: 0, disabled: false }, [Validators.required, Validators.min(0.01)]],
      estado_pago: ['pendiente'],
      observaciones: ['']
    });
  }

  ngOnInit() {
    if (this.editData) {
      this.editMode = true;
      this.form.patchValue({
        ...this.editData,
        fecha_emision: this.editData.fecha_emision?.split('T')[0],
        fecha_vencimiento: this.editData.fecha_vencimiento?.split('T')[0]
      });
      this.initialValue = this.form.getRawValue();

      // Si el gasto ya está pagado, bloquear campos financieros pero permitir número de factura/observaciones
      if (this.editData.estado_pago === 'pagado') {
        this.form.get('concepto')?.disable();
        this.form.get('categoria_gasto_id')?.disable();
        this.form.get('proveedor_id')?.disable();
        this.form.get('subtotal')?.disable();
        this.form.get('iva')?.disable();
        this.form.get('total')?.disable();
        this.form.get('fecha_emision')?.disable();
        this.form.get('estado_pago')?.disable();
      }
    }

    if (this.viewOnly) {
      this.form.disable();
    }
  }

  get hasChanges(): boolean {
    if (!this.editMode || !this.initialValue) return true;
    const current = this.form.getRawValue();
    return JSON.stringify(current) !== JSON.stringify(this.initialValue);
  }

  calculateTotal() {
    const subtotal = this.form.get('subtotal')?.value || 0;
    const iva = this.form.get('iva')?.value || 0;
    this.form.patchValue({ total: Number((subtotal + iva).toFixed(2)) }, { emitEvent: false });
  }

  onlyPositiveNumbers(event: KeyboardEvent) {
    if (['-', 'e', 'E', '+'].includes(event.key)) {
      event.preventDefault();
    }
  }

  limitDecimalInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Limitar a 10 dígitos enteros + 2 decimales (máximo 12 caracteres incluyendo el punto)
    const regex = /^\d{0,10}(?:\.\d{0,2})?$/;

    if (!regex.test(value) && value !== '') {
      // Si no cumple, removemos el último carácter
      input.value = value.slice(0, -1);
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submit() {
    if (this.form.valid) {
      const rawValue = this.form.getRawValue();
      
      // Limpiar campos opcionales que vienen como strings vacíos
      const cleanData = { ...rawValue };
      if (!cleanData.proveedor_id) cleanData.proveedor_id = null;
      if (!cleanData.numero_factura) cleanData.numero_factura = null;
      if (!cleanData.fecha_vencimiento) cleanData.fecha_vencimiento = null;
      if (!cleanData.observaciones) cleanData.observaciones = null;
      
      this.onSubmit.emit(cleanData);
    }
  }
}

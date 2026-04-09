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
    <div class="form-container">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid">
          <!-- Concepto -->
          <div class="form-group full-width">
            <label class="form-label">
              <i class="bi bi-pencil-square"></i> Concepto / Descripción *
            </label>
            <input 
              type="text" 
              class="form-control" 
              formControlName="concepto" 
              placeholder="Ej: Pago de servicios básicos - Marzo"
              [class.is-invalid]="isInvalid('concepto')"
            >
            <div class="invalid-feedback" *ngIf="isInvalid('concepto')">
              El concepto es obligatorio.
            </div>
          </div>

          <!-- Categoría -->
          <div class="form-group">
            <label class="form-label">
              <i class="bi bi-tag"></i> Categoría *
            </label>
            <select 
              class="form-select" 
              formControlName="categoria_gasto_id" 
              [class.is-invalid]="isInvalid('categoria_gasto_id')"
            >
              <option value="">Selecciona una categoría...</option>
              <option *ngFor="let cat of categorias" [value]="cat.id">{{ cat.tipo | uppercase }} | {{ cat.nombre }}</option>
            </select>
          </div>

          <!-- Proveedor -->
          <div class="form-group">
            <label class="form-label">
              <i class="bi bi-truck"></i> Proveedor
            </label>
            <select class="form-select" formControlName="proveedor_id">
              <option value="">Ninguno / Seleccionar...</option>
              <option *ngFor="let prov of proveedores" [value]="prov.id">{{ prov.razon_social }}</option>
            </select>
          </div>

          <!-- Factura -->
          <div class="form-group">
            <label class="form-label">
              <i class="bi bi-receipt"></i> Nº de Factura
            </label>
            <input type="text" class="form-control" formControlName="numero_factura" placeholder="001-001-000000001">
          </div>

          <!-- Fechas -->
          <div class="form-group">
            <label class="form-label">
              <i class="bi bi-calendar-event"></i> Fecha de Emisión *
            </label>
            <input 
              type="date" 
              class="form-control" 
              formControlName="fecha_emision" 
              [class.is-invalid]="isInvalid('fecha_emision')"
            >
          </div>

          <div class="form-group">
            <label class="form-label">
              <i class="bi bi-calendar-check"></i> Fecha de Vencimiento
            </label>
            <input 
              type="date" 
              class="form-control" 
              formControlName="fecha_vencimiento"
            >
          </div>

          <!-- Subtotal -->
          <div class="form-group">
            <label class="form-label">
              <i class="bi bi-calculator"></i> Subtotal *
            </label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input 
                type="number" 
                class="form-control" 
                formControlName="subtotal" 
                step="0.01"
                (keydown)="onlyPositiveNumbers($event)"
                (input)="calculateTotal()"
                [class.is-invalid]="isInvalid('subtotal')"
              >
              <div class="invalid-feedback" *ngIf="isInvalid('subtotal')">
                El subtotal debe ser un número positivo.
              </div>
            </div>
          </div>

          <!-- IVA -->
          <div class="form-group">
            <label class="form-label">
              <i class="bi bi-plus-circle"></i> IVA
            </label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input 
                type="number" 
                class="form-control" 
                formControlName="iva" 
                step="0.01"
                (keydown)="onlyPositiveNumbers($event)"
                (input)="calculateTotal()"
                [class.is-invalid]="isInvalid('iva')"
              >
              <div class="invalid-feedback" *ngIf="isInvalid('iva')">
                El IVA no puede ser negativo.
              </div>
            </div>
          </div>

          <!-- Total (ReadOnly) -->
          <div class="form-group">
            <label class="form-label fw-bold text-primary">
              <i class="bi bi-cash-stack"></i> TOTAL A PAGAR
            </label>
            <div class="input-group">
              <span class="input-group-text bg-primary text-white border-primary">$</span>
              <input 
                type="number" 
                class="form-control fw-bold border-primary" 
                formControlName="total" 
                readonly
              >
            </div>
          </div>

          <!-- Estado -->
          <div class="form-group">
            <label class="form-label">
              <i class="bi bi-info-circle"></i> Estado Inicial
            </label>
            <select class="form-select" formControlName="estado_pago">
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado Total</option>
            </select>
          </div>

          <!-- Observaciones -->
          <div class="form-group full-width">
            <label class="form-label">Observaciones</label>
            <textarea class="form-control" formControlName="observaciones" rows="2"></textarea>
          </div>
        </div>

        <div class="form-actions d-flex justify-content-end gap-2 mt-4" *ngIf="!viewOnly">
          <button type="button" class="btn btn-light" (click)="cancel.emit()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary px-4" [disabled]="form.invalid || loading || (editMode && !hasChanges)">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
            {{ editMode ? 'Actualizar Gasto' : 'Registrar Gasto' }}
          </button>
        </div>

        <div class="form-actions d-flex justify-content-end mt-4" *ngIf="viewOnly">
          <button type="button" class="btn btn-primary px-4" (click)="cancel.emit()">
            Cerrar Detalles
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .form-container { animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .full-width { grid-column: span 2; }
    
    .form-label { font-size: 0.85rem; font-weight: 600; color: #4b5563; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem; }
    .form-label i { color: #6366f1; }
    
    .form-control, .form-select {
      padding: 0.6rem 0.8rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.95rem;
      transition: all 0.2s;
    }
    
    .form-control:focus, .form-select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }
    
    .input-group-text {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px 0 0 10px;
    }
    
    .is-invalid { border-color: #ef4444 !important; }
    .invalid-feedback { font-size: 0.75rem; color: #ef4444; margin-top: 0.2rem; }
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

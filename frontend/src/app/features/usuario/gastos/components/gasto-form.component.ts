import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Gasto, GastoCreate, GastoUpdate } from '../../../../domain/models/gasto.model';
import { CategoriaGasto } from '../../../../domain/models/categoria-gasto.model';
import { Proveedor } from '../../../../domain/models/proveedor.model';
import { ModalFormLayoutComponent } from './modal-form-layout.component';
import { SRI_IVA_TARIFAS } from '../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-gasto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalFormLayoutComponent],
  template: `
    <app-modal-form-layout
      [title]="viewOnly ? 'Detalles del Gasto' : (editMode ? 'Editar Gasto' : 'Nuevo Registro de Gasto')"
      [submitLabel]="viewOnly ? 'CERRAR DETALLES' : (editMode ? 'GUARDAR CAMBIOS' : 'REGISTRAR GASTO')"
      [loading]="loading"
      [submitDisabled]="form.invalid || (editMode && !hasChanges)"
      [viewOnly]="viewOnly"
      (onCancel)="cancel.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" id="formContent" [class.view-only-blocker]="viewOnly">
        <div class="editorial-grid-2">
          <div class="col-span-2">
            <label class="editorial-label">Concepto / Descripción</label>
            <input
              type="text"
              class="editorial-input"
              formControlName="concepto"
              placeholder="Ej: Pago de servicios básicos - Marzo"
              [class.is-invalid]="isInvalid('concepto')"
              [readonly]="viewOnly"
            >
            <div class="invalid-feedback-minimal" *ngIf="isInvalid('concepto')">Este campo es obligatorio.</div>
          </div>

          <div>
            <label class="editorial-label">Categoría</label>
            <select class="editorial-input" formControlName="categoria_gasto_id" [class.is-invalid]="isInvalid('categoria_gasto_id')" [attr.disabled]="viewOnly ? true : null">
              <option value="">Seleccionar...</option>
              <option *ngFor="let cat of categorias" [value]="cat.id">{{ cat.tipo | uppercase }} | {{ cat.nombre }}</option>
            </select>
          </div>

          <div>
            <label class="editorial-label">Proveedor</label>
            <select class="editorial-input" formControlName="proveedor_id" [attr.disabled]="viewOnly ? true : null">
              <option value="">S/P | Ninguno</option>
              <option *ngFor="let prov of proveedores" [value]="prov.id">{{ prov.razon_social }}</option>
            </select>
          </div>

          <div>
            <label class="editorial-label">Nº de Factura *</label>
            <input
              type="text"
              class="editorial-input"
              formControlName="numero_factura"
              placeholder="000-000-000000000"
              [class.is-invalid]="isInvalid('numero_factura')"
              [readonly]="viewOnly"
            >
            <div class="invalid-feedback-minimal" *ngIf="isInvalid('numero_factura')">Este campo es obligatorio.</div>
          </div>

          <div>
            <label class="editorial-label">Fecha de Emisión</label>
            <input type="date" class="editorial-input" formControlName="fecha_emision" [class.is-invalid]="isInvalid('fecha_emision')" [readonly]="viewOnly">
          </div>

          <div>
            <label class="editorial-label">Fecha de Vencimiento</label>
            <input type="date" class="editorial-input" formControlName="fecha_vencimiento" [readonly]="viewOnly">
          </div>

          <div>
            <label class="editorial-label">Subtotal</label>
            <div class="input-editorial-group">
              <span class="addon">$</span>
              <input type="number" class="addon-field" formControlName="subtotal" step="0.01"
                (keydown)="onlyPositiveNumbers($event)" (input)="limitDecimalInput($event); calculateTotal()" [readonly]="viewOnly">
            </div>
          </div>

          <div>
            <label class="editorial-label">IVA (Tarifa SRI)</label>
            <select class="editorial-input" formControlName="tipo_iva" (change)="calculateTotal()" [attr.disabled]="viewOnly ? true : null">
              <option *ngFor="let t of sriTarifas" [value]="t.code">{{ t.label }}</option>
            </select>
          </div>

          <div class="total-result-area">
            <label class="editorial-label text-white-muted">Total a Pagar</label>
            <div class="d-flex align-items-center">
              <span class="currency-symbol">$</span>
              <input type="number" class="total-input-clean" formControlName="total" readonly>
            </div>
          </div>

          <div *ngIf="editMode || viewOnly">
            <label class="editorial-label">Estado del Gasto</label>
            <select class="editorial-input" formControlName="estado_pago" [attr.disabled]="true">
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Pago Parcial</option>
              <option value="pagado">Pagado Total</option>
            </select>
          </div>

          <div class="col-span-2">
            <label class="editorial-label">Observaciones</label>
            <textarea class="editorial-input" formControlName="observaciones" rows="2" placeholder="Notas adicionales..." [readonly]="viewOnly"></textarea>
          </div>
        </div>
      </form>
    </app-modal-form-layout>
  `,
  styles: [`
    :host { display: contents; }

    .editorial-form-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #ffffff;
    }

    .editorial-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .col-span-2 { grid-column: span 2; }
    .editorial-label { display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 0.5rem; }
    .editorial-input { width: 100%; padding: 0.85rem 1.25rem; border-radius: 12px; border: 1.5px solid #e2e8f0; font-weight: 500; }
    .editorial-input:focus { outline: none; border-color: #3b82f6; background: white; }
    .editorial-input.is-invalid { border-color: #f43f5e; background: #fff1f2; }
    .invalid-feedback-minimal { color: #f43f5e; font-size: 0.75rem; font-weight: 600; margin-top: 0.4rem; display: block; }
    .input-editorial-group { display: flex; align-items: stretch; border-radius: 12px; overflow: hidden; border: 1.5px solid #e2e8f0; }
    .input-editorial-group:focus-within { border-color: #3b82f6; }
    .addon { background: #f8fafc; padding: 0 1rem; display: flex; align-items: center; border-right: 1.5px solid #e2e8f0; color: #64748b; font-weight: 600; }
    .addon-field { border: none !important; border-radius: 0; flex: 1; padding: 0.85rem 1.25rem; outline: none; font-weight: 500; }
    .total-result-area { background: #161d35; padding: 1rem; border-radius: 16px; color: white; }
    .currency-symbol { font-size: 1rem; color: white; margin-right: 0.5rem; }
    .total-input-clean { background: transparent; border: none; font-size: 1.75rem; font-weight: 900; color: white; width: 100%; outline: none; }
    
    .view-only-blocker {
      pointer-events: none !important;
      user-select: none;
      filter: grayscale(0.2);
    }
  `]
})
export class GastoFormComponent implements OnInit, OnChanges {
  @Input() editData: Gasto | null = null;
  @Input() categorias: CategoriaGasto[] = [];
  @Input() proveedores: Proveedor[] = [];
  @Input() loading = false;
  @Input() viewOnly = false;

  @Output() onSubmit = new EventEmitter<GastoCreate | GastoUpdate>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  editMode = false;
  readonly sriTarifas = SRI_IVA_TARIFAS;
  private initialValue: any;

  constructor(private fb: FormBuilder, private cd: ChangeDetectorRef) {
    this.form = this.fb.group({
      categoria_gasto_id: ['', Validators.required],
      proveedor_id: [''],
      numero_factura: ['', Validators.required],
      concepto: ['', [Validators.required, Validators.minLength(3)]],
      fecha_emision: [new Date().toISOString().split('T')[0], Validators.required],
      fecha_vencimiento: [new Date().toISOString().split('T')[0]],
      subtotal: [0, [Validators.required, Validators.min(0.01)]],
      tipo_iva: ['4'],
      total: [{ value: 0, disabled: true }],
      estado_pago: ['pendiente'],
      observaciones: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editData'] || changes['viewOnly']) {
      this.initForm();
    }
  }

  ngOnInit() {
    // Ya se inicializa en ngOnChanges al recibir los inputs iniciales
  }

  private initForm() {
    this.editMode = !!this.editData;
    
    // Valores base/por defecto
    const baseValues = {
      categoria_gasto_id: '',
      proveedor_id: '',
      numero_factura: '',
      concepto: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_vencimiento: new Date().toISOString().split('T')[0],
      subtotal: 0,
      tipo_iva: '4',
      total: 0,
      estado_pago: 'pendiente',
      observaciones: ''
    };

    // Aplicar habilitación base por si el componente fue reutilizado
    this.form.enable({ emitEvent: false });
    this.form.get('total')?.disable({ emitEvent: false });

    if (this.editData) {
      // Cargamos todo en una sola operación de reset para evitar estados intermedios vacíos
      this.form.reset({
        ...baseValues,
        ...this.editData,
        fecha_emision: this.editData.fecha_emision?.split('T')[0],
        fecha_vencimiento: this.editData.fecha_vencimiento?.split('T')[0],
        tipo_iva: this.editData.tipo_iva || '4',
      }, { emitEvent: false });
      
      this.calculateTotal();
      this.initialValue = this.form.getRawValue();

      // Restricciones si el gasto ya está pagado totalmente
      if (this.editData.estado_pago === 'pagado') {
        ['concepto', 'categoria_gasto_id', 'proveedor_id', 'subtotal', 'tipo_iva', 'fecha_emision', 'fecha_vencimiento', 'estado_pago']
          .forEach(ctrl => this.form.get(ctrl)?.disable({ emitEvent: false }));
      }
    } else {
      this.form.reset(baseValues, { emitEvent: false });
    }

    if (this.viewOnly) {
      this.form.disable({ emitEvent: false });
    }
    
    this.cd.detectChanges();
  }

  get hasChanges(): boolean {
    return this.editMode ? JSON.stringify(this.form.getRawValue()) !== JSON.stringify(this.initialValue) : true;
  }

  calculateTotal() {
    const subtotal = this.form.get('subtotal')?.value || 0;
    const tipoIva = this.form.get('tipo_iva')?.value || '4';
    const tarifa = this.sriTarifas.find(t => t.code === tipoIva);
    const ivaPct = tarifa ? tarifa.percentage : 0;
    
    const ivaValor = Number(((subtotal * ivaPct) / 100).toFixed(2));
    this.form.patchValue({ total: Number((subtotal + ivaValor).toFixed(2)) }, { emitEvent: false });
  }

  onlyPositiveNumbers(event: KeyboardEvent) {
    if (['-', 'e', 'E', '+'].includes(event.key)) event.preventDefault();
  }

  limitDecimalInput(event: any) {
    const regex = /^\d{0,10}(?:\.\d{0,2})?$/;
    if (!regex.test(event.target.value)) event.target.value = event.target.value.slice(0, -1);
  }

  isInvalid(name: string) {
    const control = this.form.get(name);
    return control?.invalid && (control.dirty || control.touched);
  }

  submit() {
    if (this.form.valid) {
      const rowValue = this.form.getRawValue();
      
      // Limpiar campos opcionales que llegan como strings vacíos
      const cleanData = {
        ...rowValue,
        proveedor_id: rowValue.proveedor_id || null,
        numero_factura: rowValue.numero_factura || null,
        observaciones: rowValue.observaciones || null
      };

      this.onSubmit.emit(cleanData);
    }
  }
}
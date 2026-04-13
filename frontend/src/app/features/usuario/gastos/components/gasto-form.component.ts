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
    <div class="editorial-form-container">
      <div class="form-header-editorial">
        <h4 class="form-title-editorial">
          {{ viewOnly ? 'Detalles del Gasto' : (editMode ? 'Editar Gasto' : 'Nuevo Registro de Gasto') }}
        </h4>
      </div>

      <div class="form-body-scroll">
        <form [formGroup]="form" (ngSubmit)="submit()" id="gastoForm">
          <div class="editorial-grid-2">
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

            <div>
              <label class="editorial-label">Categoría</label>
              <select class="editorial-input" formControlName="categoria_gasto_id" [class.is-invalid]="isInvalid('categoria_gasto_id')">
                <option value="">Seleccionar...</option>
                <option *ngFor="let cat of categorias" [value]="cat.id">{{ cat.tipo | uppercase }} | {{ cat.nombre }}</option>
              </select>
            </div>

            <div>
              <label class="editorial-label">Proveedor</label>
              <select class="editorial-input" formControlName="proveedor_id">
                <option value="">S/P | Ninguno</option>
                <option *ngFor="let prov of proveedores" [value]="prov.id">{{ prov.razon_social }}</option>
              </select>
            </div>

            <div>
              <label class="editorial-label">Nº de Factura</label>
              <input type="text" class="editorial-input" formControlName="numero_factura" placeholder="000-000-000000000">
            </div>

            <div>
              <label class="editorial-label">Fecha de Emisión</label>
              <input type="date" class="editorial-input" formControlName="fecha_emision" [class.is-invalid]="isInvalid('fecha_emision')">
            </div>

            <div>
              <label class="editorial-label">Subtotal</label>
              <div class="input-editorial-group">
                <span class="addon">$</span>
                <input type="number" class="editorial-input addon-field" formControlName="subtotal" step="0.01"
                  (keydown)="onlyPositiveNumbers($event)" (input)="limitDecimalInput($event); calculateTotal()">
              </div>
            </div>

            <div>
              <label class="editorial-label">IVA</label>
              <div class="input-editorial-group">
                <span class="addon">$</span>
                <input type="number" class="editorial-input addon-field" formControlName="iva" step="0.01"
                  (keydown)="onlyPositiveNumbers($event)" (input)="limitDecimalInput($event); calculateTotal()">
              </div>
            </div>

            <div class="total-result-area">
              <label class="editorial-label text-white-muted">Total a Pagar</label>
              <div class="d-flex align-items-center">
                <span class="currency-symbol">$</span>
                <input type="number" class="total-input-clean" formControlName="total" readonly>
              </div>
            </div>

            <div>
              <label class="editorial-label">Estado Inicial</label>
              <select class="editorial-input" formControlName="estado_pago">
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado Total</option>
              </select>
            </div>

            <div class="col-span-2">
              <label class="editorial-label">Observaciones</label>
              <textarea class="editorial-input" formControlName="observaciones" rows="2" placeholder="Notas adicionales..."></textarea>
            </div>
          </div>
        </form>
      </div>

      <div class="form-footer-editorial">
        <div class="d-flex justify-content-end gap-3 w-100" *ngIf="!viewOnly">
          <button type="button" class="btn-editorial-secondary" (click)="cancel.emit()">Cancelar</button>
          <button type="submit" form="gastoForm" class="btn-system-action px-5" [disabled]="form.invalid || loading || (editMode && !hasChanges)">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ editMode ? 'GUARDAR CAMBIOS' : 'REGISTRAR GASTO' }}
          </button>
        </div>
        <div class="d-flex justify-content-end w-100" *ngIf="viewOnly">
          <button type="button" class="btn-system-action px-5" (click)="cancel.emit()">CERRAR DETALLES</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: hidden; }

    .editorial-form-container {
      display: flex;
      flex-direction: column;
      height: 100%; /* Toma la altura del padre */
      background: #ffffff;
    }

    .form-header-editorial {
      padding: 1.5rem 1.5rem 0 1.5rem;
      flex-shrink: 0; /* No se encoge */
    }

    .form-body-scroll {
      flex-grow: 1; /* Toma el espacio disponible */
      overflow-y: auto; /* Habilita scroll solo aquí */
      padding: 1.5rem;
      scrollbar-width: thin;
      scrollbar-color: #e2e8f0 transparent;
    }

    .form-footer-editorial {
      padding: 1.25rem 1.5rem;
      border-top: 1.5px solid #f1f5f9;
      flex-shrink: 0; /* No se encoge */
      background: #ffffff;
    }

    .form-title-editorial { 
      font-size: 1.2rem; font-weight: 800; color: #161d35; 
      margin-bottom: 1rem; padding-bottom: 1rem; 
      border-bottom: 1.5px solid #f1f5f9;
    }
    
    .editorial-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .col-span-2 { grid-column: span 2; }
    .editorial-label { display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 0.5rem; }
    .editorial-input { width: 100%; padding: 0.85rem 1.25rem; border-radius: 12px; border: 1.5px solid #e2e8f0; font-weight: 500; }
    .total-result-area { background: #161d35; padding: 1rem; border-radius: 16px; color: white; }
    .total-input-clean { background: transparent; border: none; font-size: 1.75rem; font-weight: 900; color: white; width: 100%; outline: none; }
    .btn-system-action { background: #111827; color: #ffffff; border: none; padding: 0.9rem 2rem; border-radius: 12px; font-weight: 800; }
    .btn-editorial-secondary { background: #f8fafc; color: #64748b; border: 1.5px solid #e2e8f0; padding: 0.9rem 2rem; border-radius: 12px; font-weight: 800; }
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
      subtotal: [0, [Validators.required, Validators.min(0.01)]],
      iva: [0, [Validators.min(0)]],
      total: [0],
      estado_pago: ['pendiente'],
      observaciones: ['']
    });
  }

  ngOnInit() {
    if (this.editData) {
      this.editMode = true;
      this.form.patchValue({
        ...this.editData,
        fecha_emision: this.editData.fecha_emision?.split('T')[0]
      });
      this.initialValue = this.form.getRawValue();
      if (this.editData.estado_pago === 'pagado') {
        ['concepto', 'categoria_gasto_id', 'proveedor_id', 'subtotal', 'iva', 'total', 'fecha_emision', 'estado_pago'].forEach(ctrl => this.form.get(ctrl)?.disable());
      }
    }
    if (this.viewOnly) this.form.disable();
  }

  get hasChanges(): boolean {
    return this.editMode ? JSON.stringify(this.form.getRawValue()) !== JSON.stringify(this.initialValue) : true;
  }

  calculateTotal() {
    const subtotal = this.form.get('subtotal')?.value || 0;
    const iva = this.form.get('iva')?.value || 0;
    this.form.patchValue({ total: Number((subtotal + iva).toFixed(2)) });
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
    if (this.form.valid) this.onSubmit.emit(this.form.getRawValue());
  }
}
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PagoGasto, PagoGastoCreate, PagoGastoUpdate } from '../../../../domain/models/pago-gasto.model';
import { Gasto } from '../../../../domain/models/gasto.model';

@Component({
  selector: 'app-pago-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-container">
      <div class="expense-quick-info mb-4" *ngIf="selectedGasto">
        <label class="text-xs text-muted text-uppercase fw-bold">Aplicar pago a:</label>
        <div class="d-flex justify-content-between align-items-center mt-1">
          <div>
            <span class="d-block fw-bold">{{ selectedGasto.concepto }}</span>
            <small class="text-muted">Factura: {{ selectedGasto.numero_factura || 'S/N' }}</small>
          </div>
          <div class="text-end">
            <span class="d-block fw-bold text-primary">\${{ selectedGasto.total | number:'1.2-2' }}</span>
            <span class="badge" [ngClass]="'badge-' + selectedGasto.estado_pago">{{ selectedGasto.estado_pago }}</span>
          </div>
        </div>
      </div>

      <div class="alert alert-info alert-sm mb-3" *ngIf="editMode && gastoEsPagado">
        <i class="bi bi-lock me-2"></i>
        <span class="fw-500">Este pago está completo.</span> Solo puedes editar campos vacíos.
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid">
          <!-- Gasto Selector (if not pre-selected) -->
          <div class="form-group full-width" *ngIf="!selectedGasto">
            <label class="form-label">Seleccionar Gasto *</label>
            <select class="form-select" formControlName="gasto_id" [class.is-invalid]="isInvalid('gasto_id')">
              <option value="">Seleccione un gasto pendiente...</option>
              <option *ngFor="let g of availableGastos" [value]="g.id">
                {{ g.concepto }} - {{ g.numero_factura || 'S/N' }} (\${{ g.total }})
              </option>
            </select>
          </div>

          <!-- Monto -->
          <div class="form-group">
            <label class="form-label">Monto del Pago *</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input 
                type="number" 
                class="form-control" 
                formControlName="monto" 
                step="0.01"
                (keydown)="onlyPositiveNumbers($event)"
                [class.is-invalid]="isInvalid('monto')"
              >
            </div>
            <div class="invalid-feedback" *ngIf="isInvalid('monto')">
              <span *ngIf="form.get('monto')?.errors?.['required']">El monto es obligatorio.</span>
              <span *ngIf="form.get('monto')?.errors?.['min']">El monto debe ser mayor a 0.</span>
              <span *ngIf="form.get('monto')?.errors?.['max']">
                El monto no puede exceder el total del gasto (\${{ selectedGasto?.total | number:'1.2-2' }}).
              </span>
            </div>
          </div>

          <!-- Fecha -->
          <div class="form-group">
            <label class="form-label">Fecha de Pago *</label>
            <input 
              type="date" 
              class="form-control" 
              formControlName="fecha_pago"
              [class.is-invalid]="isInvalid('fecha_pago')"
            >
          </div>

          <!-- Método -->
          <div class="form-group">
            <label class="form-label">Método de Pago *</label>
            <select class="form-select" formControlName="metodo_pago" [class.is-invalid]="isInvalid('metodo_pago')">
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta de Crédito/Débito</option>
              <option value="cheque">Cheque</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <!-- Referencia -->
          <div class="form-group">
            <label class="form-label">Nº Referencia</label>
            <input type="text" class="form-control" formControlName="numero_referencia" placeholder="Ej: 982347239">
          </div>

          <!-- Comprobante -->
          <div class="form-group">
            <label class="form-label">Nº Comprobante</label>
            <input type="text" class="form-control" formControlName="numero_comprobante" placeholder="Ej: 001-001-000012345">
          </div>

          <!-- Observaciones -->
          <div class="form-group full-width">
            <label class="form-label">Observaciones</label>
            <textarea class="form-control" formControlName="observaciones" rows="3" placeholder="Detalles adicionales del pago..."></textarea>
          </div>
        </div>

        <div class="form-actions d-flex justify-content-end gap-2 mt-4" *ngIf="!viewOnly">
          <button type="button" class="btn btn-light" (click)="cancel.emit()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary px-4" [disabled]="form.invalid || loading || (editMode && !hasChanges)">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
            {{ editMode ? 'Actualizar Pago' : 'Registrar Pago' }}
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
    .form-container { animation: fadeIn 0.3s ease; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .full-width { grid-column: span 2; }

    .expense-quick-info {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 12px;
      border: 1px dashed #cbd5e1;
    }

    .alert-sm {
      padding: 0.6rem 0.8rem;
      font-size: 0.85rem;
      border-radius: 8px;
    }

    .alert-info {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #93c5fd;
    }

    .form-label { font-size: 0.85rem; font-weight: 600; color: #4b5563; margin-bottom: 0.4rem; display: block; }
    .form-control, .form-select { padding: 0.6rem; border-radius: 10px; border: 1px solid #e2e8f0; }

    .badge { padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.7rem; }
    .badge-pendiente { background: #fff7ed; color: #9a3412; }
    .badge-pagado { background: #f0fdf4; color: #166534; }

    .text-xs { font-size: 0.7rem; }
    .fw-500 { font-weight: 500; }
  `]
})
export class PagoFormComponent implements OnInit {
  @Input() editData: PagoGasto | null = null;
  @Input() selectedGasto: Gasto | null = null;
  @Input() availableGastos: Gasto[] = [];
  @Input() loading = false;
  @Input() viewOnly = false;

  @Output() onSubmit = new EventEmitter<PagoGastoCreate | PagoGastoUpdate>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  editMode = false;
  private initialValue: any;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      gasto_id: ['', Validators.required],
      monto: [0, [Validators.required, Validators.min(0.01)]],
      fecha_pago: [new Date().toISOString().split('T')[0], Validators.required],
      metodo_pago: ['transferencia', Validators.required],
      numero_referencia: [''],
      numero_comprobante: [''],
      observaciones: ['']
    });
  }

  ngOnInit() {
    this.setupGastoSubscription();

    if (this.selectedGasto) {
      this.onGastoSelected(this.selectedGasto);
    } else if (!this.editMode) {
      this.togglePaymentFields(false);
    }

    if (this.editMode && this.editData) {
      this.editMode = true;
      this.form.patchValue({
        ...this.editData,
        fecha_pago: this.editData.fecha_pago?.split('T')[0]
      });
    }

    // Aplicar restricciones de bloqueo DESPUÉS de cargar datos
    if (this.selectedGasto?.estado_pago === 'pagado' && !this.viewOnly) {
      // Bloquear SIEMPRE estos campos
      this.form.get('gasto_id')?.disable();
      this.form.get('monto')?.disable();
      this.form.get('fecha_pago')?.disable();
      this.form.get('metodo_pago')?.disable();

      // Campos opcionales: bloquear si tienen valor, permitir si están vacíos
      if (this.editData?.numero_referencia) {
        this.form.get('numero_referencia')?.disable();
      }
      if (this.editData?.numero_comprobante) {
        this.form.get('numero_comprobante')?.disable();
      }
      if (this.editData?.observaciones) {
        this.form.get('observaciones')?.disable();
      }
    }

    if (this.editMode && this.editData) {
      this.initialValue = this.form.getRawValue();
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

  get gastoEsPagado(): boolean {
    return this.selectedGasto?.estado_pago === 'pagado';
  }

  private setupGastoSubscription() {
    this.form.get('gasto_id')?.valueChanges.subscribe(id => {
      if (id) {
        const gasto = this.availableGastos.find(g => g.id === id);
        if (gasto) {
          this.onGastoSelected(gasto);
        }
      } else {
        this.togglePaymentFields(false);
        this.selectedGasto = null;
      }
    });
  }

  private onGastoSelected(gasto: Gasto) {
    this.selectedGasto = gasto;
    this.togglePaymentFields(true);
    
    // Si es un nuevo pago, sugerimos el total del gasto
    if (!this.editMode) {
      this.form.patchValue({ 
        gasto_id: gasto.id,
        monto: gasto.total 
      }, { emitEvent: false });
    }

    // Aplicar validador dinámico de máximo
    this.form.get('monto')?.setValidators([
      Validators.required, 
      Validators.min(0.01), 
      Validators.max(gasto.total)
    ]);
    this.form.get('monto')?.updateValueAndValidity();
  }

  private togglePaymentFields(enabled: boolean) {
    const fields = ['monto', 'fecha_pago', 'metodo_pago', 'numero_referencia'];
    fields.forEach(field => {
      if (enabled) {
        this.form.get(field)?.enable({ emitEvent: false });
      } else {
        this.form.get(field)?.disable({ emitEvent: false });
      }
    });
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
      if (this.editMode) {
        // En modo edición, solo enviar campos que cambiaron (dirty)
        const dirtyValues: any = {};
        Object.keys(this.form.controls).forEach(key => {
          const control = this.form.get(key);
          if (control?.dirty || control?.touched) {
            dirtyValues[key] = control?.value;
          }
        });
        this.onSubmit.emit(dirtyValues);
      } else {
        // En modo creación, enviar todos los valores
        this.onSubmit.emit(this.form.getRawValue());
      }
    }
  }
}

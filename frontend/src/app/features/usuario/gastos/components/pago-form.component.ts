import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PagoGasto, PagoGastoCreate, PagoGastoUpdate } from '../../../../domain/models/pago-gasto.model';
import { Gasto } from '../../../../domain/models/gasto.model';
import { ModalFormLayoutComponent } from './modal-form-layout.component';
import { SRI_FORMAS_PAGO } from '../../../../core/constants/sri-iva.constants';

@Component({
  selector: 'app-pago-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalFormLayoutComponent],
  template: `
    <app-modal-form-layout
      [title]="viewOnly ? 'Detalles del Pago' : (editMode ? 'Editar Pago Registrado' : 'Registrar Nuevo Pago')"
      [submitLabel]="viewOnly ? 'CERRAR DETALLES' : (editMode ? 'GUARDAR PAGO' : 'REGISTRAR PAGO')"
      [loading]="loading"
      [submitDisabled]="form.invalid || (editMode && !hasChanges)"
      [viewOnly]="viewOnly"
      (onCancel)="cancel.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" id="formContent" [class.view-only-blocker]="viewOnly">
        <div class="summary-ticket-premium mb-4" *ngIf="selectedGasto">
          <label class="editorial-label-muted">Aplicar pago a:</label>
          <div class="d-flex justify-content-between align-items-end mt-2">
            <div class="summary-details">
              <span class="summary-title">{{ selectedGasto.concepto }}</span>
              <div class="summary-meta mt-1">
                <span class="badge-code-editorial">FACTURA: {{ selectedGasto.numero_factura || 'S/N' }}</span>
                <span class="badge-status-editorial ms-2" [ngClass]="'status-' + selectedGasto.estado_pago">{{ selectedGasto.estado_pago }}</span>
              </div>
            </div>
            <div class="summary-total text-end">
              <span class="total-label d-block text-uppercase">Total Gasto</span>
              <span class="total-amount">\${{ selectedGasto.total | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>

        <div class="alert-minimalist mb-4" *ngIf="editMode && gastoEsPagado && !viewOnly">
          <span>ESTE PAGO ESTÁ COMPLETADO. SE PERMITEN CAMBIOS EN NOTAS.</span>
        </div>

        <div class="editorial-grid-2">
          <div class="col-span-2" *ngIf="!selectedGasto">
            <label class="editorial-label">Seleccionar Gasto</label>
            <select class="editorial-input" formControlName="gasto_id" [class.is-invalid]="isInvalid('gasto_id')" [attr.disabled]="viewOnly ? true : null">
              <option value="">Seleccione un gasto pendiente...</option>
              <option *ngFor="let g of availableGastos" [value]="g.id">
                {{ g.concepto }} - {{ g.numero_factura || 'S/N' }} (\${{ g.total }})
              </option>
            </select>
          </div>

          <div>
            <label class="editorial-label">Monto del Pago</label>
            <div class="input-editorial-group">
              <span class="addon">$</span>
              <input
                type="number"
                class="editorial-input addon-field"
                formControlName="monto"
                step="0.01"
                (keydown)="onlyPositiveNumbers($event)"
                [class.is-invalid]="isInvalid('monto')"
                [readonly]="viewOnly"
              >
            </div>
            <div class="invalid-feedback-minimal" *ngIf="isInvalid('monto')">Monto inválido o excede el total.</div>
          </div>

          <div>
            <label class="editorial-label">Fecha de Pago</label>
            <input
              type="date"
              class="editorial-input"
              formControlName="fecha_pago"
              [class.is-invalid]="isInvalid('fecha_pago')"
              [readonly]="viewOnly"
            >
          </div>

          <div>
            <label class="editorial-label">Método de Pago</label>
            <select class="editorial-input" formControlName="metodo_pago" [class.is-invalid]="isInvalid('metodo_pago')" [attr.disabled]="viewOnly ? true : null">
              <option *ngFor="let fp of sriMetodosPago" [value]="fp.codigo">{{ fp.label }}</option>
            </select>
          </div>

          <div>
            <label class="editorial-label">Nº Referencia {{ isBancarizado ? '*' : '' }}</label>
            <input
              type="text"
              class="editorial-input"
              formControlName="numero_referencia"
              placeholder="Ej: ID Transacción / Nº Depósito"
              [class.is-invalid]="isInvalid('numero_referencia')"
              [readonly]="viewOnly"
            >
            <div class="invalid-feedback-minimal" *ngIf="isInvalid('numero_referencia')">Requerido para pagos bancarizados.</div>
          </div>

          <div>
            <label class="editorial-label">Nº Comprobante {{ isBancarizado ? '*' : '' }}</label>
            <input
              type="text"
              class="editorial-input"
              formControlName="numero_comprobante"
              placeholder="Ej: Nº de Recibo / Operación"
              [class.is-invalid]="isInvalid('numero_comprobante')"
              [readonly]="viewOnly"
            >
            <div class="invalid-feedback-minimal" *ngIf="isInvalid('numero_comprobante')">Requerido para pagos bancarizados.</div>
          </div>

          <div class="col-span-2">
            <label class="editorial-label">Observaciones</label>
            <textarea class="editorial-input" formControlName="observaciones" rows="2" placeholder="Notas..." [readonly]="viewOnly"></textarea>
          </div>
        </div>
      </form>
    </app-modal-form-layout>
  `,
  styles: [`
    :host { display: contents; }

    .summary-ticket-premium {
      background: #f8fafc; padding: 1.5rem; border-radius: 20px; border: 1.5px solid #e2e8f0; border-left: 6px solid var(--primary-color);
    }
    .editorial-label-muted { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; }
    .summary-title { font-size: 1.15rem; font-weight: 900; color: #1a1a1a; display: block; letter-spacing: -0.01em; }
    .total-label { font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.25rem; }
    .total-amount { font-size: 1.5rem; font-weight: 900; color: var(--primary-color); letter-spacing: -0.02em; }

    .alert-minimalist {
      background: #f1f5f9; color: #475569; padding: 0.85rem 1rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700; border: 1.5px solid #e2e8f0; text-align: center; letter-spacing: 0.05em;
    }

    .editorial-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .col-span-2 { grid-column: span 2; }

    .editorial-label {
      display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 0.5rem;
    }

    .editorial-input {
      width: 100%; padding: 0.85rem 1.25rem; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; font-weight: 500; color: #1a1a1a; transition: all 0.2s ease; background: #ffffff;
    }
    .editorial-input:focus { outline: none; border-color: var(--primary-color); background-color: #ffffff; }
    .editorial-input.is-invalid { border-color: #ef4444; }

    .input-editorial-group { display: flex; align-items: stretch; border-radius: 12px; overflow: hidden; border: 1.5px solid #e2e8f0; }
    .input-editorial-group:focus-within { border-color: var(--primary-color); }
    .addon { background: #f8fafc; padding: 0 1rem; display: flex; align-items: center; border-right: 1.5px solid #e2e8f0; color: #64748b; font-weight: 700; }
    .addon-field { border: none !important; border-radius: 0; }

    .badge-code-editorial { background: #ffffff; color: #475569; padding: 0.35rem 0.75rem; border-radius: 8px; font-weight: 700; font-size: 0.7rem; border: 1.5px solid #e2e8f0; }
    .badge-status-editorial { padding: 0.35rem 0.85rem; border-radius: 8px; font-weight: 800; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .status-pendiente { background: #fff7ed; color: #9a3412; border: 1px solid #ffedd5; }
    .status-pagado { background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }

    .invalid-feedback-minimal { font-size: 0.75rem; color: #ef4444; font-weight: 500; margin-top: 0.4rem; }

    .view-only-blocker {
      pointer-events: none !important;
      user-select: none;
      filter: grayscale(0.2);
    }
  `]
})
export class PagoFormComponent implements OnInit, OnChanges {
  @Input() editData: PagoGasto | null = null;
  @Input() selectedGasto: Gasto | null = null;
  @Input() availableGastos: Gasto[] = [];
  @Input() loading = false;
  @Input() viewOnly = false;

  @Output() onSubmit = new EventEmitter<PagoGastoCreate | PagoGastoUpdate>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  editMode = false;
  readonly sriMetodosPago = SRI_FORMAS_PAGO;
  private initialValue: any;

  constructor(private fb: FormBuilder, private cd: ChangeDetectorRef) {
    this.form = this.fb.group({
      gasto_id: ['', Validators.required],
      monto: [0, [Validators.required, Validators.min(0.01)]],
      fecha_pago: [new Date().toISOString().split('T')[0], Validators.required],
      metodo_pago: ['01', Validators.required],
      numero_referencia: [''],
      numero_comprobante: [''],
      observaciones: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editData'] || changes['viewOnly'] || changes['selectedGasto']) {
      this.initForm();
    }
  }

  ngOnInit() {
    this.setupGastoSubscription();
    this.setupMetodoPagoSubscription();
  }

  private initForm() {
    this.editMode = !!this.editData;
    this.form.enable({ emitEvent: false });

    if (this.editData) {
      this.form.reset({
        ...this.editData,
        fecha_pago: this.editData.fecha_pago?.split('T')[0]
      }, { emitEvent: false });
      this.initialValue = this.form.getRawValue();
      
      // BLOQUEO: No se puede editar el monto de un pago ya registrado
      this.form.get('monto')?.disable({ emitEvent: false });
    } else {
      this.form.reset({
        gasto_id: this.selectedGasto?.id || '',
        monto: this.selectedGasto?.saldo ?? 0,
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: '01',
        numero_referencia: '',
        numero_comprobante: '',
        observaciones: ''
      }, { emitEvent: false });
    }

    if (this.selectedGasto) {
      this.onGastoSelected(this.selectedGasto);
    } else if (!this.editMode) {
      this.togglePaymentFields(false);
    }

    // Bloqueos de seguridad si el gasto ya está pagado
    if (this.selectedGasto?.estado_pago === 'pagado' && !this.viewOnly) {
      if (this.editMode && this.editData) {
        // Bloqueamos los campos core
        ['monto', 'fecha_pago', 'metodo_pago', 'gasto_id'].forEach(ctrl => this.form.get(ctrl)?.disable({ emitEvent: false }));
        
        // Bloqueamos opcionales SOLO si ya tienen contenido (lo que pide el usuario)
        const opcionales = ['numero_referencia', 'numero_comprobante', 'observaciones'];
        opcionales.forEach(field => {
          const val = (this.editData as any)[field];
          if (val && val.toString().trim() !== '') {
            this.form.get(field)?.disable({ emitEvent: false });
          }
        });
      } else {
        // En creación de un pago nuevo para un gasto ya pagado
        ['gasto_id', 'monto', 'fecha_pago', 'metodo_pago'].forEach(ctrl => this.form.get(ctrl)?.disable({ emitEvent: false }));
      }
    }

    if (this.viewOnly) {
      this.form.disable({ emitEvent: false });
    }

    this.updateReferenceValidators(this.form.get('metodo_pago')?.value);
    
    this.cd.detectChanges();
  }

  get isBancarizado(): boolean {
    const metodo = this.form.get('metodo_pago')?.value;
    return metodo && metodo !== '01'; // '01' es Efectivo
  }

  private setupMetodoPagoSubscription() {
    this.form.get('metodo_pago')?.valueChanges.subscribe(val => {
      this.updateReferenceValidators(val);
    });
  }

  private updateReferenceValidators(metodo: string) {
    const refs = ['numero_referencia', 'numero_comprobante'];
    if (metodo !== '01') {
      refs.forEach(field => {
        this.form.get(field)?.setValidators([Validators.required]);
      });
    } else {
      refs.forEach(field => {
        this.form.get(field)?.clearValidators();
      });
    }
    refs.forEach(field => this.form.get(field)?.updateValueAndValidity({ emitEvent: false }));
  }

  get hasChanges(): boolean {
    if (!this.editMode || !this.initialValue) return true;
    const current = this.form.getRawValue();
    const initial = this.initialValue;
    // Comparamos omitiendo el monto porque está deshabilitado y no cambia
    return JSON.stringify({...current, monto: undefined}) !== JSON.stringify({...initial, monto: undefined});
  }

  get gastoEsPagado(): boolean {
    return this.selectedGasto?.estado_pago === 'pagado';
  }

  private setupGastoSubscription() {
    this.form.get('gasto_id')?.valueChanges.subscribe(id => {
      if (id) {
        const gasto = this.availableGastos.find(g => g.id === id);
        if (gasto) this.onGastoSelected(gasto);
      } else {
        this.togglePaymentFields(false);
        this.selectedGasto = null;
      }
    });
  }

  private onGastoSelected(gasto: Gasto) {
    this.selectedGasto = gasto;
    if (!this.viewOnly && !this.editMode) this.togglePaymentFields(true);
    
    if (!this.editMode) {
      this.form.patchValue({ 
        gasto_id: gasto.id,
        monto: gasto.saldo 
      }, { emitEvent: false });
    }

    const maxLimit = this.editMode ? (this.editData?.monto || gasto.total) : gasto.saldo;

    this.form.get('monto')?.setValidators([
      Validators.required, 
      Validators.min(0.01), 
      Validators.max(maxLimit)
    ]);
    this.form.get('monto')?.updateValueAndValidity({ emitEvent: false });
  }

  private togglePaymentFields(enabled: boolean) {
    if (this.viewOnly) return;
    const fields = ['monto', 'fecha_pago', 'metodo_pago', 'numero_referencia', 'numero_comprobante', 'observaciones'];
    fields.forEach(field => {
      // Si estamos en editMode, no queremos habilitar el monto aunque enabled sea true
      if (this.editMode && field === 'monto') return;
      
      enabled ? this.form.get(field)?.enable({ emitEvent: false }) : this.form.get(field)?.disable({ emitEvent: false });
    });
  }

  onlyPositiveNumbers(event: KeyboardEvent) {
    if (['-', 'e', 'E', '+'].includes(event.key)) event.preventDefault();
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submit() {
    if (this.form.valid) {
      this.onSubmit.emit(this.form.getRawValue());
    }
  }
}

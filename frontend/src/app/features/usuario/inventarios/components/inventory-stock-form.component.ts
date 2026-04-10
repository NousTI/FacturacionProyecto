import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Producto } from '../../../../domain/models/producto.model';
import { UNIDADES_MEDIDA, ESTADOS_INVENTARIO } from '../constants/inventario.constants';

@Component({
  selector: 'app-inventory-stock-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="closeModal()">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-content-glass">
          <div class="modal-header">
            <h3>
              <i class="bi me-2" [ngClass]="editingId ? 'bi-pencil-square' : 'bi-plus-circle'"></i>
              {{ editingId ? 'Editar' : 'Nuevo' }} Registro de Inventario
            </h3>
            <button class="btn-close" (click)="closeModal()" [disabled]="isSaving"></button>
          </div>

          <div class="modal-body">
            <form [formGroup]="form" class="grid-form">
              <div class="form-item full">
                <label>Producto <span class="required">*</span></label>
                <select formControlName="producto_id" class="form-select" [disabled]="!!editingId">
                  <option value="" disabled>Seleccione un producto</option>
                  <option *ngFor="let prod of productos" [value]="prod.id">{{ prod.nombre }}</option>
                </select>
              </div>

              <div class="form-item">
                <label>Tipo de Movimiento <span class="required">*</span></label>
                <select formControlName="tipo_movimiento" class="form-select">
                  <option value="">Seleccione</option>
                  <option value="COMPRA">Compra</option>
                  <option value="VENTA">Venta</option>
                  <option value="DEVOLUCION">Devolución</option>
                </select>
              </div>

              <div class="form-item">
                <label>Unidad de Medida <span class="required">*</span></label>
                <select formControlName="unidad_medida" class="form-select">
                  <option value="">Seleccione</option>
                  <option *ngFor="let unidad of unidadesMedida" [value]="unidad">
                    {{ unidad }}
                  </option>
                </select>
              </div>

              <div class="form-item">
                <label>Cantidad <span class="required">*</span></label>
                <input type="number" formControlName="cantidad" class="form-input" min="0">
              </div>

              <div class="form-item">
                <label>Estado <span class="required">*</span></label>
                <select formControlName="estado" class="form-select">
                  <option value="">Seleccione</option>
                  <option *ngFor="let estado of estadosInventario" [value]="estado">
                    {{ estado }}
                  </option>
                </select>
              </div>

              <div class="form-item">
                <label>Ubicación Física</label>
                <input type="text" formControlName="ubicacion_fisica" class="form-input" placeholder="Ej: Pasillo A, Estante 3">
              </div>

              <div class="form-item">
                <label>Fecha <span class="required">*</span></label>
                <input type="date" formControlName="fecha" class="form-input">
              </div>

              <div class="form-item full">
                <label>Observaciones</label>
                <textarea formControlName="observaciones" class="form-textarea" rows="2"></textarea>
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeModal()" [disabled]="isSaving">Cancelar</button>
            <button class="btn-gradient" (click)="submit()" [disabled]="isSaving || form.invalid">
              <i class="bi me-1" [ngClass]="isSaving ? 'bi-hourglass' : 'bi-check2-circle'"></i>
              {{ isSaving ? 'Procesando...' : (editingId ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 10005; display: flex; align-items: center; justify-content: center; }
    .modal-dialog { width: 100%; max-width: 600px; padding: 1rem; }
    .modal-content-glass { background: white; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; }
    .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; }
    .btn-close { font-size: 1.5rem; color: #94a3b8; cursor: pointer; border: none; background: none; }
    .modal-body { padding: 2rem; }
    .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-item.full { grid-column: span 2; }
    .form-item label { font-size: 0.875rem; font-weight: 600; color: #475569; }
    .required { color: #ef4444; }
    .form-input, .form-select, .form-textarea { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.875rem; }
    .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #3b82f6; }
    .form-input:disabled { background: #f1f5f9; cursor: not-allowed; }
    .modal-footer { padding: 1.5rem 2rem; background: #f8fafc; display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-ghost { padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; color: #64748b; background: none; border: none; cursor: pointer; }
    .btn-gradient { padding: 0.75rem 2rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3); }
    .btn-gradient:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class InventoryStockFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isSaving = false;
  @Input() editingId: string | null = null;
  @Input() productos: Producto[] | null = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  form: FormGroup;
  readonly unidadesMedida = UNIDADES_MEDIDA;
  readonly estadosInventario = ESTADOS_INVENTARIO;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      producto_id: ['', Validators.required],
      tipo_movimiento: ['', Validators.required],
      unidad_medida: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      estado: ['', Validators.required],
      ubicacion_fisica: [''],
      observaciones: [''],
      fecha: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    // Reset form when opening in create mode
    if (!this.editingId) {
      this.form.reset({
        fecha: new Date().toISOString().split('T')[0]
      });
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingId'] && changes['editingId'].currentValue) {
      // Form data is loaded by the parent component if needed
    }
  }

  submit() {
    if (this.form.valid) {
      this.onSave.emit(this.form.value);
    }
  }

  closeModal() {
    if (!this.isSaving) {
      this.onClose.emit();
    }
  }
}

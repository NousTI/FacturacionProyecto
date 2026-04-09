import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Producto } from '../../../../domain/models/producto.model';
import { TIPOS_MOVIMIENTO } from '../constants/inventario.constants';

@Component({
  selector: 'app-inventario-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" *ngIf="show">
      <div class="modal-dialog">
        <div class="modal-content-glass">
          <div class="modal-header">
            <h3><i class="bi bi-plus-circle me-2"></i>Registrar Movimiento</h3>
            <button class="btn-close" (click)="onClose.emit()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="movimientoForm" class="grid-form">
              <div class="form-item full">
                <label>Producto <span class="required">*</span></label>
                <select formControlName="producto_id" class="form-select">
                  <option value="" disabled selected>Seleccione un producto</option>
                  <option *ngFor="let prod of productos" [value]="prod.id">{{ prod.nombre }}</option>
                </select>
              </div>
              
              <div class="form-item">
                <label>Tipo de Movimiento <span class="required">*</span></label>
                <select formControlName="tipo_movimiento" class="form-select">
                  <option *ngFor="let tipo of tiposMovimiento" [value]="tipo">
                    {{ tipo | titlecase }}
                  </option>
                </select>
              </div>

              <div class="form-item">
                <label>Cantidad <span class="required">*</span></label>
                <div class="input-with-icon">
                  <i class="bi bi-calculator"></i>
                  <input type="number" formControlName="cantidad" step="0.001" class="form-input">
                </div>
              </div>

              <div class="form-item">
                <label>Costo Unitario</label>
                <div class="input-with-icon">
                  <i class="bi bi-tag"></i>
                  <input type="number" formControlName="costo_unitario" step="0.01" class="form-input">
                </div>
              </div>

              <div class="form-item">
                <label>Documento/Referencia</label>
                <input type="text" formControlName="documento_referencia" placeholder="Ej: Factura #001" class="form-input">
              </div>

              <div class="form-item full">
                <label>Observaciones</label>
                <textarea formControlName="observaciones" rows="2" class="form-textarea"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="onClose.emit()">Cancelar</button>
            <button class="btn-gradient" (click)="submit()" [disabled]="isSaving || movimientoForm.invalid">
              <i class="bi bi-check2-circle me-1" *ngIf="!isSaving"></i>
              {{ isSaving ? 'Procesando...' : 'Registrar Movimiento' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 10005; display: flex; align-items: center; justify-content: center; }
    .modal-dialog { width: 100%; max-width: 600px; padding: 1rem; pointer-events: auto; }
    .modal-content-glass { background: white; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden; pointer-events: auto; }
    .modal-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; }
    .btn-close { font-size: 1.5rem; color: #94a3b8; cursor: pointer; border: none; background: none; }
    .modal-body { padding: 2rem; }
    .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-item.full { grid-column: span 2; }
    .form-item label { font-size: 0.875rem; font-weight: 600; color: #475569; }
    .required { color: #ef4444; }
    .form-input, .form-select, .form-textarea { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.875rem; transition: border-color 0.2s; }
    .form-input:focus { outline: none; border-color: #3b82f6; }
    .input-with-icon { position: relative; }
    .input-with-icon i { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .input-with-icon input { padding-left: 2.5rem; width: 100%; border: 1px solid #e2e8f0; border-radius: 10px; padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .modal-footer { padding: 1.5rem 2rem; background: #f8fafc; display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-ghost { padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; color: #64748b; background: none; border: none; cursor: pointer; }
    .btn-gradient { padding: 0.75rem 2rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3); }
    .btn-gradient:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class InventarioFormComponent {
  @Input() show = false;
  @Input() isSaving = false;
  @Input() productos: Producto[] | null = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  readonly tiposMovimiento = TIPOS_MOVIMIENTO;
  movimientoForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.movimientoForm = this.fb.group({
      producto_id: ['', Validators.required],
      tipo_movimiento: ['entrada', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.001)]],
      costo_unitario: [0, [Validators.min(0)]],
      documento_referencia: [''],
      observaciones: ['']
    });
  }

  submit() {
    if (this.movimientoForm.valid) {
      this.onSave.emit(this.movimientoForm.value);
    }
  }

  reset() {
    this.movimientoForm.reset({
      tipo_movimiento: 'entrada',
      cantidad: 1,
      costo_unitario: 0
    });
  }
}

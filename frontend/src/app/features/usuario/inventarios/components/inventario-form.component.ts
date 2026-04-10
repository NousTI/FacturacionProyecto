import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Producto } from '../../../../domain/models/producto.model';
import { TIPOS_MOVIMIENTO } from '../constants/inventario.constants';

@Component({
  selector: 'app-inventario-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (mousedown)="$event.target === $event.currentTarget && closeModal()">
      <div class="modal-dialog">
        <div class="modal-content-glass">
          <div class="modal-header">
            <h3><i class="bi bi-plus-circle me-2"></i>Registrar Movimiento</h3>
            <button class="btn-close" (click)="closeModal()" [disabled]="isSaving"></button>
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
            <button class="btn-ghost" (click)="closeModal()" [disabled]="isSaving">Cancelar</button>
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
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 10005;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-dialog {
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .modal-content-glass {
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .modal-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .btn-close {
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      background: #f1f5f9;
      border-radius: 12px;
      color: #94a3b8;
      cursor: pointer;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .btn-close:hover {
      background: #e2e8f0;
      color: #3b82f6;
    }

    .modal-body {
      padding: 2rem;
      overflow-y: auto;
      flex: 1;
    }

    .grid-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .form-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-item.full {
      grid-column: span 2;
    }

    .form-item label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
      display: block;
    }

    .required {
      color: #ef4444;
    }

    .form-input,
    .form-select,
    .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.875rem;
      transition: border-color 0.2s;
      background: #f8fafc;
      color: #1e293b;
      font-weight: 600;
    }

    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      background: white;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .input-with-icon {
      position: relative;
    }

    .input-with-icon i {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-style: normal;
      font-weight: 700;
    }

    .input-with-icon input {
      padding-left: 2.5rem;
      width: 100%;
    }

    .modal-footer {
      padding: 1.5rem 2rem;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid #f1f5f9;
      flex-shrink: 0;
    }

    .btn-ghost {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      color: #64748b;
      background: none;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-ghost:hover {
      background: #f8fafc;
      color: #3b82f6;
    }

    .btn-gradient {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border-radius: 10px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
      transition: all 0.2s;
    }

    .btn-gradient:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.3);
    }

    .btn-gradient:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class InventarioFormComponent implements OnInit, OnDestroy {
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

  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
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

  closeModal() {
    if (!this.isSaving) {
      this.onClose.emit();
    }
  }
}

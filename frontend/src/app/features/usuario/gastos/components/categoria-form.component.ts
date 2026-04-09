import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoriaGasto, CategoriaGastoCreate, CategoriaGastoUpdate } from '../../../../domain/models/categoria-gasto.model';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-container">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-group mb-3">
          <label class="form-label">Código de Categoría *</label>
          <input 
            type="text" 
            class="form-control" 
            formControlName="codigo" 
            placeholder="Ej: SERV-PUB"
            [class.is-invalid]="isInvalid('codigo')"
          >
          <small class="text-muted">Un identificador único corto para la categoría.</small>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Nombre de la Categoría *</label>
          <input 
            type="text" 
            class="form-control" 
            formControlName="nombre" 
            placeholder="Ej: Servicios Públicos"
            [class.is-invalid]="isInvalid('nombre')"
          >
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Tipo de Gasto</label>
          <select class="form-select" formControlName="tipo">
            <option value="operativo">Gasto Operativo</option>
            <option value="fijo">Gasto Fijo</option>
            <option value="variable">Gasto Variable</option>
            <option value="financiero">Gasto Financiero</option>
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Descripción</label>
          <textarea class="form-control" formControlName="descripcion" rows="2" placeholder="Opcional..."></textarea>
        </div>

        <div class="form-check form-switch mb-4">
          <input class="form-check-input" type="checkbox" id="activoSwitch" formControlName="activo">
          <label class="form-check-label" for="activoSwitch">Categoría Activa</label>
        </div>

        <div class="form-actions d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-light" (click)="cancel.emit()">Cancelar</button>
          <button type="submit" class="btn btn-primary px-4" [disabled]="form.invalid || loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-1"></span>
            {{ editMode ? 'Actualizar' : 'Crear Categoría' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .form-label { font-size: 0.85rem; font-weight: 600; color: #4b5563; margin-bottom: 0.4rem; display: block; }
    .form-control, .form-select { border-radius: 10px; padding: 0.6rem; border: 1px solid #e2e8f0; }
    .form-check-input:checked { background-color: #6366f1; border-color: #6366f1; }
  `]
})
export class CategoriaFormComponent implements OnInit {
  @Input() editData: CategoriaGasto | null = null;
  @Input() loading = false;

  @Output() onSubmit = new EventEmitter<CategoriaGastoCreate | CategoriaGastoUpdate>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;
  editMode = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(2), Validators.pattern('^[a-zA-Z0-9_-]+$')]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      tipo: ['operativo'],
      activo: [true]
    });
  }

  ngOnInit() {
    if (this.editData) {
      this.editMode = true;
      this.form.patchValue(this.editData);
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submit() {
    if (this.form.valid) {
      this.onSubmit.emit(this.form.value);
    }
  }
}

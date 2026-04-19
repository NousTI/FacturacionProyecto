import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoriaGasto, CategoriaGastoCreate, CategoriaGastoUpdate } from '../../../../domain/models/categoria-gasto.model';
import { ModalFormLayoutComponent } from './modal-form-layout.component';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalFormLayoutComponent],
  template: `
    <app-modal-form-layout
      [title]="editMode ? 'Editar Categoría' : 'Nueva Categoría'"
      [submitLabel]="editMode ? 'ACTUALIZAR' : 'CREAR CATEGORÍA'"
      [loading]="loading"
      [submitDisabled]="form.invalid"
      (onCancel)="cancel.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="submit()" id="formContent" class="editorial-grid-2">
        <div>
          <label class="editorial-label">Código</label>
          <input
            type="text"
            class="editorial-input"
            formControlName="codigo"
            placeholder="Ej: SERV-PUB"
            [class.is-invalid]="isInvalid('codigo')"
          >
          <div class="invalid-feedback-minimal" *ngIf="isInvalid('codigo')">Requerido. Único y corto.</div>
        </div>

        <div>
          <label class="editorial-label">Nombre</label>
          <input
            type="text"
            class="editorial-input"
            formControlName="nombre"
            placeholder="Ej: Servicios Públicos"
            [class.is-invalid]="isInvalid('nombre')"
          >
          <div class="invalid-feedback-minimal" *ngIf="isInvalid('nombre')">Requerido. Mínimo 3 caracteres.</div>
        </div>

        <div>
          <label class="editorial-label">Tipo de Gasto</label>
          <select class="editorial-input" formControlName="tipo">
            <option value="operativo">Gasto Operativo</option>
            <option value="fijo">Gasto Fijo</option>
            <option value="variable">Gasto Variable</option>
            <option value="financiero">Gasto Financiero</option>
          </select>
        </div>

        <div class="d-flex align-items-end pb-2">
          <div class="form-switch-editorial">
            <input class="form-check-input" type="checkbox" id="activoSwitch" formControlName="activo">
            <label class="form-check-label" for="activoSwitch">
              {{ form.get('activo')?.value ? 'CATEGORÍA ACTIVA' : 'CATEGORÍA INACTIVA' }}
            </label>
          </div>
        </div>

        <div class="col-span-2">
          <label class="editorial-label">Descripción</label>
          <textarea class="editorial-input" formControlName="descripcion" rows="2" placeholder="Notas adicionales..."></textarea>
        </div>
      </form>
    </app-modal-form-layout>
  `,
  styles: [`
    :host { display: contents; }

    .editorial-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .col-span-2 { grid-column: span 2; }

    .editorial-label {
      display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 0.5rem;
    }

    .editorial-input {
      width: 100%; padding: 0.85rem 1.25rem; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; font-weight: 500; color: #1a1a1a; transition: all 0.2s ease; background: #ffffff;
    }
    .editorial-input:focus { outline: none; border-color: black; background-color: #ffffff; }
    .editorial-input.is-invalid { border-color: #ef4444; }

    .invalid-feedback-minimal { font-size: 0.75rem; color: #ef4444; font-weight: 500; margin-top: 0.4rem; }

    .form-switch-editorial { display: flex; align-items: center; }
    .form-switch-editorial .form-check-input { width: 38px; height: 20px; cursor: pointer; border-radius: 20px; border-color: #cbd5e1; }
    .form-switch-editorial .form-check-input:checked { background-color: #10b981; border-color: #10b981; }
    .form-switch-editorial .form-check-label { font-size: 0.7rem; font-weight: 800; color: #475569; margin-left: 0.75rem; letter-spacing: 0.05em; }
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


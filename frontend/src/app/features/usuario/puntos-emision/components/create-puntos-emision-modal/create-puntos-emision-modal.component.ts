import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PuntoEmision } from '../../../../../domain/models/punto-emision.model';
import { EstablecimientosService } from '../../../establecimientos/services/establecimientos.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-create-puntos-emision-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container-final" (click)="$event.stopPropagation()">

        <!-- HEADER -->
        <div class="modal-header-final">
          <h2 class="modal-title-final">
            {{ puntoEmision ? 'Editar Punto de Emisión' : 'Nuevo Punto de Emisión' }}
          </h2>
          <button (click)="close()" class="btn-close-final" [disabled]="loading" type="button">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <!-- BODY -->
        <div class="modal-body-final scroll-custom">
          <form [formGroup]="form" (ngSubmit)="submit()">

            <!-- SECCIÓN: INFORMACIÓN BÁSICA -->
            <div class="form-section-final">
              <h3 class="section-header-final">Información Básica</h3>
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="label-final">Código (001-999) *</label>
                  <input
                    type="text"
                    formControlName="codigo"
                    class="input-final"
                    placeholder="Ej: 001"
                    maxlength="3"
                    [class.is-invalid]="isInvalidField('codigo')"
                  >
                  <div class="error-feedback" *ngIf="isInvalidField('codigo')">
                    <i class="bi bi-exclamation-circle"></i>
                    Debe ser 3 dígitos (001-999)
                  </div>
                </div>
                <div class="col-md-8">
                  <label class="label-final">Nombre del Punto de Emisión *</label>
                  <input
                    type="text"
                    formControlName="nombre"
                    class="input-final"
                    placeholder="Ej: Punto Principal"
                    [class.is-invalid]="isInvalidField('nombre')"
                  >
                  <div class="error-feedback" *ngIf="isInvalidField('nombre')">
                    <i class="bi bi-exclamation-circle"></i>
                    El nombre es requerido (3-100 caracteres)
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN: ESTABLECIMIENTO -->
            <div class="form-section-final">
              <h3 class="section-header-final">Establecimiento</h3>
              <div class="row g-3">
                <div class="col-12">
                  <label class="label-final">Selecciona un Establecimiento *</label>
                  <select
                    formControlName="establecimiento_id"
                    class="input-final"
                    [class.is-invalid]="isInvalidField('establecimiento_id')"
                  >
                    <option value="" disabled selected>Selecciona un establecimiento</option>
                    <option *ngFor="let est of establecimientos$ | async" [value]="est.id">
                      {{ est.nombre }}
                    </option>
                  </select>
                  <div class="error-feedback" *ngIf="isInvalidField('establecimiento_id')">
                    <i class="bi bi-exclamation-circle"></i>
                    El establecimiento es requerido
                  </div>
                </div>
              </div>
            </div>

            <!-- SECCIÓN: ESTADO -->
            <div class="form-section-final border-0 mb-0">
              <h3 class="section-header-final">Estado</h3>
              <div class="form-check form-switch switch-final">
                <input
                  class="form-check-input"
                  type="checkbox"
                  formControlName="activo"
                  id="activoCheck"
                >
                <label class="form-check-label ms-2" for="activoCheck">
                  Punto de Emisión Activo
                </label>
              </div>
            </div>

          </form>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer-final">
          <button (click)="close()" class="btn-cancel-final" [disabled]="loading" type="button">
            Cancelar
          </button>
          <button
            (click)="submit()"
            [disabled]="form.invalid || (puntoEmision && form.pristine) || loading"
            class="btn-submit-final d-flex align-items-center gap-2"
            type="button"
          >
            <span *ngIf="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ loading ? 'Guardando...' : (puntoEmision ? 'Guardar Cambios' : 'Crear Punto de Emisión') }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 53, 0.4);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    }

    .modal-container-final {
      background: #ffffff;
      width: 700px;
      max-width: 95vw;
      max-height: 90vh;
      border-radius: 28px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header-final {
      padding: 1.5rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
    }

    .modal-title-final {
      font-size: 1.25rem;
      font-weight: 800;
      color: #161d35;
      margin: 0;
    }

    .btn-close-final {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
      transition: all 0.2s;
    }

    .btn-close-final:hover:not(:disabled) {
      color: #161d35;
      transform: rotate(90deg);
    }

    .btn-close-final:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .modal-body-final {
      padding: 2rem 2.5rem;
      overflow-y: auto;
      flex: 1;
    }

    .scroll-custom::-webkit-scrollbar {
      width: 6px;
    }

    .scroll-custom::-webkit-scrollbar-track {
      background: transparent;
    }

    .scroll-custom::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 3px;
    }

    .scroll-custom::-webkit-scrollbar-thumb:hover {
      background: #cbd5e1;
    }

    .form-section-final {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .form-section-final.border-0 {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .section-header-final {
      font-size: 1rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 1.25rem;
    }

    .label-final {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.5rem;
      display: block;
    }

    .input-final {
      width: 100%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem 1.25rem;
      font-size: 0.9rem;
      color: #475569;
      font-weight: 600;
      transition: all 0.2s;
      font-family: inherit;
    }

    .input-final:focus {
      border-color: #161d35;
      outline: none;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }

    .input-final.is-invalid {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .input-final:disabled {
      background: #f8fafc;
      color: #94a3b8;
      cursor: not-allowed;
    }

    select.input-final {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 1.25rem center;
      padding-right: 2.5rem;
    }

    select.input-final option {
      background: #ffffff;
      color: #475569;
      padding: 0.75rem 1.25rem;
    }

    select.input-final option:checked {
      background: linear-gradient(#161d35, #161d35);
      background-color: #161d35 !important;
      color: #ffffff !important;
    }

    .error-feedback {
      font-size: 0.75rem;
      color: #ef4444;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-switch.switch-final {
      padding-top: 0.5rem;
    }

    .form-switch.switch-final .form-check-input {
      width: 3rem;
      height: 1.5rem;
      border-radius: 100px;
      background: #e2e8f0;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .form-switch.switch-final .form-check-input:checked {
      background: #10b981;
      border-color: #10b981;
    }

    .form-switch.switch-final .form-check-label {
      font-weight: 600;
      color: #475569;
    }

    .modal-footer-final {
      padding: 1.25rem 2.5rem;
      background: #ffffff;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-submit-final {
      background: #161d35;
      color: #ffffff;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn-submit-final:hover:not(:disabled) {
      background: #232d4d;
      transform: translateY(-1px);
      box-shadow: 0 10px 25px -5px rgba(22, 29, 53, 0.15);
    }

    .btn-submit-final:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-cancel-final {
      background: #ffffff;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .btn-cancel-final:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #475569;
    }

    .btn-cancel-final:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
      border-width: 0.2em;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .modal-header-final,
      .modal-body-final,
      .modal-footer-final {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
      }

      .modal-title-final {
        font-size: 1.1rem;
      }

      .label-final {
        font-size: 0.75rem;
      }

      .input-final {
        font-size: 0.85rem;
        padding: 0.65rem 1rem;
      }
    }
  `]
})
export class CreatePuntosEmisionModalComponent implements OnInit {
  @Input() puntoEmision: PuntoEmision | null = null;
  @Input() loading: boolean = false;
  @Output() onSave = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();

  form: FormGroup;
  establecimientos$: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private establecimientosService: EstablecimientosService
  ) {
    this.form = this.fb.group({
      codigo: ['', [
        Validators.required,
        Validators.pattern(/^\d{3}$/)
      ]],
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      establecimiento_id: ['', [
        Validators.required
      ]],
      activo: [true]
    });
    
    this.establecimientos$ = this.establecimientosService.getEstablecimientos();
  }

  ngOnInit() {
    if (this.puntoEmision) {
      this.form.patchValue(this.puntoEmision);
    }
  }

  isInvalidField(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  submit() {
    if (this.form.valid) {
      this.onSave.emit(this.form.value);
    }
  }

  close() {
    this.onClose.emit();
  }
}

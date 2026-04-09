import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FacturacionProgramadaService } from '../../services/facturacion-programada.service';
import { ClientesService } from '../../../clientes/services/clientes.service';
import { Cliente } from '../../../../../domain/models/cliente.model';
import { FacturaProgramada } from '../../../../../domain/models/facturacion-programada.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-create-recurrente-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn">
      <div class="modal-container animate__animated animate__zoomIn">
        <div class="modal-header">
          <div class="header-content">
            <div class="icon-circle bg-premium">
              <i class="bi" 
                 [class.bi-plus-lg]="!programacion && !isViewOnly" 
                 [class.bi-pencil-square]="programacion && !isViewOnly"
                 [class.bi-eye]="isViewOnly"></i>
            </div>
            <div class="header-text">
              <h3>{{ isViewOnly ? 'Detalles de' : (programacion ? 'Editar' : 'Nueva') }} Facturación Recurrente</h3>
              <p>{{ isViewOnly ? 'Información completa de la regla de automatización.' : 'Configura la automatización de facturas para un cliente.' }}</p>
            </div>
          </div>
          <button class="btn-close-modal" (click)="onClose.emit(false)">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="modal-body custom-scrollbar">
            <div class="row g-4">
              <!-- Información de Estado (Solo vista) -->
              <div class="col-12" *ngIf="isViewOnly && programacion">
                 <div class="alert alert-info border-0 rounded-4 d-flex align-items-center mb-0">
                    <i class="bi bi-info-circle-fill me-3 fs-4"></i>
                    <div>
                       <div class="fw-bold">Estado del Ciclo</div>
                       <small>Próxima emisión el {{ programacion.proxima_emision | date:'dd/MM/yyyy' }}. Ha generado {{ programacion.total_emisiones }} facturas en total.</small>
                    </div>
                 </div>
              </div>

              <!-- Cliente -->
              <div class="col-12">
                <label class="premium-label">Cliente</label>
                <div class="input-group-premium" [class.readonly-field]="isViewOnly">
                  <i class="bi bi-person"></i>
                  <select formControlName="cliente_id" class="form-select-premium">
                    <option value="" disabled selected>Selecciona un cliente...</option>
                    <option *ngFor="let cliente of clientes" [value]="cliente.id">
                      {{ cliente.razon_social }} ({{ cliente.identificacion }})
                    </option>
                  </select>
                </div>
              </div>

              <!-- Concepto -->
              <div class="col-12">
                <label class="premium-label">Concepto de Facturación</label>
                <div class="input-group-premium" [class.readonly-field]="isViewOnly">
                  <i class="bi bi-card-text"></i>
                  <input type="text" formControlName="concepto" class="form-control-premium" placeholder="Ej: Servicio de mantenimiento mensual">
                </div>
              </div>

              <!-- Monto y Frecuencia -->
              <div class="col-md-6">
                <label class="premium-label">Monto (Sin Impuestos)</label>
                <div class="input-group-premium" [class.readonly-field]="isViewOnly">
                  <i class="bi bi-currency-dollar"></i>
                  <input type="number" formControlName="monto" class="form-control-premium" placeholder="0.00" step="0.01">
                </div>
              </div>

              <div class="col-md-6">
                <label class="premium-label">Frecuencia</label>
                <div class="input-group-premium" [class.readonly-field]="isViewOnly">
                  <i class="bi bi-arrow-repeat"></i>
                  <select formControlName="tipo_frecuencia" class="form-select-premium">
                    <option value="MENSUAL">MENSUAL</option>
                    <option value="TRIMESTRAL">TRIMESTRAL</option>
                    <option value="ANUAL">ANUAL</option>
                  </select>
                </div>
              </div>

              <!-- Día y Fecha Inicio -->
              <div class="col-md-6">
                <label class="premium-label">Día de Emisión (1-31)</label>
                <div class="input-group-premium" [class.readonly-field]="isViewOnly">
                  <i class="bi bi-calendar-check"></i>
                  <input type="number" formControlName="dia_emision" class="form-control-premium" placeholder="15" min="1" max="31" (keypress)="validateNoNegative($event)" 
                         (input)="limitLength($event, 2)">
                </div>
                <div class="text-danger smallest mt-1" *ngIf="form.get('dia_emision')?.invalid && form.get('dia_emision')?.touched">
                  Debe ser un día entre 1 y 31
                </div>
                <small class="text-muted smallest" *ngIf="form.get('dia_emision')?.valid || !form.get('dia_emision')?.touched">
                  El sistema generará la factura este día de cada periodo.
                </small>
              </div>

              <div class="col-md-6">
                <label class="premium-label">Fecha de Inicio</label>
                <div class="input-group-premium" [class.readonly-field]="isViewOnly">
                  <i class="bi bi-calendar3"></i>
                  <input type="date" formControlName="fecha_inicio" class="form-control-premium">
                </div>
              </div>

              <!-- Fecha Fin (Opcional) y Email -->
              <div class="col-md-6">
                <label class="premium-label">Fecha de Finalización (Opcional)</label>
                <div class="input-group-premium" [class.readonly-field]="isViewOnly">
                  <i class="bi bi-calendar-x"></i>
                  <input type="date" formControlName="fecha_fin" class="form-control-premium">
                </div>
              </div>

              <div class="col-md-6 d-flex align-items-center">
                <div class="form-check form-switch-premium mt-4">
                  <input class="form-check-input" type="checkbox" formControlName="enviar_email" id="emailSwitch">
                  <label class="form-check-label ms-2" for="emailSwitch">
                    Enviar factura por email automáticamente
                  </label>
                </div>
              </div>

              <div class="col-12" *ngIf="programacion">
                 <div class="form-check form-switch-premium">
                  <input class="form-check-input" type="checkbox" formControlName="activo" id="activeSwitch">
                  <label class="form-check-label ms-2" for="activeSwitch">
                    Mantener esta programación activa
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary-premium" (click)="onClose.emit(false)">
              {{ isViewOnly ? 'Cerrar' : 'Cancelar' }}
            </button>
            <button type="submit" class="btn btn-primary-premium" *ngIf="!isViewOnly" [disabled]="form.invalid || isSaving">
              <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
              {{ programacion ? 'Guardar Cambios' : 'Crear Programación' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px);
      z-index: 1200; display: flex; align-items: center; justify-content: center;
      padding: 1.5rem;
    }
    .modal-container {
      background: white; width: 100%; max-width: 800px;
      max-height: 90vh; border-radius: 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .modal-header {
      padding: 1.75rem 2rem; border-bottom: 1px solid #f1f5f9;
      display: flex; justify-content: space-between; align-items: center;
      background: #f8fafc;
    }
    .header-content { display: flex; align-items: center; gap: 1.25rem; }
    .icon-circle {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; color: white;
    }
    .bg-premium { background: #161d35; }
    .header-text h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
    .header-text p { margin: 0; font-size: 0.85rem; color: #64748b; }
    .btn-close-modal {
      width: 36px; height: 36px; border-radius: 10px; border: none; background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: #64748b; transition: all 0.2s;
    }
    .btn-close-modal:hover { background: #e2e8f0; color: #0f172a; transform: rotate(90deg); }

    .modal-body { padding: 2rem; overflow-y: auto; }
    .modal-footer {
      padding: 1.5rem 2rem; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end; gap: 1rem;
      background: #f8fafc;
    }

    .premium-label {
      display: block; font-size: 0.75rem; font-weight: 700;
      color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .input-group-premium {
      position: relative; display: flex; align-items: center;
    }
    .input-group-premium i {
      position: absolute; left: 1rem; color: #94a3b8; font-size: 1.1rem;
    }
    .form-control-premium, .form-select-premium {
      width: 100%; padding: 0.75rem 1rem 0.75rem 2.8rem;
      border-radius: 12px; border: 1.5px solid #e2e8f0;
      background: #f8fafc; font-size: 0.95rem; font-weight: 500;
      color: #1e293b; transition: all 0.2s;
    }
    .form-control-premium:focus, .form-select-premium:focus {
      border-color: #161d35; background: white;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05); outline: none;
    }
    .readonly-field .form-control-premium, .readonly-field .form-select-premium {
      background: #f1f5f9 !important; border-color: #e2e8f0 !important; cursor: default;
    }

    .form-select-premium option {
      color: #1e293b;
      background-color: white;
    }

    .form-switch-premium .form-check-input { width: 3rem; height: 1.5rem; cursor: pointer; }
    .form-switch-premium .form-check-label { font-size: 0.9rem; font-weight: 600; color: #475569; }

    .btn-primary-premium {
      background: #161d35; color: white; border: none;
      padding: 0.75rem 2rem; border-radius: 14px; font-weight: 700;
      transition: all 0.2s;
    }
    .btn-primary-premium:hover { background: #0f172a; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
    .btn-primary-premium:disabled { background: #94a3b8; transform: none; box-shadow: none; }

    .btn-secondary-premium {
      background: white; border: 1.5px solid #e2e8f0; color: #64748b;
      padding: 0.75rem 2rem; border-radius: 14px; font-weight: 700;
      transition: all 0.2s;
    }
    .btn-secondary-premium:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
    .smallest { font-size: 0.7rem; }
  `]
})
export class CreateRecurrenteModalComponent implements OnInit {
  @Input() programacion: FacturaProgramada | null = null;
  @Input() isViewOnly: boolean = false;
  @Output() onClose = new EventEmitter<boolean>();

  form: FormGroup;
  clientes: Cliente[] = [];
  isSaving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private service: FacturacionProgramadaService,
    private clientesService: ClientesService
  ) {
    this.form = this.fb.group({
      cliente_id: ['', Validators.required],
      tipo_frecuencia: ['MENSUAL', Validators.required],
      dia_emision: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      monto: [0, [Validators.required, Validators.min(0)]],
      concepto: ['', Validators.required],
      fecha_inicio: [new Date().toISOString().split('T')[0], Validators.required],
      fecha_fin: [''],
      activo: [true],
      enviar_email: [true]
    });
  }

  ngOnInit() {
    this.loadClientes();
    if (this.programacion) {
      this.form.patchValue({
        cliente_id: this.programacion.cliente_id,
        tipo_frecuencia: this.programacion.tipo_frecuencia,
        dia_emision: this.programacion.dia_emision,
        monto: this.programacion.monto,
        concepto: this.programacion.concepto,
        fecha_inicio: this.programacion.fecha_inicio,
        fecha_fin: this.programacion.fecha_fin,
        activo: this.programacion.activo,
        enviar_email: this.programacion.enviar_email
      });
      
      if (this.isViewOnly) {
        this.form.disable();
      }
    }
  }

  loadClientes() {
    this.clientesService.getActivos().subscribe((data: Cliente[]) => this.clientes = data);
  }

  save() {
    if (this.form.invalid) return;

    this.isSaving = true;
    
    // Preparar datos: convertir strings vacíos de fechas opcionales en null
    const body = { ...this.form.value };
    if (!body.fecha_fin) {
      body.fecha_fin = null;
    }

    const request = this.programacion 
      ? this.service.actualizar(this.programacion.id, body)
      : this.service.crear(body);

    request.pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => this.onClose.emit(true),
        error: (err) => {
          console.error("Error al guardar programación", err);
        }
      });
  }

  validateNoNegative(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 45) { // Signo menos '-'
      event.preventDefault();
    }
  }

  limitLength(event: any, max: number) {
    const input = event.target;
    if (input.value.length > max) {
      input.value = input.value.slice(0, max);
      this.form.get('dia_emision')?.setValue(input.value);
    }
  }
}

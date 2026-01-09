import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { VendedorService, Vendedor } from '../../../../core/services/vendedor.service';
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-vendedores-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent],
  template: `
    <div class="container-fluid p-0">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="h4 mb-1 fw-bold">Equipo de Ventas</h2>
            <p class="text-muted small mb-0">Gestiona los vendedores y sus configuraciones de comisiones.</p>
        </div>
        <button class="btn btn-primary rounded-3 px-4 fw-bold shadow-sm" 
                style="background-color: #5a4bda; border: none;"
                (click)="openCreateModal()">
          <i class="bi bi-person-plus-fill me-2"></i> Nuevo Vendedor
        </button>
      </div>

      <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light text-secondary small text-uppercase">
              <tr>
                <th class="ps-4">Vendedor</th>
                <th>Contacto</th>
                <th>Comisiones (I/R)</th>
                <th>Permisos</th>
                <th>Estado</th>
                <th class="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody class="border-top-0">
              @for (vendedor of vendedores(); track vendedor.id) {
              <tr>
                <td class="ps-4">
                  <div class="d-flex align-items-center">
                    <div class="avatar bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                      <i class="bi bi-person-badge"></i>
                    </div>
                    <div>
                      <div class="fw-bold text-dark">{{ vendedor.nombres }} {{ vendedor.apellidos }}</div>
                      <div class="small text-muted">{{ vendedor.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="small text-dark"><i class="bi bi-telephone me-1 text-muted"></i> {{ vendedor.telefono || 'N/A' }}</div>
                  <div class="small text-muted"><i class="bi bi-card-text me-1"></i> {{ vendedor.documento_identidad || 'N/A' }}</div>
                </td>
                <td>
                  <div>
                    <span class="badge bg-success-subtle text-success border border-success-subtle me-1">
                      {{ vendedor.porcentaje_comision_inicial || 0 }}% I
                    </span>
                    <span class="badge bg-info-subtle text-info border border-info-subtle">
                      {{ vendedor.porcentaje_comision_recurrente || 0 }}% R
                    </span>
                  </div>
                  <div class="small text-muted mt-1">{{ vendedor.tipo_comision || 'FIJO' }}</div>
                </td>
                <td>
                  <div class="d-flex gap-1 flex-wrap" style="max-width: 200px;">
                    <span *ngIf="vendedor.puede_crear_empresas" class="badge bg-light text-dark border small" title="Crear Empresas">Empresas</span>
                    <span *ngIf="vendedor.puede_gestionar_planes" class="badge bg-light text-dark border small" title="Gestionar Planes">Planes</span>
                    <span *ngIf="vendedor.puede_ver_reportes" class="badge bg-light text-dark border small" title="Ver Reportes">Reportes</span>
                  </div>
                </td>
                <td>
                  <span class="badge rounded-pill px-3 py-1 fw-bold" 
                        [ngClass]="vendedor.activo ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'">
                    {{ vendedor.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <div class="btn-group shadow-sm rounded-3">
                    <button class="btn btn-white btn-sm border" (click)="openEditModal(vendedor)" title="Editar">
                      <i class="bi bi-pencil-square text-primary"></i>
                    </button>
                    <button class="btn btn-white btn-sm border" (click)="deleteVendedor(vendedor)" title="Eliminar">
                      <i class="bi bi-trash text-danger"></i>
                    </button>
                  </div>
                </td>
              </tr>
              }
              @if (vendedores().length === 0) {
              <tr>
                <td colspan="6" class="text-center py-5 text-secondary">
                  <i class="bi bi-people h1 d-block mb-3 opacity-25"></i>
                  No hay vendedores registrados aún.
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- FORM MODAL -->
    @if (formModalOpen()) {
    <app-modal [title]="selectedVendedor() ? 'Editar Vendedor' : 'Nuevo Vendedor'" [size]="'lg'" (close)="closeModal()">
        <form [formGroup]="vendedorForm" (ngSubmit)="saveVendedor()" class="px-2">
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-uppercase text-secondary">Nombres</label>
                    <input type="text" class="form-control border-2" formControlName="nombres" style="border-radius: 10px;">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-uppercase text-secondary">Apellidos</label>
                    <input type="text" class="form-control border-2" formControlName="apellidos" style="border-radius: 10px;">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-uppercase text-secondary">Email / Usuario</label>
                    <input type="email" class="form-control border-2" formControlName="email" style="border-radius: 10px;">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-uppercase text-secondary">Contraseña {{ selectedVendedor() ? '(Opcional)' : '' }}</label>
                    <input type="password" class="form-control border-2" formControlName="password" 
                           [class.is-invalid]="vendedorForm.get('password')?.invalid && vendedorForm.get('password')?.touched"
                           placeholder="Min. 6 caracteres" style="border-radius: 10px;">
                    <div class="invalid-feedback">La contraseña debe tener al menos 6 caracteres.</div>
                </div>
                <!-- ... existing email field ... -->
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-uppercase text-secondary">Teléfono</label>
                    <input type="text" class="form-control border-2" formControlName="telefono" 
                           [class.is-invalid]="vendedorForm.get('telefono')?.invalid && vendedorForm.get('telefono')?.touched"
                           maxlength="10"
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                           style="border-radius: 10px;">
                    <div class="invalid-feedback">Debe tener exactamente 10 números.</div>
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-uppercase text-secondary">DNI / Cédula</label>
                    <input type="text" class="form-control border-2" formControlName="documento_identidad" 
                           [class.is-invalid]="vendedorForm.get('documento_identidad')?.invalid && vendedorForm.get('documento_identidad')?.touched"
                           maxlength="10"
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                           style="border-radius: 10px;">
                    <div class="invalid-feedback">Debe tener exactamente 10 números.</div>
                </div>

                <hr class="my-4">
                <h6 class="fw-bold text-primary mb-3">Configuración de Comisiones</h6>

                <div class="col-md-4">
                    <label class="form-label small fw-bold">Comisión Flat (%)</label>
                    <div class="input-group">
                        <input type="number" class="form-control border-2" formControlName="porcentaje_comision" style="border-radius: 10px 0 0 10px;">
                        <span class="input-group-text border-2">%</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Porcentaje Inicial (%)</label>
                    <div class="input-group">
                        <input type="number" class="form-control border-2" formControlName="porcentaje_comision_inicial" style="border-radius: 10px 0 0 10px;">
                        <span class="input-group-text border-2">%</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Porcentaje Recurrente (%)</label>
                    <div class="input-group">
                        <input type="number" class="form-control border-2" formControlName="porcentaje_comision_recurrente" style="border-radius: 10px 0 0 10px;">
                        <span class="input-group-text border-2">%</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold">Tipo Comisión</label>
                    <select class="form-select border-2" formControlName="tipo_comision" style="border-radius: 10px;">
                        <option value="PORCENTAJE">Porcentaje sobre Pago</option>
                        <option value="FIJO">Monto Fijo (Manual)</option>
                    </select>
                </div>

                <hr class="my-4">
                <h6 class="fw-bold text-primary mb-3">Permisos y Estado</h6>

                <div class="col-12">
                    <div class="d-flex gap-4">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" formControlName="puede_crear_empresas">
                            <label class="form-check-label ps-2">Crear Empresas</label>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" formControlName="puede_gestionar_planes">
                            <label class="form-check-label ps-2">Gestionar Planes</label>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" formControlName="puede_ver_reportes">
                            <label class="form-check-label ps-2">Ver Reportes</label>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" formControlName="activo">
                            <label class="form-check-label ps-2 fw-bold text-dark">Vendedor Activo</label>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-5 d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light rounded-3 px-4" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary rounded-3 px-4 shadow-sm" [disabled]="vendedorForm.invalid || saving()" style="background-color: #5a4bda; border: none;">
                    {{ saving() ? 'Guardando...' : (selectedVendedor() ? 'Actualizar Vendedor' : 'Crear Vendedor') }}
                </button>
            </div>
        </form>
    </app-modal>
    }
  `,
  styles: [`
    .table th { border: none; font-weight: 600; font-size: 0.75rem; color: #6c757d; }
    .table td { padding: 1.25rem 0.5rem; border-color: #f1f3f5; }
    .avatar { font-size: 1.25rem; }
    .badge { font-weight: 600; letter-spacing: 0.3px; }
  `]
})
export class VendedoresListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private vendedorService = inject(VendedorService);
  private feedback = inject(FeedbackService);

  vendedores = signal<Vendedor[]>([]);
  formModalOpen = signal(false);
  selectedVendedor = signal<Vendedor | null>(null);
  saving = signal(false);

  vendedorForm: FormGroup = this.fb.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    telefono: ['', [Validators.pattern('^([0-9]{10})?$')]],
    documento_identidad: ['', [Validators.pattern('^([0-9]{10})?$')]],
    porcentaje_comision: [0, [Validators.min(0), Validators.max(100)]],
    porcentaje_comision_inicial: [10, [Validators.min(0), Validators.max(100)]],
    porcentaje_comision_recurrente: [5, [Validators.min(0), Validators.max(100)]],
    tipo_comision: ['PORCENTAJE'],
    puede_crear_empresas: [true],
    puede_gestionar_planes: [false],
    puede_ver_reportes: [false],
    activo: [true]
  });

  ngOnInit() {
    this.cargarVendedores();
  }

  cargarVendedores() {
    this.vendedorService.getVendedores().subscribe({
      next: (data) => this.vendedores.set(data),
      error: (err) => this.feedback.showError('Error al cargar vendedores')
    });
  }

  openCreateModal() {
    this.selectedVendedor.set(null);
    this.vendedorForm.reset({
      porcentaje_comision: 0,
      porcentaje_comision_inicial: 10,
      porcentaje_comision_recurrente: 5,
      tipo_comision: 'PORCENTAJE',
      puede_crear_empresas: true,
      puede_gestionar_planes: false,
      puede_ver_reportes: false,
      activo: true
    });
    this.vendedorForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.formModalOpen.set(true);
  }

  openEditModal(vendedor: Vendedor) {
    this.selectedVendedor.set(vendedor);
    this.vendedorForm.patchValue(vendedor);
    this.vendedorForm.get('password')?.setValidators([Validators.minLength(6)]); // Opcional al editar
    this.formModalOpen.set(true);
  }

  closeModal() {
    this.formModalOpen.set(false);
  }

  saveVendedor() {
    if (this.vendedorForm.invalid) return;
    this.saving.set(true);

    const data = { ...this.vendedorForm.value };

    // Si estamos editando y la contraseña está vacía, no la enviamos
    if (this.selectedVendedor() && !data.password) {
      delete data.password;
    }

    const observer = {
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.cargarVendedores();
        this.feedback.showSuccess(this.selectedVendedor() ? 'Vendedor actualizado' : 'Vendedor creado');
      },
      error: (err: any) => {
        this.saving.set(false);
        console.error('ERROR DETALLADO VENDEDOR:', err);
        if (err.error && err.error.detail) {
          console.error('DETALLE DE VALIDACIÓN:', err.error.detail);
        }
        this.feedback.showError('Error: ' + (err.error?.detail?.[0]?.msg || err.error?.detail || 'Operación fallida'));
      }
    };

    if (this.selectedVendedor()) {
      this.vendedorService.updateVendedor(this.selectedVendedor()!.id, data).subscribe(observer);
    } else {
      this.vendedorService.createVendedor(data).subscribe(observer);
    }
  }

  deleteVendedor(vendedor: Vendedor) {
    if (confirm(`¿Está seguro de eliminar a ${vendedor.nombres}?`)) {
      this.vendedorService.deleteVendedor(vendedor.id).subscribe({
        next: () => {
          this.feedback.showSuccess('Vendedor eliminado');
          this.cargarVendedores();
        },
        error: () => this.feedback.showError('No se pudo eliminar el vendedor')
      });
    }
  }
}

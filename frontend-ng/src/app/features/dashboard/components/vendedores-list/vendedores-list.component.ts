import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { VendedorService, Vendedor } from '../../../../core/services/vendedor.service';
import { ComisionService, Comision } from '../../../../core/services/comision.service';
import { EmpresaService, Empresa } from '../../../../core/services/empresa.service';
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-vendedores-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent],
  template: `
    <div class="vendedores-content">
      
      <!-- TABS -->
      <div class="d-flex mb-4 gap-3 border-bottom pb-2">
        <button class="btn rounded-pill px-4 fw-bold transition-all" 
                [ngClass]="activeTab() === 'equipo' ? 'btn-dark shadow-sm' : 'btn-light text-muted bg-transparent border-0'"
                (click)="activeTab.set('equipo')">
          <i class="bi bi-people-fill me-2"></i> Mi Equipo
        </button>
        <button class="btn rounded-pill px-4 fw-bold transition-all" 
                [ngClass]="activeTab() === 'comisiones' ? 'btn-dark shadow-sm' : 'btn-light text-muted bg-transparent border-0'"
                (click)="activeTab.set('comisiones')">
          <i class="bi bi-cash-stack me-2"></i> Gestión de Comisiones
        </button>
      </div>

      <!-- VENDEDORES TAB -->
      @if (activeTab() === 'equipo') {
        <div class="d-flex justify-content-end mb-4 fade-in">
            <button class="btn btn-dark rounded-pill px-4 fw-bold shadow-sm" (click)="openCreateModal()">
            <i class="bi bi-person-plus-fill me-2"></i> Nuevo Vendedor
            </button>
        </div>

        <div class="card border-0 shadow-sm rounded-4 overflow-hidden fade-in">
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
                        <button class="btn btn-white btn-sm border" (click)="openEmpresasModal(vendedor)" title="Ver Empresas">
                        <i class="bi bi-building text-success"></i>
                        </button>
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
      }

      <!-- COMISIONES TAB -->
      @if (activeTab() === 'comisiones') {
        <div class="fade-in">
            <!-- SUMMARY -->
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div class="small text-muted fw-bold text-uppercase mb-1">Total Pendiente</div>
                        <div class="h3 mb-0 fw-bold text-warning">$ {{ totalPendiente() }}</div>
                        <div class="small text-muted mt-2">Por pagar a vendedores</div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                        <div class="small text-muted fw-bold text-uppercase mb-1">Pagado este Mes</div>
                        <div class="h3 mb-0 fw-bold text-success">$ {{ totalPagadoMes() }}</div>
                        <div class="small text-muted mt-2">Comisiones desembolsadas</div>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light text-secondary small text-uppercase">
                    <tr>
                        <th class="ps-4">Vendedor</th>
                        <th>Concepto / Empresa</th>
                        <th>Comisión</th>
                        <th>Estado</th>
                        <th>Fecha Generación</th>
                        <th class="text-end pe-4">Acciones</th>
                    </tr>
                    </thead>
                    <tbody class="border-top-0">
                    @for (com of comisiones(); track com.id) {
                    <tr>
                        <td class="ps-4">
                        <div class="fw-bold text-dark">{{ com.vendedor_nombre }}</div>
                        </td>
                        <td>
                        <div class="small text-dark fw-medium">{{ com.empresa_nombre }}</div>
                        <div class="small text-muted">Pago Base: $ {{ com.monto_pago }}</div>
                        </td>
                        <td>
                        <div class="fw-bold text-primary">$ {{ com.monto }}</div>
                        <div class="small text-muted">({{ com.porcentaje_aplicado }}%)</div>
                        </td>
                        <td>
                        <span class="status-badge" [ngClass]="getStatusClass(com.estado)">
                            {{ getStatusLabel(com.estado) }}
                        </span>
                        </td>
                        <td>
                        <div class="small text-dark">{{ com.fecha_generacion | date:'dd/MM/yyyy' }}</div>
                        </td>
                        <td class="text-end pe-4">
                        <button *ngIf="com.estado === 'PENDIENTE'" 
                                class="btn btn-primary btn-sm rounded-3 px-3 shadow-sm"
                                style="background-color: #00ca72; border: none;"
                                (click)="openPayModal(com)">
                            Registrar Pago
                        </button>
                        <button *ngIf="com.estado === 'PAGADA'" 
                                class="btn btn-light btn-sm rounded-3 px-3 border"
                                (click)="openPayModal(com)">
                            Ver Detalles
                        </button>
                        </td>
                    </tr>
                    }
                    @if (comisiones().length === 0) {
                    <tr>
                        <td colspan="6" class="text-center py-5 text-secondary">
                        <i class="bi bi-cash-coin h1 d-block mb-3 opacity-25"></i>
                        No hay comisiones registradas.
                        </td>
                    </tr>
                    }
                    </tbody>
                </table>
                </div>
            </div>
        </div>
      }
    </div>

    <!-- VENDEDOR FORM MODAL -->
    @if (formModalOpen()) {
    <app-modal [title]="selectedVendedor() ? 'Editar Vendedor' : 'Nuevo Vendedor'" [size]="'lg'" (close)="closeModal()">
        <form [formGroup]="vendedorForm" (ngSubmit)="saveVendedor()" class="px-2">
            <!-- Form fields same as before, truncated for brevity in replacement but preserved in logic -->
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

    <!-- PAYMENT MODAL -->
    @if (payModalOpen()) {
    <app-modal [title]="selectedComision()?.estado === 'PAGADA' ? 'Detalle de Pago' : 'Registrar Pago de Comisión'" [size]="'md'" (close)="closePayModal()">
        <div class="px-2">
            <div class="p-3 bg-light rounded-4 mb-4 border shadow-sm">
                <div class="row g-2">
                    <div class="col-6">
                        <div class="small text-muted">Vendedor</div>
                        <div class="fw-bold">{{ selectedComision()?.vendedor_nombre }}</div>
                    </div>
                    <div class="col-6 text-end">
                        <div class="small text-muted">Monto a Pagar</div>
                        <div class="h4 mb-0 fw-bold text-primary">$ {{ selectedComision()?.monto }}</div>
                    </div>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label small fw-bold text-secondary text-uppercase">Método de Pago</label>
                <select class="form-select border-2" [(ngModel)]="paymentMethod" 
                        [disabled]="selectedComision()?.estado === 'PAGADA'" style="border-radius: 10px;">
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTRO">Otro</option>
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label small fw-bold text-secondary text-uppercase">Fecha de Pago</label>
                <input type="date" class="form-control border-2" [(ngModel)]="paymentDate"
                       [disabled]="selectedComision()?.estado === 'PAGADA'" style="border-radius: 10px;">
            </div>

            <div class="mb-3">
                <label class="form-label small fw-bold text-secondary text-uppercase">Observaciones / Referencia</label>
                <textarea class="form-control border-2" rows="3" [(ngModel)]="paymentObs"
                          [disabled]="selectedComision()?.estado === 'PAGADA'"
                          placeholder="Nro de comprobante, banco, etc..." style="border-radius: 10px;"></textarea>
            </div>
        </div>

        <ng-container footer>
            <button class="btn btn-light rounded-3 px-4" (click)="closePayModal()">Cerrar</button>
            <button *ngIf="selectedComision()?.estado === 'PENDIENTE'"
                    class="btn btn-primary rounded-3 px-4 shadow-sm" [disabled]="saving()" (click)="confirmPayment()" 
                    style="background-color: #5a4bda; border: none;">
                {{ saving() ? 'Procesando...' : 'Confirmar Pago' }}
            </button>
        </ng-container>
    </app-modal>
    }

    <!-- COMPANIES MODAL -->
    @if (empresasModalOpen()) {
    <app-modal [title]="'Empresas de ' + selectedVendedor()?.nombres" [size]="'lg'" (close)="closeEmpresasModal()">
        <div class="px-2">
            <p class="text-muted small mb-4">Lista de empresas asignadas a <strong>{{ selectedVendedor()?.nombres }} {{ selectedVendedor()?.apellidos }}</strong>.</p>
            
            <div class="table-responsive rounded-3 border">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light small fw-bold">
                        <tr>
                            <th class="ps-3">Empresa</th>
                            <th>RUC</th>
                            <th>Estado</th>
                            <th class="text-end pe-3">Reasignar a</th>
                        </tr>
                    </thead>
                    <tbody>
                        @for (empresa of empresasDelVendedor(); track empresa.id) {
                        <tr>
                            <td class="ps-3 fw-medium">{{ empresa.nombre_comercial }}</td>
                            <td>{{ empresa.ruc }}</td>
                            <td>
                                <span class="badge rounded-pill px-2 py-1" [ngClass]="empresa.activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'">
                                    {{ empresa.activo ? 'Activa' : 'Inactiva' }}
                                </span>
                            </td>
                            <td class="text-end pe-3">
                                <select class="form-select form-select-sm d-inline-block w-auto" 
                                        (change)="onReassignChange(empresa.id, $event)">
                                    <option value="" [selected]="!empresa.vendedor_id">Nous Direct (Superadmin)</option>
                                    @for (v of vendedores(); track v.id) {
                                        <option [value]="v.id" [selected]="v.id === empresa.vendedor_id">{{ v.nombres }} {{ v.apellidos }}</option>
                                    }
                                </select>
                            </td>
                        </tr>
                        }
                        @if (empresasDelVendedor().length === 0) {
                        <tr>
                            <td colspan="4" class="text-center py-4 text-muted">No hay empresas asignadas a este vendedor.</td>
                        </tr>
                        }
                    </tbody>
                </table>
            </div>
        </div>
        <ng-container footer>
            <button class="btn btn-dark rounded-3 px-4" (click)="closeEmpresasModal()">Cerrar</button>
        </ng-container>
    </app-modal>
    }
  `,
  styles: [`
    .table th { border: none; font-weight: 600; font-size: 0.75rem; color: #6c757d; }
    .table td { padding: 1.25rem 0.5rem; border-color: #f1f3f5; }
    .avatar { font-size: 1.25rem; }
    .badge { font-weight: 600; letter-spacing: 0.3px; }
    .transition-all { transition: all 0.2s ease; }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .status-badge {
        display: inline-block;
        padding: 0.35rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        border-radius: 6px;
        border: 2px solid;
        color: #000 !important;
        min-width: 100px;
        text-align: center;
    }

    .status-pending { background-color: #fff4e5; border-color: #ffb347; }
    .status-completed, .status-pagada { background-color: #e6f9ed; border-color: #00ca72; }
    .status-canceled { background-color: #f4f4f4; border-color: #6c757d; }
  `]
})
export class VendedoresListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private vendedorService = inject(VendedorService);
  private comService = inject(ComisionService);
  private empresaService = inject(EmpresaService);
  private feedback = inject(FeedbackService);

  // General State
  activeTab = signal<'equipo' | 'comisiones'>('equipo');
  saving = signal(false);

  // VENDEDORES STATE
  vendedores = signal<Vendedor[]>([]);
  formModalOpen = signal(false);
  empresasModalOpen = signal(false);
  selectedVendedor = signal<Vendedor | null>(null);
  empresasDelVendedor = signal<Empresa[]>([]);

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

  // COMISIONES STATE
  comisiones = signal<Comision[]>([]);
  payModalOpen = signal(false);
  selectedComision = signal<Comision | null>(null);

  paymentMethod = 'TRANSFERENCIA';
  paymentDate = new Date().toISOString().split('T')[0];
  paymentObs = '';

  readonly STATUS_CONFIG: { [key: string]: { label: string, class: string } } = {
    'PENDIENTE': { label: 'Pendiente', class: 'status-pending' },
    'PAGADA': { label: 'Pagada', class: 'status-pagada' },
    'CANCELADA': { label: 'Cancelada', class: 'status-canceled' }
  };

  ngOnInit() {
    this.cargarData();
  }

  cargarData() {
    this.cargarVendedores();
    this.cargarComisiones();
  }

  // --- VENDEDORES LOGIC ---
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

  // --- EMPRESAS ASIGNADAS LOGIC ---
  openEmpresasModal(vendedor: Vendedor) {
    this.selectedVendedor.set(vendedor);
    this.cargarEmpresasDelVendedor(vendedor.id);
    this.empresasModalOpen.set(true);
  }

  closeEmpresasModal() {
    this.empresasModalOpen.set(false);
    this.selectedVendedor.set(null);
    this.empresasDelVendedor.set([]);
  }

  cargarEmpresasDelVendedor(vendedorId: string) {
    this.empresaService.getEmpresas(vendedorId).subscribe({
      next: (data) => this.empresasDelVendedor.set(data),
      error: () => this.feedback.showError('Error al cargar empresas del vendedor')
    });
  }

  onReassignChange(empresaId: string, event: any) {
    const nuevoVendedorId = event.target.value || null;
    const vendedorDestino = nuevoVendedorId
      ? this.vendedores().find(v => v.id === nuevoVendedorId)
      : null;

    const nombreDestino = vendedorDestino
      ? `${vendedorDestino.nombres} ${vendedorDestino.apellidos}`
      : 'Nous Direct (Superadmin)';

    if (confirm(`¿Está seguro de reasignar esta empresa a ${nombreDestino}?`)) {
      this.saving.set(true);
      this.empresaService.assignVendor(empresaId, nuevoVendedorId).subscribe({
        next: () => {
          this.saving.set(false);
          this.feedback.showSuccess('Empresa reasignada correctamente');
          // Recargar la lista de empresas del vendedor actual para que desaparezca la que se movió
          if (this.selectedVendedor()) {
            this.cargarEmpresasDelVendedor(this.selectedVendedor()!.id);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.feedback.showError('Error al reasignar empresa');
          // Revertir el select si es posible o simplemente recargar
          if (this.selectedVendedor()) {
            this.cargarEmpresasDelVendedor(this.selectedVendedor()!.id);
          }
        }
      });
    } else {
      // Revertir el cambio visual en el select
      if (this.selectedVendedor()) {
        this.cargarEmpresasDelVendedor(this.selectedVendedor()!.id);
      }
    }
  }

  // --- COMISIONES LOGIC ---
  cargarComisiones() {
    this.comService.getComisiones().subscribe({
      next: (data) => this.comisiones.set(data),
      error: () => console.warn('Error al cargar comisiones iniciales') // Fail silently initially or show error
    });
  }

  getStatusLabel(estado: string): string {
    return this.STATUS_CONFIG[estado]?.label || estado;
  }

  getStatusClass(estado: string): string {
    return this.STATUS_CONFIG[estado]?.class || '';
  }

  openPayModal(com: Comision) {
    this.selectedComision.set(com);
    if (com.estado === 'PAGADA') {
      this.paymentMethod = com.metodo_pago || 'TRANSFERENCIA';
      this.paymentDate = com.fecha_pago || '';
      this.paymentObs = com.observaciones || '';
    } else {
      this.paymentMethod = 'TRANSFERENCIA';
      this.paymentDate = new Date().toISOString().split('T')[0];
      this.paymentObs = '';
    }
    this.payModalOpen.set(true);
  }

  closePayModal() {
    this.payModalOpen.set(false);
  }

  confirmPayment() {
    if (!this.selectedComision()) return;
    this.saving.set(true);

    this.comService.updateComision(this.selectedComision()!.id, {
      estado: 'PAGADA',
      metodo_pago: this.paymentMethod,
      fecha_pago: this.paymentDate,
      observaciones: this.paymentObs
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closePayModal();
        this.cargarComisiones();
        this.feedback.showSuccess('Pago registrado exitosamente');
      },
      error: (err) => {
        this.saving.set(false);
        this.feedback.showError('Error al registrar pago');
      }
    });
  }

  totalPendiente() {
    return this.comisiones()
      .filter(c => c.estado === 'PENDIENTE')
      .reduce((sum, c) => sum + Number(c.monto), 0)
      .toFixed(2);
  }

  totalPagadoMes() {
    const ahora = new Date();
    return this.comisiones()
      .filter(c => {
        if (c.estado !== 'PAGADA' || !c.fecha_pago) return false;
        const f = new Date(c.fecha_pago);
        return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
      })
      .reduce((sum, c) => sum + Number(c.monto), 0)
      .toFixed(2);
  }
}

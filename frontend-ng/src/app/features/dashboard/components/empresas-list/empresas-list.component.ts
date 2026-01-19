import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

import { EmpresaService, Empresa } from '../../../../core/services/empresa.service';
import { VendedorService, Vendedor } from '../../../../core/services/vendedor.service';
import { PlanService, Plan } from '../../../../core/services/plan.service';
import { PagoSuscripcionService } from '../../../../core/services/pago-suscripcion.service';
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

import { EmpresaStatsComponent } from './components/empresa-stats/empresa-stats.component';
import { EmpresaFormComponent } from './components/empresa-form/empresa-form.component';
import { EmpresaDetailComponent } from './components/empresa-detail/empresa-detail.component';

@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent, EmpresaStatsComponent, EmpresaFormComponent, EmpresaDetailComponent],
  template: `
    <div class="empresas-content">
      <div class="d-flex justify-content-end mb-4" header-actions>
        <div class="d-flex gap-2">
            <button class="btn btn-dark rounded-pill px-4 fw-bold shadow-sm" (click)="openCreateModal()">
              <i class="bi bi-plus-lg me-2"></i> Nueva Empresa
            </button>
            <button class="btn btn-white rounded-circle shadow-sm border" (click)="loadEmpresas(filterVendorControl.value || '', true)">
                <i class="bi bi-arrow-clockwise"></i>
            </button>
        </div>
      </div>


      <!-- SUMMARY WIDGETS -->
      <app-empresa-stats 
        [totalEmpresas]="empresas().length"
        [totalActivas]="totalActivas()"
        [totalVencidas]="totalVencidas()">
      </app-empresa-stats>

      <div class="card border-0 shadow-sm p-4 rounded-5">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr class="bg-white">
                <th class="ps-4 py-3 border-0 rounded-start-5 text-secondary small text-uppercase fw-bold" style="background-color: #f8f9fa;">Empresa / RUC</th>
                <th class="py-3 border-0 text-secondary small text-uppercase fw-bold" style="background-color: #f8f9fa;">Plan Actual</th>
                <th class="py-3 border-0 text-center text-secondary small text-uppercase fw-bold" style="background-color: #f8f9fa;">Estado</th>
                <th class="py-3 border-0 text-secondary small text-uppercase fw-bold" style="background-color: #f8f9fa;">Vendedor</th>
                <th class="py-3 border-0 text-secondary small text-uppercase fw-bold" style="background-color: #f8f9fa;">Último Pago</th>
                <th class="py-3 border-0 text-secondary small text-uppercase fw-bold" style="background-color: #f8f9fa;">Vencimiento</th>
                <th class="py-3 border-0 text-end pe-4 rounded-end-5 text-secondary small text-uppercase fw-bold" style="background-color: #f8f9fa;">Acciones</th>
              </tr>
            </thead>
            <tbody class="border-top-0">
              <tr class="spacer" style="height: 15px;"></tr>
              @if (loading()) {
               <tr>
                 <td colspan="5" class="text-center py-5">
                    <div class="spinner-border text-dark" role="status"></div>
                    <div class="mt-2 text-muted fw-bold">Cargando empresas...</div>
                 </td>
               </tr>
              } @else if (empresasFiltradas().length === 0) {
               <tr>
                 <td colspan="5" class="text-center py-5 text-muted">
                    <i class="bi bi-search fs-2 mb-2 d-block opacity-25"></i>
                    No se encontraron empresas con los criterios aplicados.
                 </td>
               </tr>
              } @else {
                  @for (empresa of empresasFiltradas(); track empresa.id) {
                  <tr (click)="openViewModal(empresa)" style="cursor: pointer;">
                    <td class="ps-4">
                      <div class="d-flex align-items-center">
                        <div class="bg-light rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 48px; height: 48px; min-width: 48px;">
                          @if(empresa.logo_url) {
                            <img [src]="empresa.logo_url" class="rounded-circle w-100 h-100 object-fit-cover shadow-sm">
                          } @else {
                            <i class="bi bi-building fs-4 text-muted"></i>
                          }
                        </div>
                        <div>
                          <div class="fw-bold text-dark fs-6">{{ empresa.nombre_comercial }}</div>
                          <div class="small text-muted">{{ empresa.ruc }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="fw-bold">{{ empresa.plan || 'Sin Plan' }}</div>
                      <div class="small text-muted" *ngIf="empresa.fecha_fin_plan">
                          Ref: {{ empresa.plan_id ? 'PRO' : 'BASE' }}
                      </div>
                    </td>
                    <td class="text-center">
                      <div class="d-flex flex-column align-items-center gap-1">
                          <span class="badge rounded-pill px-3 py-1 fw-bold small" 
                                [ngClass]="getSuscripcionBadgeClass(empresa.estado_suscripcion)">
                            {{ empresa.estado_suscripcion }}
                          </span>
                          <span class="small text-muted" style="font-size: 0.7rem;">
                            {{ empresa.activo ? 'ACCESO OK' : 'ACCESO BLOQ' }}
                          </span>
                      </div>
                    </td>
                    <td>
                      <div class="fw-medium small text-dark">{{ getVendedorNombre(empresa.vendedor_id) }}</div>
                      <div class="small text-muted" style="font-size: 0.75rem;">{{ empresa.vendedor_id ? 'Comisionista' : 'Nous Direct' }}</div>
                    </td>
                    <!-- Removed Facturas Mes column -->
                    <td>
                      <div class="small fw-medium">{{ (empresa.updated_at || empresa.fecha_registro) | date:'dd/MM/yyyy' }}</div>
                      <div class="small text-muted" style="font-size: 0.7rem;">Ult. Suscripción</div>
                    </td>
                    <td>
                      <div class="fw-bold" [class.text-danger]="empresa.estado_suscripcion === 'VENCIDA'" [class.text-success]="empresa.estado_suscripcion === 'ACTIVA'">
                          {{ empresa.fecha_fin_plan | date:'dd MMM, yyyy' }}
                      </div>
                      <div class="small text-muted" style="font-size: 0.7rem;">Fin de periodo</div>
                    </td>
                    <td class="text-end pe-4" (click)="$event.stopPropagation()">
                         <div class="dropdown">
                            <button class="btn btn-light btn-sm rounded-circle border shadow-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end border-0 shadow rounded-3 p-2">
                                <li><h6 class="dropdown-header small text-uppercase fw-bold text-muted">Acciones</h6></li>
                                <li>
                                    <button class="dropdown-item rounded-2 py-2 small" (click)="openViewModal(empresa)">
                                        <i class="bi bi-eye text-info me-2"></i> Ver Detalles
                                    </button>
                                </li>
                                <li><hr class="dropdown-divider my-1"></li>
                                <li>
                                    <button class="dropdown-item rounded-2 py-2 small" (click)="openEditModal(empresa)">
                                        <i class="bi bi-pencil-fill text-secondary me-2"></i> Editar
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item rounded-2 py-2 small" (click)="openAssignVendorModal(empresa)">
                                        <i class="bi bi-person-badge text-primary me-2"></i> Asignar Vendedor
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item rounded-2 py-2 small" (click)="openChangePlanModal(empresa)">
                                        <i class="bi bi-card-list text-warning me-2"></i> Mejorar Plan
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item rounded-2 py-2 small" (click)="openQuickPayModal(empresa)">
                                        <i class="bi bi-currency-dollar text-success me-2"></i> Registrar Pago
                                    </button>
                                </li>
                                <li><hr class="dropdown-divider my-1"></li>
                                <li>
                                    <button class="dropdown-item rounded-2 py-2 small" (click)="openToggleActiveModal(empresa)">
                                        <i class="bi" [ngClass]="empresa.activo ? 'bi-toggle-on text-danger' : 'bi-toggle-off text-success'"></i> 
                                        <span class="ms-2" [class.text-danger]="empresa.activo" [class.text-success]="!empresa.activo">
                                            {{ empresa.activo ? 'Desactivar' : 'Activar' }}
                                        </span>
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item rounded-2 py-2 small" (click)="openSupportModeModal()">
                                        <i class="bi bi-shield-lock text-dark me-2"></i> Modo Soporte
                                    </button>
                                </li>
                                <li><hr class="dropdown-divider my-1"></li>
                                <li>
                                    <button class="dropdown-item rounded-2 py-2 small text-danger" (click)="openDeleteModal(empresa)">
                                        <i class="bi bi-trash me-2"></i> Eliminar
                                    </button>
                                </li>
                            </ul>
                         </div>
                    </td>
                  </tr>
                  }
              }
            </tbody>
          </table>
        <div class="card-footer bg-transparent border-0 py-3 text-end text-muted small">
          Mostrando {{ empresas().length }} empresas
        </div>
      </div>
    </div>




    <!-- VIEW DETAILS MODAL -->
    <app-empresa-detail
        [isOpen]="viewModalOpen()"
        [empresa]="selectedEmpresa()"
        [vendedorNombre]="getVendedorNombre(selectedEmpresa()?.vendedor_id)"
        (close)="closeViewModal()"
        (edit)="openEditModal($event)">
    </app-empresa-detail>

    <!-- CREATE/EDIT MODAL VIA SHARED FORM -->
    <app-empresa-form
        [isOpen]="createModalOpen() || editModalOpen()"
        [isEdit]="editModalOpen()"
        [empresa]="selectedEmpresa()"
        [vendedores]="vendedores()"
        [saving]="saving()"
        (close)="closeFormModal()"
        (save)="onFormSubmit($event)">
    </app-empresa-form>

    <!-- ASSIGN VENDOR MODAL -->
    @if (assignVendorModalOpen()) {
    <app-modal [title]="'Asignar Vendedor'" [size]="'md'" (close)="closeAssignVendorModal()">
        <p class="text-muted small mb-4">Selecciona un vendedor para asignar a la empresa <strong>{{selectedEmpresa()?.nombre_comercial}}</strong>.</p>
        
        <div class="form-group mb-3">
            <label class="form-label small fw-bold text-secondary">Vendedor</label>
            <select class="form-select" [formControl]="vendorControl">
                <option value="">-- Sin Vendedor (Superadmin) --</option>
                @for (vendedor of vendedores(); track vendedor.id) {
                    <option [value]="vendedor.id">{{ vendedor.nombres }} {{ vendedor.apellidos }} ({{ vendedor.email }})</option>
                }
            </select>
        </div>

        <ng-container footer>
            <button class="btn btn-light rounded-3" (click)="closeAssignVendorModal()">Cancelar</button>
            <button class="btn btn-primary rounded-3" [disabled]="vendorControl.invalid || saving()" (click)="saveVendorAssignment()">
                {{ saving() ? 'Asignando...' : 'Asignar Vendedor' }}
            </button>
        </ng-container>
    </app-modal>
    }

    <!-- TOGGLE ACTIVE MODAL -->
    @if (toggleActiveModalOpen()) {
    <app-modal [title]="selectedEmpresa()?.activo ? 'Desactivar Empresa' : 'Activar Empresa'" [size]="'sm'" (close)="closeToggleActiveModal()">
        <div class="text-center py-3">
            <div class="mb-3">
                <i class="bi" [class]="selectedEmpresa()?.activo ? 'bi-dash-circle text-danger display-1' : 'bi-check-circle text-success display-1'"></i>
            </div>
            <h5 class="fw-bold mb-2">{{ selectedEmpresa()?.activo ? '¿Desactivar Empresa?' : '¿Activar Empresa?' }}</h5>
            <p class="text-muted small px-4">
                @if (selectedEmpresa()?.activo) {
                    La empresa <strong>{{selectedEmpresa()?.nombre_comercial}}</strong> perderá acceso inmediato al sistema y sus usuarios no podrán ingresar.
                } @else {
                    La empresa <strong>{{selectedEmpresa()?.nombre_comercial}}</strong> recuperará el acceso al sistema inmediatamente.
                }
            </p>
        </div>
        <ng-container footer>
            <button class="btn btn-light rounded-3" (click)="closeToggleActiveModal()">Cancelar</button>
            <button class="btn rounded-3" 
                [ngClass]="selectedEmpresa()?.activo ? 'btn-danger' : 'btn-success'"
                [disabled]="saving()" 
                (click)="confirmToggleActive()">
                {{ saving() ? 'Procesando...' : (selectedEmpresa()?.activo ? 'Desactivar' : 'Activar') }}
            </button>
        </ng-container>
    </app-modal>
    }

    <!-- DELETE MODAL -->
    @if (deleteModalOpen()) {
    <app-modal [title]="'Eliminar Empresa'" [size]="'sm'" (close)="closeDeleteModal()">
        <div class="text-center py-3">
            <div class="mb-3">
                <i class="bi bi-trash-fill text-danger display-1"></i>
            </div>
            <p class="mb-1 fw-bold text-danger">¿Eliminar Definitivamente?</p>
            <p class="text-muted small">
                Esta acción eliminará la empresa <strong>{{selectedEmpresa()?.nombre_comercial}}</strong> y todos sus datos asociados.
                <br><strong>¡No se puede deshacer!</strong>
            </p>
        </div>
        <ng-container footer>
            <button class="btn btn-light rounded-3" (click)="closeDeleteModal()">Cancelar</button>
            <button class="btn btn-danger rounded-3" [disabled]="saving()" (click)="confirmDelete()">
                {{ saving() ? 'Eliminando...' : 'Eliminar' }}
            </button>
        </ng-container>
    </app-modal>
    }

    <!-- CHANGE PLAN MODAL -->
    @if (changePlanModalOpen()) {
    <app-modal [title]="'Cambiar Plan de Suscripción'" [size]="'md'" (close)="closeChangePlanModal()">
        <p class="text-muted small mb-4">Selecciona el nuevo plan para <strong>{{selectedEmpresa()?.nombre_comercial}}</strong>.</p>
        
        <div class="form-group mb-3">
            <label class="form-label small fw-bold text-secondary">Plan</label>
            <select class="form-select" [formControl]="planControl">
                <option value="" disabled>-- Selecciona un Plan --</option>
                @for (plan of planes(); track plan.id) {
                    <option [value]="plan.id">{{ plan.nombre }} - \${{ plan.precio_mensual }}/mes</option>
                }
            </select>
        </div>

        <ng-container footer>
            <button class="btn btn-light rounded-3" (click)="closeChangePlanModal()">Cancelar</button>
            <button class="btn btn-primary rounded-3" [disabled]="planControl.invalid || saving()" (click)="confirmChangePlan()">
                {{ saving() ? 'Cambiando Plan...' : 'Actualizar Plan' }}
            </button>
        </ng-container>
    </app-modal>
    }

    <!-- QUICK PAY MODAL -->
    @if (quickPayModalOpen()) {
    <app-modal [title]="'Registrar Pago de Suscripción'" [size]="'md'" (close)="closeQuickPayModal()">
        <div class="px-2">
            <p class="text-muted small mb-4">
                Registra un nuevo pago para <strong>{{selectedEmpresa()?.nombre_comercial}}</strong>. 
                Esto extenderá su suscripción automáticamente.
            </p>
            
            <div class="mb-3">
                <label class="form-label small fw-bold text-secondary text-uppercase">Seleccionar Plan</label>
                <select class="form-select border-2" [(ngModel)]="quickPayPlanId" style="border-radius: 10px;">
                    <option value="" disabled>-- Seleccione un Plan --</option>
                    @for (plan of planes(); track plan.id) {
                        <option [value]="plan.id">{{ plan.nombre }} - \${{ plan.precio_mensual }}</option>
                    }
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label small fw-bold text-secondary text-uppercase">Método de Pago</label>
                <select class="form-select border-2" [(ngModel)]="quickPayMethod" style="border-radius: 10px;">
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="DEPOSITO">Depósito</option>
                    <option value="OTRO">Otro</option>
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label small fw-bold text-secondary text-uppercase">Número de Comprobante (Opcional)</label>
                <input type="text" class="form-control border-2" [(ngModel)]="quickPayComprobante" 
                       placeholder="Nro de transferencia o recibo" style="border-radius: 10px;">
            </div>

            <hr class="my-4">

            <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" id="manualModeSwitch" [checked]="quickPayEsManual()" (change)="quickPayEsManual.set(!quickPayEsManual())">
                <label class="form-check-label fw-bold text-primary" for="manualModeSwitch">
                    <i class="bi bi-gear-fill me-1"></i> Modo Manual (Personalizar monto/fechas)
                </label>
            </div>

            @if (quickPayEsManual()) {
                <div class="row g-2 p-3 bg-light rounded-3 border mb-3">
                    <div class="col-12 mb-2">
                        <label class="form-label small fw-bold">Monto Personalizado</label>
                        <div class="input-group">
                            <span class="input-group-text">$</span>
                            <input type="number" class="form-control" [(ngModel)]="quickPayManualMonto" placeholder="Ej: 25.00">
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small fw-bold">Inicio Periodo</label>
                        <input type="date" class="form-control" [(ngModel)]="quickPayManualInicio">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small fw-bold">Fin Periodo</label>
                        <input type="date" class="form-control" [(ngModel)]="quickPayManualFin">
                    </div>
                </div>
            }
        </div>

        <ng-container footer>
            <button class="btn btn-light rounded-3 px-4" (click)="closeQuickPayModal()">Cancelar</button>
            <button class="btn btn-primary rounded-3 px-4 shadow-sm" [disabled]="!quickPayPlanId || saving()" (click)="confirmQuickPay()" style="background-color: #5a4bda; border: none;">
                {{ saving() ? 'Procesando...' : 'Confirmar y Registrar Pago' }}
            </button>
        </ng-container>
    </app-modal>
    }

    <!-- SUPPORT MODE MODAL -->
    @if (supportModalOpen()) {
    <app-modal [title]="'Acceso Modo Soporte'" [size]="'sm'" (close)="closeSupportModeModal()">
        <div class="text-center py-4">
            <div class="fs-1 mb-3">🛡️</div>
            <h4 class="fw-bold">Módulo en DESARROLLO</h4>
            <p class="text-muted px-3 small">
                La funcionalidad de acceso directo para soporte técnico está siendo implementada con altos estándares de seguridad y auditoría.
            </p>
            <div class="mt-4 p-3 bg-light rounded-4 border mx-3">
                <small class="text-primary fw-bold text-uppercase" style="font-size: 0.65rem;">Próximamente:</small><br>
                <small class="text-secondary" style="font-size: 0.75rem;">Control total de sesiones y registro de acciones por usuario.</small>
            </div>
        </div>
        <ng-container footer>
            <button class="btn btn-dark w-100 rounded-pill py-2" (click)="closeSupportModeModal()">Entendido</button>
        </ng-container>
    </app-modal>
    }

  `,
  styles: [`
    :host { display: block; }
    .table-responsive {
        overflow: visible !important;
        min-height: 500px; /* Ensure space for dropdowns */
    }
    @media (max-width: 991.98px) {
        .table-responsive {
            overflow-x: auto !important;
            padding-bottom: 60px; /* Space for dropdown on mobile */
        }
    }
    .dropdown-menu {
        z-index: 1050;
    }
    .table td { vertical-align: middle; padding: 1.25rem 0.5rem; }
    .table thead th { border: none; font-weight: 600; font-size: 0.75rem; color: #6c757d; }
    .hover-scale { transition: transform 0.2s; }
    .hover-scale:hover { transform: translateY(-5px); }
    .cursor-pointer { cursor: pointer; }
    .hover-dangers:hover { background-color: #fee2e2 !important; }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class EmpresasListComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private vendedorService = inject(VendedorService);
  private planService = inject(PlanService);
  private pagoSuscripcionService = inject(PagoSuscripcionService);
  private feedbackService = inject(FeedbackService);


  empresas = signal<Empresa[]>([]);
  vendedores = signal<Vendedor[]>([]);
  planes = signal<Plan[]>([]);
  selectedEmpresa = signal<Empresa | null>(null);

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);

  viewModalOpen = signal<boolean>(false);
  editModalOpen = signal<boolean>(false);
  createModalOpen = signal<boolean>(false);
  assignVendorModalOpen = signal<boolean>(false);
  toggleActiveModalOpen = signal<boolean>(false);
  changePlanModalOpen = signal<boolean>(false);
  quickPayModalOpen = signal<boolean>(false);
  supportModalOpen = signal<boolean>(false);
  actionsModalOpen = signal<boolean>(false);

  // Filter signals
  filtroBusqueda = signal<string>('');
  filtroEstado = signal<string>('');

  // Computed signal for filtered list
  empresasFiltradas = computed(() => {
    let list = this.empresas();

    // 1. Search filter (Name or RUC)
    if (this.filtroBusqueda()) {
      const search = this.filtroBusqueda().toLowerCase();
      list = list.filter(e =>
        e.nombre_comercial.toLowerCase().includes(search) ||
        e.razon_social.toLowerCase().includes(search) ||
        (e.ruc && e.ruc.includes(search))
      );
    }

    // 2. Vendor filter
    if (this.filterVendorControl.value) {
      list = list.filter(e => e.vendedor_id === this.filterVendorControl.value);
    }

    // 3. Status filter
    if (this.filtroEstado()) {
      if (this.filtroEstado() === 'VENCIDA') {
        list = list.filter(e => e.estado_suscripcion === 'VENCIDA');
      } else if (this.filtroEstado() === 'ACTIVE') {
        list = list.filter(e => e.activo);
      } else if (this.filtroEstado() === 'INACTIVE') {
        list = list.filter(e => !e.activo);
      }
    }

    return list;
  });

  totalActivas = computed(() => this.empresas().filter(e => e.activo).length);
  totalVencidas = computed(() => this.empresas().filter(e => e.estado_suscripcion === 'VENCIDA').length);

  // Quick Pay Form Data
  quickPayPlanId: string = '';
  quickPayMethod: string = 'TRANSFERENCIA';
  quickPayComprobante: string = '';
  quickPayEsManual = signal<boolean>(false);
  quickPayManualMonto: number | null = null;
  quickPayManualInicio: string = '';
  quickPayManualFin: string = '';


  vendorControl = new FormControl('');
  filterVendorControl = new FormControl('');
  planControl = new FormControl('', Validators.required);

  currentEditingId: string | null = null;

  constructor() {
    this.filterVendorControl.valueChanges.subscribe(val => {
      this.loadEmpresas(val || '');
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    // Load components in parallel
    this.vendedorService.getVendedores().subscribe({
      next: (data) => this.vendedores.set(data),
      error: (err) => console.error('Error al cargar vendedores', err)
    });

    this.planService.getPlanes().subscribe({
      next: (data) => this.planes.set(data),
      error: (err) => console.error('Error al cargar planes', err)
    });

    this.loadEmpresas();
  }

  loadEmpresas(vendedorId: string = '', force: boolean = false) {
    this.loading.set(true);
    const filterId = vendedorId || undefined;

    this.empresaService.getEmpresas(filterId, force).subscribe({
      next: (data) => {
        this.empresas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar empresas', err);
        this.loading.set(false);
        this.feedbackService.showError('Error al cargar la lista de empresas');
      }
    });
  }



  // Unsaved Changes Logic

  getVendedorNombre(id?: string): string {
    if (!id) return 'Superadmin';
    const v = this.vendedores().find(vend => vend.id === id);
    return v ? `${v.nombres} ${v.apellidos}` : 'Vendedor no encontrado';
  }






  onSearchEmpresa(event: any) {
    this.filtroBusqueda.set(event.target.value);
  }

  onStatusFilterChange(event: any) {
    this.filtroEstado.set(event.target.value);
  }

  resetFilters() {
    this.filtroBusqueda.set('');
    this.filtroEstado.set('');
    this.filterVendorControl.setValue('');
  }

  getSuscripcionBadgeClass(estado: string): string {
    switch (estado) {
      case 'ACTIVA': return 'bg-success bg-opacity-10 text-success';
      case 'SUSPENDIDA': return 'bg-danger bg-opacity-10 text-danger';
      case 'PRUEBA': return 'bg-info bg-opacity-10 text-info';
      case 'VENCIDA': return 'bg-danger bg-opacity-10 text-danger';
      case 'CANCELADA': return 'bg-secondary bg-opacity-10 text-secondary';
      default: return 'bg-light text-dark';
    }
  }


  // --- View Modal ---
  openViewModal(empresa: Empresa) {
    this.closeActionsModal(); // Close actions modal if open
    this.selectedEmpresa.set(empresa);
    this.viewModalOpen.set(true);
  }
  closeViewModal() {
    this.viewModalOpen.set(false);
    this.selectedEmpresa.set(null);
  }

  // --- ACTIONS ---

  openActionsModal(empresa: Empresa) {
    this.selectedEmpresa.set(empresa);
    this.actionsModalOpen.set(true);
  }

  closeActionsModal() {
    this.actionsModalOpen.set(false);
    this.selectedEmpresa.set(null);
  }

  // --- Create/Edit Modal Management ---

  openCreateModal() {
    this.createModalOpen.set(true);
  }

  openEditModal(empresa: Empresa) {
    this.closeViewModal();
    this.closeActionsModal();
    this.currentEditingId = empresa.id;
    this.selectedEmpresa.set(empresa);
    this.editModalOpen.set(true);
  }

  closeFormModal() {
    // Check if we need to confirm discard (logic moved to child component or handled here via event?)
    // For now, assuming child handles its own dirty check or we simply close.
    // Given the prompt structure, the child emits 'close', meaning "I am ready to close".
    // If we want dirty check, the child should handle it internally before emitting close, OR we pass a dirty flag out.
    // The previous implementation had 'unsavedChangesModalOpen'. 
    // Ideally, the child component should have the 'discard changes' modal or logic.
    // For simplicity in this refactor step, we'll trust the child emits close when safe.

    this.createModalOpen.set(false);
    this.editModalOpen.set(false);
    this.currentEditingId = null;
    this.selectedEmpresa.set(null);
  }

  onFormSubmit(formData: any) {
    this.saving.set(true);

    if (this.editModalOpen() && this.currentEditingId) {
      // Edit Mode
      const payload = { ...formData };
      if (!payload.vendedor_id) delete payload.vendedor_id; // Usually not needed for update unless we want to allow it here

      this.empresaService.updateEmpresa(this.currentEditingId, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.feedbackService.showSuccess('Empresa actualizada correctamente', () => {
            this.closeFormModal();
            this.loadEmpresas(this.filterVendorControl.value || '', true);
          });
        },
        error: (err) => {
          this.saving.set(false);
          this.feedbackService.showError('Error: ' + (err.error?.detail || 'Error desconocido'));
        }
      });
    } else {
      // Create Mode
      const payload = { ...formData };
      if (!payload.vendedor_id) delete payload.vendedor_id;

      this.empresaService.createEmpresa(payload).subscribe({
        next: (res) => {
          this.empresaService.clearCache();
          this.feedbackService.showSuccess('Empresa creada correctamente', () => {
            this.closeFormModal();
            this.loadEmpresas(this.filterVendorControl.value || '', true);
          });
        },
        error: (err) => {
          this.saving.set(false);
          this.feedbackService.showError('Error al crear empresa: ' + (err.error?.detail || 'Error desconocido'));
        }
      });
    }
  }

  // Legacy/Unused methods handled by child component or replaced above:
  // closeCreateModal, saveNewEmpresa, closeEditModal, saveEmpresa, confirmDiscardChanges


  // --- Assign Vendor Modal ---
  openAssignVendorModal(empresa: Empresa) {
    this.closeActionsModal();
    this.selectedEmpresa.set(empresa);
    this.vendorControl.setValue(empresa.vendedor_id || '');
    this.assignVendorModalOpen.set(true);
  }
  closeAssignVendorModal() {
    this.assignVendorModalOpen.set(false);
    this.selectedEmpresa.set(null);
    this.vendorControl.reset();
  }
  saveVendorAssignment() {
    if (this.vendorControl.invalid || !this.selectedEmpresa()) return;
    this.saving.set(true);
    const empresaId = this.selectedEmpresa()!.id;
    // Note: If empty string, send null to backend to unassign
    const vendedorId = this.vendorControl.value || null;

    this.empresaService.assignVendor(empresaId, vendedorId).subscribe({
      next: () => {
        this.saving.set(false);
        // INSTANT REFRESH
        this.closeAssignVendorModal();
        this.closeAssignVendorModal();
        this.loadEmpresas(this.filterVendorControl.value || '', true);

        this.feedbackService.showSuccess('Vendedor asignado correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        this.feedbackService.showError('Error: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }

  // --- Toggle Active Modal ---
  openToggleActiveModal(empresa: Empresa) {
    this.closeActionsModal();
    this.selectedEmpresa.set(empresa);
    this.toggleActiveModalOpen.set(true);
  }
  closeToggleActiveModal() {
    this.toggleActiveModalOpen.set(false);
    this.selectedEmpresa.set(null);
  }
  confirmToggleActive() {
    if (!this.selectedEmpresa()) return;
    this.saving.set(true);
    this.empresaService.toggleActive(this.selectedEmpresa()!.id).subscribe({
      next: () => {
        this.saving.set(false);
        const action = this.selectedEmpresa()!.activo ? 'desactivada' : 'activada';
        // INSTANT REFRESH
        this.closeToggleActiveModal();
        this.closeToggleActiveModal();
        this.loadEmpresas(this.filterVendorControl.value || '', true);

        this.feedbackService.showSuccess(`Empresa ${action} correctamente`);
      },
      error: (err) => {
        this.saving.set(false);
        this.feedbackService.showError('Error: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }

  // --- Delete Modal ---
  deleteModalOpen = signal<boolean>(false);

  openDeleteModal(empresa: Empresa) {
    this.closeActionsModal();
    this.selectedEmpresa.set(empresa);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.deleteModalOpen.set(false);
    this.selectedEmpresa.set(null);
  }

  confirmDelete() {
    if (!this.selectedEmpresa()) return;
    this.saving.set(true);

    this.empresaService.deleteEmpresa(this.selectedEmpresa()!.id).subscribe({
      next: () => {
        this.saving.set(false);
        // INSTANT REFRESH
        this.closeDeleteModal();
        this.closeDeleteModal();
        this.loadEmpresas(this.filterVendorControl.value || '', true);

        this.feedbackService.showSuccess('Empresa eliminada correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        this.feedbackService.showError('Error al eliminar: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }

  // --- Change Plan Modal ---
  openChangePlanModal(empresa: Empresa) {
    this.closeActionsModal();
    this.selectedEmpresa.set(empresa);
    this.planControl.setValue(empresa.plan_id || '');
    this.changePlanModalOpen.set(true);
  }

  closeChangePlanModal() {
    this.changePlanModalOpen.set(false);
    this.selectedEmpresa.set(null);
    this.planControl.reset();
  }

  confirmChangePlan() {
    if (this.planControl.invalid || !this.selectedEmpresa()) return;
    this.saving.set(true);

    const empresaId = this.selectedEmpresa()!.id;
    const planId = this.planControl.value!;

    this.empresaService.changePlan(empresaId, planId).subscribe({
      next: () => {
        this.saving.set(false);
        // INSTANT REFRESH
        this.closeChangePlanModal();
        this.closeChangePlanModal();
        this.loadEmpresas(this.filterVendorControl.value || '', true);

        this.feedbackService.showSuccess('Plan actualizado correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        this.feedbackService.showError('Error al actualizar plan: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }

  // --- Quick Pay Modal ---
  openQuickPayModal(empresa: Empresa) {
    this.closeActionsModal();
    this.selectedEmpresa.set(empresa);
    this.quickPayPlanId = empresa.plan_id || '';
    this.quickPayMethod = 'TRANSFERENCIA';
    this.quickPayComprobante = '';
    this.quickPayEsManual.set(false);
    this.quickPayManualMonto = null;
    this.quickPayManualInicio = '';
    this.quickPayManualFin = '';
    this.quickPayModalOpen.set(true);
  }

  closeQuickPayModal() {
    this.quickPayModalOpen.set(false);
    this.selectedEmpresa.set(null);
  }

  confirmQuickPay() {
    if (!this.selectedEmpresa() || !this.quickPayPlanId) return;

    this.saving.set(true);
    this.feedbackService.showLoading('Procesando pago...');

    const payload: any = {
      empresa_id: this.selectedEmpresa()!.id,
      plan_id: this.quickPayPlanId,
      metodo_pago: this.quickPayMethod,
      numero_comprobante: this.quickPayComprobante || undefined
    };

    if (this.quickPayEsManual()) {
      if (this.quickPayManualMonto !== null) payload.monto = this.quickPayManualMonto;
      if (this.quickPayManualInicio) payload.fecha_inicio_periodo = new Date(this.quickPayManualInicio).toISOString();
      if (this.quickPayManualFin) payload.fecha_fin_periodo = new Date(this.quickPayManualFin).toISOString();
    }

    this.pagoSuscripcionService.registrarPagoRapido(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.feedbackService.hideLoading();
        // INSTANT REFRESH
        this.closeQuickPayModal();
        this.closeQuickPayModal();
        this.loadEmpresas(this.filterVendorControl.value || '', true);

        this.feedbackService.showSuccess('Pago registrado correctamente. La suscripción ha sido extendida.');
      },
      error: (err) => {
        this.saving.set(false);
        this.feedbackService.hideLoading();
        this.feedbackService.showError('Error al registrar pago: ' + (err.error?.detail || err.message));
      }
    });
  }

  // --- Support Mode Modal ---
  openSupportModeModal() {
    this.closeActionsModal();
    this.supportModalOpen.set(true);
  }

  closeSupportModeModal() {
    this.supportModalOpen.set(false);
  }
}

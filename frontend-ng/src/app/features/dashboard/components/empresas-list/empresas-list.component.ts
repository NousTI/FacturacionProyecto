import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { EmpresaService, Empresa } from '../../../../core/services/empresa.service';
import { VendedorService, Vendedor } from '../../../../core/services/vendedor.service';
import { PlanService, Plan } from '../../../../core/services/plan.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-header bg-transparent border-0 py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="d-flex align-items-center gap-3">
            <h5 class="mb-0 fw-bold">Gestión de Empresas</h5>
            <!-- Vendor Filter -->
            <div class="d-flex align-items-center ms-3">
                <div class="input-group input-group-sm">
                    <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-funnel"></i></span>
                    <select class="form-select form-select-sm border-start-0 ps-0 text-dark fw-medium focus-ring-0" 
                            style="min-width: 200px; box-shadow: none; border-color: #dee2e6;"
                            [formControl]="filterVendorControl"
                            (change)="onFilterChange()">
                        <option value="" class="text-muted">Todas las Empresas</option>
                        @for (vendedor of vendedores(); track vendedor.id) {
                            <option [value]="vendedor.id" class="text-dark">{{ vendedor.nombres }} {{ vendedor.apellidos }}</option>
                        }
                    </select>
                </div>
            </div>
        </div>
        <button class="btn btn-primary btn-sm rounded-3 fw-bold" style="background-color: #5a4bda; border: none;" (click)="openCreateModal()">
          <i class="bi bi-plus-lg me-1"></i> Nueva Empresa
        </button>
      </div>
      
      <div class="table-responsive" style="min-height: 400px;">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light">
            <tr>
              <th class="border-0 text-secondary small fw-bold ps-4">EMPRESA</th>
              <th class="border-0 text-secondary small fw-bold">RUC</th>
              <th class="border-0 text-secondary small fw-bold">PLAN</th>
              <th class="border-0 text-secondary small fw-bold">ESTADO</th>
              <th class="border-0 text-secondary small fw-bold text-end pe-4">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
               <tr>
                 <td colspan="5" class="text-center py-4 text-muted">
                    <div class="spinner-border text-primary spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    Cargando empresas...
                 </td>
               </tr>
            } @else if (empresas().length === 0) {
               <tr>
                 <td colspan="5" class="text-center py-4 text-muted">No se encontraron empresas.</td>
               </tr>
            } @else {
                @for (empresa of empresas(); track empresa.id) {
                <tr style="cursor: pointer;" (click)="openViewModal(empresa)">
                    <td class="ps-4">
                    <div class="d-flex align-items-center">
                        <div class="avatar bg-light text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                           @if(empresa.logo_url) {
                              <img [src]="empresa.logo_url" class="rounded-circle w-100 h-100 object-fit-cover" alt="Logo">
                           } @else {
                              <i class="bi bi-building"></i>
                           }
                        </div>
                        <div>
                        <div class="fw-bold text-dark">{{ empresa.nombre_comercial }}</div>
                        <div class="small text-muted">{{ empresa.razon_social }}</div>
                        </div>
                    </div>
                    </td>
                    <td class="text-secondary">{{ empresa.ruc }}</td>
                     <td>
                      <span class="badge bg-info bg-opacity-10 text-info fw-normal px-3 py-2 rounded-pill">
                        {{ empresa.plan || 'N/A' }}
                      </span>
                    </td>
                    <td>
                    <span class="badge rounded-pill px-3 py-2 fw-normal" 
                        [ngClass]="empresa.activo ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'">
                        {{ empresa.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                    </td>
                    <td class="text-end pe-4" (click)="$event.stopPropagation()">
                         <div class="d-flex justify-content-end gap-2">
                             <!-- View -->
                             <button class="btn btn-light btn-sm rounded-circle" title="Ver Detalles" (click)="openViewModal(empresa)">
                                <i class="bi bi-eye text-info"></i>
                             </button>
                             <!-- Edit -->
                             <button class="btn btn-light btn-sm rounded-circle" title="Editar" (click)="openEditModal(empresa)">
                                <i class="bi bi-pencil-fill text-secondary"></i>
                             </button>
                             <!-- Assign Vendor -->
                             <button class="btn btn-light btn-sm rounded-circle" title="Asignar Vendedor" (click)="openAssignVendorModal(empresa)">
                                <i class="bi bi-person-badge text-primary"></i>
                             </button>
                             <!-- Toggle Active -->
                             <button class="btn btn-light btn-sm rounded-circle" [title]="empresa.activo ? 'Desactivar' : 'Activar'" (click)="openToggleActiveModal(empresa)">
                                <i class="bi" [ngClass]="empresa.activo ? 'bi-toggle-on text-success' : 'bi-toggle-off text-danger'"></i>
                             </button>
                             <!-- Change Plan -->
                             <button class="btn btn-light btn-sm rounded-circle" title="Cambiar Plan" (click)="openChangePlanModal(empresa)">
                                <i class="bi bi-card-list text-warning"></i>
                             </button>
                             <!-- Delete -->
                             <button class="btn btn-light btn-sm rounded-circle" title="Eliminar" (click)="openDeleteModal(empresa)">
                                <i class="bi bi-trash text-danger"></i>
                             </button>
                         </div>
                    </td>
                </tr>
                }
            }
          </tbody>
        </table>
      </div>
      
      <div class="card-footer bg-transparent border-0 py-3 text-end text-muted small">
        Mostrando {{ empresas().length }} empresas
      </div>
    </div>

    <!-- VIEW DETAILS MODAL -->
    @if (viewModalOpen()) {
    <app-modal [title]="'Detalles de la Empresa'" [size]="'lg'" (close)="closeViewModal()">
        <div class="row g-4">
            <!-- Header Info -->
            <div class="col-12 d-flex align-items-center">
                <div class="avatar bg-light text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 60px; height: 60px; font-size: 1.5rem;">
                    @if(selectedEmpresa()!.logo_url) {
                        <img [src]="selectedEmpresa()!.logo_url" class="rounded-circle w-100 h-100 object-fit-cover" alt="Logo">
                    } @else {
                        <i class="bi bi-building"></i>
                    }
                </div>
                <div>
                    <h4 class="mb-0 fw-bold">{{ selectedEmpresa()!.nombre_comercial }}</h4>
                    <p class="text-muted mb-0 small">{{ selectedEmpresa()!.razon_social }}</p>
                </div>
                <div class="ms-auto">
                        <span class="badge rounded-pill px-3 py-2 fw-normal" 
                        [ngClass]="selectedEmpresa()!.activo ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'">
                        {{ selectedEmpresa()!.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                </div>
            </div>

            <hr class="text-muted opacity-25 mt-0 mb-4">

            <!-- Section: Legal -->
            <div class="col-12 mt-0">
                <h6 class="text-primary fw-bold small text-uppercase mb-3 letter-spacing-1">
                    <i class="bi bi-bank me-2"></i>Información Legal
                </h6>
            </div>
            <div class="col-md-4">
                <label class="small text-secondary fw-bold text-uppercase mb-1">RUC</label>
                <p class="mb-0 fw-medium text-dark">{{ selectedEmpresa()!.ruc }}</p>
            </div>
            <div class="col-md-4">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Tipo Contribuyente</label>
                <p class="mb-0 text-dark">{{ selectedEmpresa()!.tipo_contribuyente || 'N/A' }}</p>
            </div>
                <div class="col-md-4">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Obligado a Llevar Contabilidad</label>
                <p class="mb-0 text-dark">{{ selectedEmpresa()!.obligado_contabilidad ? 'SI' : 'NO' }}</p>
            </div>

            <div class="col-12">
                <hr class="text-muted opacity-10 my-1">
            </div>

            <!-- Section: Contact -->
                <div class="col-12">
                <h6 class="text-primary fw-bold small text-uppercase mb-3 mt-2 letter-spacing-1">
                    <i class="bi bi-geo-alt me-2"></i>Contacto y Ubicación
                </h6>
            </div>
                <div class="col-md-6">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Correo Electrónico</label>
                <p class="mb-0 text-dark">{{ selectedEmpresa()!.email || 'N/A' }}</p>
            </div>
                <div class="col-md-6">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Teléfono</label>
                <p class="mb-0 text-dark">{{ selectedEmpresa()!.telefono || 'N/A' }}</p>
            </div>
                <div class="col-12">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Dirección</label>
                <p class="mb-0 text-dark">{{ selectedEmpresa()!.direccion || 'N/A' }}</p>
            </div>

            <div class="col-12">
                <hr class="text-muted opacity-10 my-1">
            </div>

            <!-- Section: System & Dates -->
                <div class="col-12">
                <h6 class="text-primary fw-bold small text-uppercase mb-3 mt-2 letter-spacing-1">
                    <i class="bi bi-calendar3 me-2"></i>Suscripción y Sistema
                </h6>
            </div>
            <div class="col-md-6 mb-2">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Estado de Suscripción</label>
                <div>
                    <span class="badge bg-info bg-opacity-10 text-info fw-normal px-3 py-2">{{ selectedEmpresa()!.estado_suscripcion }}</span>
                </div>
            </div>

            <div class="col-md-6 mb-2">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Plan Actual</label>
                <div>
                    <span class="badge bg-primary bg-opacity-10 text-primary fw-normal px-3 py-2">{{ selectedEmpresa()!.plan || 'Sin Plan' }}</span>
                </div>
            </div>
             
             <!-- Vendor Info (Added) -->
             @if (selectedEmpresa()!.vendedor_id) {
             <div class="col-md-12 mb-2">
                 <label class="small text-secondary fw-bold text-uppercase mb-1">Vendedor Asignado (ID)</label>
                 <p class="mb-0 text-muted small">{{ selectedEmpresa()!.vendedor_id }}</p>
             </div>
             }

            <div class="col-md-3">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Inicio Plan</label>
                <p class="mb-0 small text-muted">{{ selectedEmpresa()!.fecha_inicio_plan ? (selectedEmpresa()!.fecha_inicio_plan | date:'shortDate') : '-' }}</p>
            </div>
            <div class="col-md-3">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Fin Plan</label>
                <p class="mb-0 small fw-bold" [class.text-danger]="selectedEmpresa()!.fecha_fin_plan">
                    {{ selectedEmpresa()!.fecha_fin_plan ? (selectedEmpresa()!.fecha_fin_plan | date:'shortDate') : '-' }}
                </p>
            </div>
            <div class="col-md-3">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Registro Empresa</label>
                <p class="mb-0 small text-muted">{{ selectedEmpresa()!.fecha_registro | date:'shortDate' }}</p>
            </div>
            <div class="col-md-3">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Actualizado</label>
                    <p class="mb-0 small text-muted">{{ selectedEmpresa()!.updated_at ? (selectedEmpresa()!.updated_at | date:'shortDate') : '-' }}</p>
            </div>
        </div>

        <ng-container footer>
            <button class="btn btn-secondary rounded-3" (click)="closeViewModal()">Cerrar</button>
            <button class="btn btn-primary rounded-3" (click)="openEditModal(selectedEmpresa()!)">
            <i class="bi bi-pencil-fill me-2"></i>Editar
            </button>
        </ng-container>
    </app-modal>
    }

    <!-- CREATE MODAL -->
    @if (createModalOpen()) {
    <app-modal [title]="'Nueva Empresa'" [size]="'lg'" (close)="closeCreateModal()">
        <form [formGroup]="editForm">
            <div class="row g-3">
                <!-- Identity -->
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">RUC <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" formControlName="ruc" placeholder="1234567890001">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Razón Social <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" formControlName="razon_social" placeholder="Nombre Legal">
                </div>
                <div class="col-md-12">
                    <label class="form-label small fw-bold text-secondary">Nombre Comercial</label>
                    <input type="text" class="form-control" formControlName="nombre_comercial" placeholder="Nombre de Marca">
                </div>
                <!-- Vendor Assignment (Optional) -->
                <div class="col-md-12">
                    <label class="form-label small fw-bold text-secondary">Vendedor Asignado</label>
                    <select class="form-select" formControlName="vendedor_id">
                         <option value="">-- Sin Asignar (Superadmin) --</option>
                         @for (vendedor of vendedores(); track vendedor.id) {
                            <option [value]="vendedor.id">{{ vendedor.nombres }} {{ vendedor.apellidos }}</option>
                        }
                    </select>
                </div>

                <!-- Contact -->
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Correo Electrónico <span class="text-danger">*</span></label>
                    <input type="email" class="form-control" formControlName="email" placeholder="empresa@ejemplo.com">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Teléfono</label>
                    <input type="text" class="form-control" formControlName="telefono" placeholder="0991234567">
                </div>
                <div class="col-12">
                    <label class="form-label small fw-bold text-secondary">Dirección</label>
                    <input type="text" class="form-control" formControlName="direccion" placeholder="Av. Principal 123">
                </div>
                
                <!-- Tax Info -->
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Tipo Contribuyente</label>
                    <select class="form-select" formControlName="tipo_contribuyente">
                        <option value="Persona Natural">Persona Natural</option>
                        <option value="Sociedad">Sociedad</option>
                        <option value="Contribuyente Especial">Contribuyente Especial</option>
                    </select>
                </div>
                <div class="col-md-6 d-flex align-items-end">
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="obligadoContabilidadNew" formControlName="obligado_contabilidad">
                        <label class="form-check-label" for="obligadoContabilidadNew">
                            Obligado a Llevar Contabilidad
                        </label>
                    </div>
                </div>
            </div>
        </form>

        <ng-container footer>
            <button class="btn btn-light rounded-3" (click)="closeCreateModal()">Cancelar</button>
            <button class="btn btn-success rounded-3 px-4" 
                [disabled]="editForm.invalid || saving()"
                (click)="saveNewEmpresa()">
                @if (saving()) {
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creando...
                } @else {
                    <i class="bi bi-check-lg me-1"></i> Crear Empresa
                }
            </button>
        </ng-container>
    </app-modal>
    }

    <!-- EDIT MODAL -->
    @if (editModalOpen()) {
    <app-modal [title]="'Editar Empresa'" [size]="'lg'" (close)="closeEditModal()">
        <form [formGroup]="editForm">
            <div class="row g-3">
                <!-- Identity -->
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">RUC</label>
                    <input type="text" class="form-control" formControlName="ruc">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Razón Social</label>
                    <input type="text" class="form-control" formControlName="razon_social">
                </div>
                <div class="col-md-12">
                    <label class="form-label small fw-bold text-secondary">Nombre Comercial</label>
                    <input type="text" class="form-control" formControlName="nombre_comercial">
                </div>
                <div class="col-md-12">
                    <label class="form-label small fw-bold text-secondary">URL del Logo</label>
                    <input type="text" class="form-control" formControlName="logo_url" placeholder="https://ejemplo.com/logo.png">
                </div>

                <!-- Contact -->
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Correo Electrónico</label>
                    <input type="email" class="form-control" formControlName="email">
                </div>
                    <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Teléfono</label>
                    <input type="text" class="form-control" formControlName="telefono">
                </div>
                <div class="col-12">
                    <label class="form-label small fw-bold text-secondary">Dirección</label>
                    <input type="text" class="form-control" formControlName="direccion">
                </div>
                
                <!-- Tax Info -->
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Tipo Contribuyente</label>
                    <select class="form-select" formControlName="tipo_contribuyente">
                        <option value="Persona Natural">Persona Natural</option>
                        <option value="Sociedad">Sociedad</option>
                        <option value="Contribuyente Especial">Contribuyente Especial</option>
                    </select>
                </div>
                <div class="col-md-6 d-flex align-items-end">
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="obligadoContabilidad" formControlName="obligado_contabilidad">
                        <label class="form-check-label" for="obligadoContabilidad">
                            Obligado a Llevar Contabilidad
                        </label>
                    </div>
                </div>
            </div>
        </form>

        <ng-container footer>
            <button class="btn btn-light rounded-3" (click)="closeEditModal()">Cancelar</button>
            <button class="btn btn-primary rounded-3 px-4" 
                [disabled]="editForm.invalid || !editForm.dirty || saving()"
                (click)="saveEmpresa()">
                @if (saving()) {
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Guardando...
                } @else {
                    Guardar Cambios
                }
            </button>
        </ng-container>
    </app-modal>
    }

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
                <i class="bi" [class]="selectedEmpresa()?.activo ? 'bi-exclamation-circle text-warning display-1' : 'bi-check-circle text-success display-1'"></i>
            </div>
            <p class="mb-1 fw-bold">¿Estás seguro?</p>
            <p class="text-muted small">
                La empresa <strong>{{selectedEmpresa()?.nombre_comercial}}</strong> será 
                {{ selectedEmpresa()?.activo ? 'desactivada y perderá acceso al sistema' : 'activada y podrá acceder al sistema' }}.
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
  `
})
export class EmpresasListComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private vendedorService = inject(VendedorService);
  private planService = inject(PlanService);
  private fb = inject(FormBuilder);

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

  editForm: FormGroup;
  vendorControl = this.fb.control(''); // Removed required validator to allow unassignment (empty value)
  filterVendorControl = this.fb.control('');
  planControl = this.fb.control('', Validators.required);

  currentEditingId: string | null = null;

  constructor() {
    this.editForm = this.fb.group({
      ruc: ['', Validators.required],
      razon_social: ['', Validators.required],
      nombre_comercial: ['', Validators.required],
      logo_url: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      direccion: [''],
      tipo_contribuyente: [''],
      obligado_contabilidad: [false],
      vendedor_id: [''] // Added for creation
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

  loadEmpresas(vendedorId: string = '') {
    this.loading.set(true);
    const filterId = vendedorId || undefined;

    this.empresaService.getEmpresas(filterId).subscribe({
      next: (data) => {
        this.empresas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar empresas', err);
        this.loading.set(false);
      }
    });
  }

  onFilterChange() {
    const selectedId = this.filterVendorControl.value!;
    this.loadEmpresas(selectedId);
  }

  // --- View Modal ---
  openViewModal(empresa: Empresa) {
    this.selectedEmpresa.set(empresa);
    this.viewModalOpen.set(true);
  }
  closeViewModal() {
    this.viewModalOpen.set(false);
    this.selectedEmpresa.set(null);
  }

  // --- Create Modal ---
  openCreateModal() {
    this.editForm.reset();
    this.editForm.patchValue({
      tipo_contribuyente: 'Persona Natural',
      obligado_contabilidad: false
    });
    this.createModalOpen.set(true);
  }

  closeCreateModal() {
    this.createModalOpen.set(false);
    this.editForm.reset();
  }

  saveNewEmpresa() {
    if (this.editForm.invalid) {
      console.error('Formulario Inválido:', this.editForm.errors, this.editForm);
      // Log individual control errors
      Object.keys(this.editForm.controls).forEach(key => {
        const controlErrors = this.editForm.get(key)?.errors;
        if (controlErrors) {
          console.error(`Error en ${key}:`, controlErrors);
        }
      });
      alert('Por favor complete los campos obligatorios marcados en rojo.');
      return;
    }
    this.saving.set(true);

    const payload = this.editForm.value;
    console.log('Enviando payload crear empresa:', payload); // DEBUG

    if (!payload.vendedor_id) delete payload.vendedor_id;

    this.empresaService.createEmpresa(payload).subscribe({
      next: (res) => {
        console.log('Respuesta creación:', res); // DEBUG
        this.saving.set(false);
        this.closeCreateModal();
        this.loadEmpresas(this.filterVendorControl.value || '');
        alert('Empresa creada correctamente');
      },
      error: (err) => {
        console.error('Error API crear empresa:', err); // DEBUG
        this.saving.set(false);
        alert('Error al crear empresa: ' + (err.error?.detail || JSON.stringify(err.error) || 'Error desconocido'));
      }
    });
  }

  // --- Edit Modal ---
  openEditModal(empresa: Empresa) {
    this.closeViewModal(); // If opened from view
    this.currentEditingId = empresa.id;
    this.editForm.patchValue({
      ruc: empresa.ruc,
      razon_social: empresa.razon_social,
      nombre_comercial: empresa.nombre_comercial,
      logo_url: empresa.logo_url,
      email: empresa.email,
      telefono: empresa.telefono,
      direccion: empresa.direccion,
      tipo_contribuyente: empresa.tipo_contribuyente,
      obligado_contabilidad: empresa.obligado_contabilidad,
      vendedor_id: empresa.vendedor_id // Just in case, though usually not editable here
    });
    this.editForm.markAsPristine();
    this.editModalOpen.set(true);
  }
  closeEditModal() {
    this.editModalOpen.set(false);
    this.currentEditingId = null;
    this.editForm.reset();
  }
  saveEmpresa() {
    if (this.editForm.invalid || !this.currentEditingId) return;
    this.saving.set(true);
    // Sanitize payload: don't send vendedor_id if not intended to change in edit
    const payload = { ...this.editForm.value };
    delete payload.vendedor_id;

    this.empresaService.updateEmpresa(this.currentEditingId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeEditModal();
        this.loadEmpresas(this.filterVendorControl.value || '');
        alert('Empresa actualizada correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        alert('Error: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }

  // --- Assign Vendor Modal ---
  openAssignVendorModal(empresa: Empresa) {
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
        this.closeAssignVendorModal();
        this.loadEmpresas(this.filterVendorControl.value || '');
        alert('Vendedor asignado correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        alert('Error: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }

  // --- Toggle Active Modal ---
  openToggleActiveModal(empresa: Empresa) {
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
        this.closeToggleActiveModal();
        this.loadEmpresas(this.filterVendorControl.value || '');
      },
      error: (err) => {
        this.saving.set(false);
        alert('Error: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }

  // --- Delete Modal ---
  deleteModalOpen = signal<boolean>(false);

  openDeleteModal(empresa: Empresa) {
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
        this.closeDeleteModal();
        this.loadEmpresas(this.filterVendorControl.value || '');
        alert('Empresa eliminada correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        alert('Error al eliminar: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }

  // --- Change Plan Modal ---
  openChangePlanModal(empresa: Empresa) {
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
        this.closeChangePlanModal();
        this.loadEmpresas(this.filterVendorControl.value || '');
        alert('Plan actualizado correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        alert('Error al actualizar plan: ' + (err.error?.detail || 'Error desconocido'));
      }
    });
  }
}

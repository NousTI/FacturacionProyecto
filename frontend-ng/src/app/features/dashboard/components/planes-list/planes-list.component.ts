import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { PlanService, Plan, PlanCreate, PlanUpdate } from '../../../../core/services/plan.service';
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { ModuloService, Modulo } from '../../../../core/services/modulo.service';
import { EmpresaService, Empresa } from '../../../../core/services/empresa.service';

@Component({
    selector: 'app-planes-list',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent, DragDropModule, ConfirmModalComponent],
    template: `
    <div class="planes-content">
      <div class="d-flex justify-content-end mb-4" header-actions>
        <button class="btn btn-dark rounded-pill px-4 fw-bold shadow-sm" (click)="openCreateModal()">
          <i class="bi bi-plus-lg me-2"></i> Nuevo Plan
        </button>
      </div>

      <div class="row g-4" cdkDropList cdkDropListOrientation="mixed" [cdkDropListSortingDisabled]="true" (cdkDropListDropped)="onDrop($event)">
        @for (plan of planes(); track plan.id) {
          <div class="col-md-6 col-lg-4 col-xl-3 plan-drag-item" 
               cdkDrag
               [cdkDragData]="plan">
            
            <div class="col-md-6 col-lg-4 col-xl-3 plan-drag-item" *cdkDragPlaceholder>
                <div class="card border-0 bg-light opacity-50 shadow-none" style="border-radius: 20px; height: 280px;"></div>
            </div>

            <div class="card border-0 shadow-sm h-100 position-relative overflow-hidden plan-card" 
                 [class.border-start-primary]="plan.activo"
                 [class.opacity-75]="!plan.activo"
                 [ngStyle]="{'border-left': plan.activo ? '5px solid #000' : '5px solid #ccc'}">
              
              <div class="card-body p-4 d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="badge rounded-pill border" 
                         [ngClass]="plan.activo ? 'bg-dark text-white' : 'bg-light text-muted'">
                        {{ plan.activo ? 'ACTIVO' : 'INACTIVO' }}
                    </div>
                    <!-- Dropdown for actions -->
                    <div class="dropdown position-relative" style="z-index: 10;"> 
                        <button class="btn btn-sm btn-white rounded-circle border shadow-sm" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-4 overflow-hidden">
                            <li><button class="dropdown-item py-2" (click)="openEditModal(plan)"><i class="bi bi-pencil me-2 text-primary"></i> Editar</button></li>
                            <li><button class="dropdown-item py-2" (click)="viewCompanies(plan)"><i class="bi bi-building me-2 text-secondary"></i> Ver Empresas</button></li>
                            <li><button class="dropdown-item py-2" (click)="toggleActivo(plan)">
                                <i class="bi me-2" [ngClass]="plan.activo ? 'bi-toggle-off text-muted' : 'bi-toggle-on text-success'"></i>
                                {{ plan.activo ? 'Desactivar' : 'Activar' }}
                            </button></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><button class="dropdown-item py-2 text-danger" (click)="deletePlan(plan)"><i class="bi bi-trash me-2"></i> Eliminar</button></li>
                        </ul>
                    </div>
                </div>

                <!-- Handle (optional, but card itself is draggable now per user request) -->
                <div class="drag-handle position-absolute w-100 h-100 start-0 top-0" style="z-index: 1; cursor: grab;" cdkDragHandle></div>

                <div class="position-relative" style="z-index: 2; pointer-events: none;"> <!-- Content non-interactable for drag but visible -->
                    <h4 class="fw-bold mb-1">{{ plan.nombre }}</h4>
                    <div class="text-secondary small text-uppercase mb-3">{{ plan.codigo }}</div>
                    
                    <div class="mb-4">
                        <span class="h2 fw-bold text-dark">$ {{ plan.precio_mensual }}</span>
                        <span class="text-muted small"> / mes</span>
                    </div>

                    <div class="d-flex flex-column gap-2 mb-4 flex-grow-1">
                        <div class="d-flex align-items-center small text-muted">
                            <i class="bi bi-people-fill me-2 opacity-50"></i>
                            <span class="fw-bold text-dark me-1">{{ plan.max_usuarios === 0 ? 'Ilimitados' : plan.max_usuarios }}</span> Usuarios
                        </div>
                        <div class="d-flex align-items-center small text-muted">
                            <i class="bi bi-receipt me-2 opacity-50"></i>
                            <span class="fw-bold text-dark me-1">{{ plan.max_facturas_mes === 0 ? 'Ilimitadas' : plan.max_facturas_mes }}</span> Facturas/mo
                        </div>
                        <div class="d-flex align-items-center small text-muted">
                            <i class="bi bi-shop me-2 opacity-50"></i>
                            <span class="fw-bold text-dark me-1">{{ plan.max_establecimientos === 0 ? 'Ilimitados' : plan.max_establecimientos }}</span> Locales
                        </div>
                    </div>
                     <!-- Features List -->
                    @if (plan.caracteristicas?.length) {
                        <ul class="list-unstyled mb-4">
                            @for (feature of plan.caracteristicas; track feature) {
                                <li class="mb-2 small d-flex align-items-start">
                                    <i class="bi bi-check-circle-fill text-success me-2 flex-shrink-0 mt-1"></i>
                                    <div>
                                        <div class="text-dark fw-bold" style="font-size: 0.9em;">{{ feature.nombre }}</div>
                                        <div class="text-secondary small">{{ feature.descripcion }}</div>
                                    </div>
                                </li>
                            }
                        </ul>
                    }
                </div>

                <div class="pt-3 border-top mt-auto position-relative" style="z-index: 2;">
                     <!-- Footer content if any -->
                </div>
              </div>
            </div>
          </div>
        }
        @if (planes().length === 0) {
            <div class="col-12 text-center py-5">
                <div class="text-muted opacity-50 mb-3 display-1"><i class="bi bi-box-seam"></i></div>
                <h4 class="text-secondary">No hay planes definidos</h4>
                <p class="text-muted">Crea el primer plan para comenzar.</p>
            </div>
        }
      </div>
    </div>

    <!-- MODAL FORM -->
    @if (formModalOpen()) {
    <app-modal [title]="selectedPlan() ? 'Editar Plan' : 'Nuevo Plan'" [size]="'lg'" (close)="requestCloseModal()">
        <form [formGroup]="planForm" (ngSubmit)="savePlan()" class="px-2">
            
            <div class="row g-3">
                <!-- Basic Info -->
                <div class="col-md-8">
                    <label class="form-label small fw-bold text-uppercase text-secondary">Nombre del Plan</label>
                    <input type="text" class="form-control border-2" formControlName="nombre" placeholder="Ej. Emprendedor" style="border-radius: 10px;">
                </div>
                <div class="col-md-4">
                    <label class="form-label small fw-bold text-uppercase text-secondary">Código</label>
                    <input type="text" class="form-control border-2" formControlName="codigo" placeholder="EJ. PLAN_BASIC" style="border-radius: 10px;">
                </div>
                
                <div class="col-12">
                    <label class="form-label small fw-bold text-uppercase text-secondary">Descripción</label>
                    <textarea class="form-control border-2" formControlName="descripcion" rows="2" style="border-radius: 10px;"></textarea>
                </div>

                <div class="col-md-6">
                    <label class="form-label small fw-bold text-uppercase text-primary">Precio Mensual ($)</label>
                    <div class="input-group">
                        <span class="input-group-text border-2 bg-light border-end-0" style="border-radius: 10px 0 0 10px;">$</span>
                        <input type="number" class="form-control border-2 border-start-0" formControlName="precio_mensual" step="0.01" style="border-radius: 0 10px 10px 0;">
                    </div>
                </div>
                 <div class="col-md-6">
                    <label class="form-label small fw-bold text-uppercase text-secondary">Orden Visual</label>
                    <input type="number" class="form-control border-2" formControlName="orden" style="border-radius: 10px;">
                </div>

                <hr class="my-4">
                <h6 class="fw-bold text-dark mb-3"><i class="bi bi-sliders me-2"></i>Límites y Reglas</h6>

                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Máx. Usuarios</label>
                    <input type="number" class="form-control border-2" formControlName="max_usuarios" placeholder="0 = Ilimitado" style="border-radius: 10px;">
                    <div class="form-text small">0 para ilimitados</div>
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Máx. Facturas / Mes</label>
                    <input type="number" class="form-control border-2" formControlName="max_facturas_mes" placeholder="0 = Ilimitadas" style="border-radius: 10px;">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Máx. Establecimientos</label>
                    <input type="number" class="form-control border-2" formControlName="max_establecimientos" placeholder="0 = Ilimitados" style="border-radius: 10px;">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Máx. Programaciones</label>
                    <input type="number" class="form-control border-2" formControlName="max_programaciones" placeholder="0 = Ilimitadas" style="border-radius: 10px;">
                </div>

                 <hr class="my-4">
                <div class="d-flex border-bottom mb-4">
                    <button type="button" class="btn btn-link link-dark text-decoration-none px-4 py-2 border-bottom border-3" 
                            [class.border-dark]="activeEditTab() === 'features'"
                            [class.border-transparent]="activeEditTab() === 'features'"
                            (click)="activeEditTab.set('features')">
                        <i class="bi bi-star me-2"></i>Características
                    </button>
                    <button type="button" class="btn btn-link link-dark text-decoration-none px-4 py-2 border-bottom border-3"
                            [class.border-dark]="activeEditTab() === 'modules'"
                            (click)="activeEditTab.set('modules')">
                        <i class="bi bi-cpu me-2"></i>Módulos Técnicos
                    </button>
                </div>

                @if (activeEditTab() === 'features') {
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="fw-bold text-dark mb-0">Listado de Características</h6>
                        <button type="button" class="btn btn-sm btn-outline-primary rounded-pill" (click)="addCaracteristica()">
                            <i class="bi bi-plus text-lg"></i> Agregar
                        </button>
                    </div>
                }

                <div class="col-12" [ngClass]="{'d-none': activeEditTab() !== 'features'}" formArrayName="caracteristicas">
                    @for (ctrl of caracteristicasArray.controls; track $index) {
                        <div class="mb-2" [formGroupName]="$index">
                            <div class="input-group">
                                <span class="input-group-text bg-white border-end-0 text-success"><i class="bi bi-check-lg"></i></span>
                                <input formControlName="nombre" type="text" class="form-control border-start-0" placeholder="Nombre (Ej. Soporte)">
                                <input formControlName="descripcion" type="text" class="form-control" placeholder="Descripción (Ej. 24/7)">
                                <button type="button" class="btn btn-outline-danger" (click)="removeCaracteristica($index)">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    }
                    @if (caracteristicasArray.length === 0) {
                        <div class="text-center p-3 bg-light rounded-3 text-muted small border border-dashed">
                            No hay características agregadas
                        </div>
                    }
                </div>

                <!-- Modules Selection -->
                @if (activeEditTab() === 'modules') {
                    <div class="col-12">
                        <p class="small text-muted mb-4">Selecciona los módulos integrados que estarán disponibles por defecto para las empresas que contraten este plan.</p>
                        <div class="row g-3">
                            @for (modulo of allModulos(); track modulo.id) {
                                <div class="col-md-6">
                                    <div class="card border border-light p-3 h-100 flex-row align-items-center bg-light-hover">
                                        <div class="form-check form-switch mb-0">
                                            <input class="form-check-input" type="checkbox" 
                                                   [checked]="isModuloIncluido(modulo.id)"
                                                   (change)="togglePlanModulo(modulo, $event)">
                                        </div>
                                        <div class="ms-3">
                                            <div class="fw-bold small">{{ modulo.nombre }}</div>
                                            <div class="text-muted" style="font-size: 0.75rem;">{{ modulo.codigo }}</div>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                }

                <hr class="my-4">
                
                <div class="col-12">
                    <div class="d-flex gap-4">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" formControlName="visible_publico">
                            <label class="form-check-label ps-2">Visible al Público</label>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" formControlName="activo">
                            <label class="form-check-label ps-2 fw-bold">Plan Activo</label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-5 d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light rounded-3 px-4" (click)="requestCloseModal()">Cancelar</button>
                <button type="submit" class="btn btn-dark rounded-3 px-4 shadow-sm" [disabled]="planForm.invalid || saving() || !planForm.dirty">
                    {{ saving() ? 'Guardando...' : (selectedPlan() ? 'Actualizar Plan' : 'Crear Plan') }}
                </button>
            </div>
        </form>
    </app-modal>
    }

    <!-- CONFIRMATION MODAL -->
    @if (showConfirmModal()) {
        <app-confirm-modal
            [title]="confirmConfig().title"
            [message]="confirmConfig().message"
            [confirmText]="confirmConfig().confirmText"
            [cancelText]="confirmConfig().cancelText"
            [type]="confirmConfig().type"
            (confirm)="confirmAction()"
            (cancel)="showConfirmModal.set(false)"
        ></app-confirm-modal>
    }

    <!-- COMPANIES MODAL -->
    @if (companiesModalOpen()) {
    <app-modal [title]="'Empresas en Plan: ' + selectedPlan()?.nombre" [size]="'lg'" (close)="companiesModalOpen.set(false)">
        <div class="p-2">
            <div class="d-flex justify-content-between align-items-center mb-4 px-1">
                <h6 class="fw-bold mb-0 text-secondary">Empresas con suscripción activa</h6>
                <button class="btn btn-sm btn-dark rounded-pill px-3" (click)="openAssignModal()">
                    <i class="bi bi-plus-lg me-1"></i> Asignar Empresa
                </button>
            </div>

            @if (loadingCompanies()) {
                <div class="text-center py-5">
                    <div class="spinner-border text-dark" role="status"></div>
                </div>
            } @else if (companiesInSelectedPlan().length === 0) {
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-building fs-1 d-block mb-3 opacity-25"></i>
                    No hay empresas con este plan activo.
                </div>
            } @else {
                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead class="table-light">
                            <tr>
                                <th>Empresa</th>
                                <th>RUC</th>
                                <th>Estado</th>
                                <th>Vence</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (empresa of companiesInSelectedPlan(); track empresa.id) {
                                <tr>
                                    <td>
                                        <div class="fw-bold">{{ empresa.razon_social }}</div>
                                        <div class="small text-muted">{{ empresa.email }}</div>
                                    </td>
                                    <td>{{ empresa.ruc }}</td>
                                    <td>
                                        <span class="badge rounded-pill" 
                                              [ngClass]="empresa.estado_suscripcion === 'ACTIVA' ? 'bg-success' : 'bg-warning'">
                                            {{ empresa.estado_suscripcion }}
                                        </span>
                                    </td>
                                    <td class="small" [class.text-danger]="isExpired(empresa.fecha_vencimiento)">
                                        <i *ngIf="isExpired(empresa.fecha_vencimiento)" class="bi bi-exclamation-triangle-fill me-1"></i>
                                        {{ (empresa.fecha_vencimiento | date:'dd/MM/yyyy') || 'N/A' }}
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            }
        </div>
    </app-modal>
    }

    <!-- ASSIGN COMPANY MODAL -->
    @if (assignModalOpen()) {
    <app-modal [title]="'Asignar Empresa a Plan'" [size]="'md'" (close)="assignModalOpen.set(false)">
        <div class="p-4">
            <p>Selecciona una empresa para asignarla directamente al plan <strong>{{ selectedPlan()?.nombre }}</strong>.</p>
            
            <div class="mb-4 mt-3">
                <label class="form-label small fw-bold">Empresa</label>
                <select class="form-select border-2 rounded-3" [(ngModel)]="selectedEmpresaId">
                    <option value="">Seleccione una empresa...</option>
                    @for (emp of allEmpresas(); track emp.id) {
                        <option [value]="emp.id">{{ emp.razon_social }} ({{ emp.ruc }})</option>
                    }
                </select>
            </div>

            <div class="d-flex justify-content-end gap-2">
                <button class="btn btn-light rounded-pill px-4" (click)="assignModalOpen.set(false)">Cancelar</button>
                <button class="btn btn-dark rounded-pill px-4 shadow-sm" [disabled]="!selectedEmpresaId() || assignmentLoading()" (click)="assignCompany()">
                    {{ assignmentLoading() ? 'Asignando...' : 'Asignar Plan' }}
                </button>
            </div>
        </div>
    </app-modal>
    }
  `,
    styles: [`
    /* Ghost/Preview Style - Floating Copy */
    .cdk-drag-preview {
        box-sizing: border-box;
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0,0,0,0.2) !important;
        background: white;
        transition: none !important;
        opacity: 0.9;
        cursor: grabbing !important;
    }

    /* Placeholder - Strictly keeps the spot in the grid */
    .cdk-drag-placeholder {
        transition: none !important;
    }

    /* Important: Disable any internal CDK movement */
    .cdk-drag-animating {
        transition: none !important;
    }

    .cdk-drop-list-dragging .cdk-drag {
        transition: none !important;
    }
  `]
})
export class PlanesListComponent implements OnInit {
    private fb = inject(FormBuilder);
    private planService = inject(PlanService);
    private moduloService = inject(ModuloService);
    private empresaService = inject(EmpresaService);
    private feedback = inject(FeedbackService);

    planes = signal<Plan[]>([]);
    formModalOpen = signal(false);
    companiesModalOpen = signal(false);
    selectedPlan = signal<Plan | null>(null);
    companiesInSelectedPlan = signal<any[]>([]);
    loadingCompanies = signal(false);
    saving = signal(false);

    // Module Management
    allModulos = signal<Modulo[]>([]);
    planModulos = signal<any[]>([]); // Current assignments for selected plan

    // Local Assignment
    assignModalOpen = signal(false);
    allEmpresas = signal<Empresa[]>([]);
    selectedEmpresaId = signal<string>('');
    assignmentLoading = signal(false);
    activeEditTab = signal<'features' | 'modules'>('features');

    // Confirmation Modal State
    showConfirmModal = signal(false);
    confirmConfig = signal<{ title: string, message: string, confirmText: string, cancelText: string, type: 'danger' | 'warning' | 'info' }>({
        title: '',
        message: '',
        confirmText: '',
        cancelText: '',
        type: 'info'
    });
    pendingAction: (() => void) | null = null;

    planForm: FormGroup = this.fb.group({
        codigo: ['', [Validators.required, Validators.pattern('^[A-Z0-9_]+$')]],
        nombre: ['', Validators.required],
        descripcion: [''],
        precio_mensual: [0, [Validators.required, Validators.min(0)]],
        max_usuarios: [1, [Validators.required, Validators.min(0)]],
        max_facturas_mes: [100, [Validators.required, Validators.min(0)]],
        max_establecimientos: [1, [Validators.required, Validators.min(0)]],
        max_programaciones: [0, [Validators.required, Validators.min(0)]],
        visible_publico: [true],
        activo: [true],
        orden: [0],
        caracteristicas: this.fb.array([])
    });

    ngOnInit() {
        this.loadPlanes();
        this.loadModulos();
        this.loadEmpresas();
    }

    loadModulos() {
        this.moduloService.getModulos().subscribe(data => this.allModulos.set(data));
    }

    loadEmpresas() {
        this.empresaService.getEmpresas().subscribe(data => this.allEmpresas.set(data));
    }

    loadPlanes() {
        this.planService.getPlanes().subscribe({
            next: (data) => this.planes.set(data.sort((a, b) => (a.orden || 0) - (b.orden || 0))),
            error: (err) => this.feedback.showError('Error al cargar planes')
        });
    }

    openCreateModal() {
        this.selectedPlan.set(null);

        // Reset FormArray
        (this.planForm.get('caracteristicas') as FormArray).clear();

        this.planForm.reset({
            precio_mensual: 0,
            max_usuarios: 1,
            max_facturas_mes: 100,
            max_establecimientos: 1,
            max_programaciones: 0,
            visible_publico: true,
            activo: true,
            orden: 0
        });
        this.formModalOpen.set(true);
    }

    openEditModal(plan: Plan) {
        this.selectedPlan.set(plan);

        // Populate FormArray
        const featuresArray = this.planForm.get('caracteristicas') as FormArray;
        featuresArray.clear();
        if (plan.caracteristicas && Array.isArray(plan.caracteristicas)) {
            plan.caracteristicas.forEach(f => {
                // Handle both legacy string and new object structure if frontend receives mixed
                if (typeof f === 'string') {
                    // This case might happen if cached old data is sent before refresh
                    this.addCaracteristica(f, '');
                } else {
                    this.addCaracteristica(f.nombre, f.descripcion);
                }
            });
        }

        this.planForm.patchValue(plan);
        this.loadPlanModulos(plan.id);
        this.formModalOpen.set(true);
    }

    loadPlanModulos(planId: string) {
        this.moduloService.getModulosByPlan(planId).subscribe(data => this.planModulos.set(data));
    }

    togglePlanModulo(modulo: Modulo, evento: any) {
        if (!this.selectedPlan()) return;
        const incluido = evento.target.checked;
        this.moduloService.assignModuloToPlan(this.selectedPlan()!.id, modulo.id, incluido).subscribe({
            next: () => this.feedback.showSuccess(`Módulo ${modulo.nombre} actualizado`),
            error: () => this.feedback.showError('Error al actualizar módulo')
        });
    }

    isModuloIncluido(moduloId: string): boolean {
        return this.planModulos().some(pm => pm.modulo_id === moduloId && pm.incluido);
    }

    get caracteristicasArray() {
        return this.planForm.get('caracteristicas') as FormArray;
    }

    addCaracteristica(nombre: string = '', descripcion: string = '') {
        const group = this.fb.group({
            nombre: [nombre, Validators.required],
            descripcion: [descripcion]
        });
        this.caracteristicasArray.push(group);
    }

    removeCaracteristica(index: number) {
        this.caracteristicasArray.removeAt(index);
    }

    closeModal() {
        this.formModalOpen.set(false);
        this.planForm.markAsPristine();
    }

    requestCloseModal() {
        if (this.planForm.dirty) {
            this.confirmConfig.set({
                title: 'Cambios sin guardar',
                message: 'Tienes cambios pendientes. ¿Estás seguro de que quieres salir? Se perderá lo que hayas modificado.',
                confirmText: 'Salir sin guardar',
                cancelText: 'Continuar editando',
                type: 'warning'
            });
            this.pendingAction = () => this.closeModal();
            this.showConfirmModal.set(true);
        } else {
            this.closeModal();
        }
    }

    confirmAction() {
        if (this.pendingAction) {
            this.pendingAction();
            this.pendingAction = null;
        }
        this.showConfirmModal.set(false);
    }

    savePlan() {
        if (this.planForm.invalid) return;
        this.saving.set(true);

        const payload = this.planForm.value;

        const observer = {
            next: () => {
                this.saving.set(false);
                this.closeModal();
                this.loadPlanes();
                this.feedback.showSuccess(this.selectedPlan() ? 'Plan actualizado' : 'Plan creado correctamente');
            },
            error: (err: any) => {
                this.saving.set(false);
                this.feedback.showError('Error: ' + (err.error?.detail || err.message));
            }
        };

        if (this.selectedPlan()) {
            this.planService.updatePlan(this.selectedPlan()!.id, payload).subscribe(observer);
        } else {
            this.planService.createPlan(payload).subscribe(observer);
        }
    }

    // CDK Drop Handler
    onDrop(event: CdkDragDrop<Plan[]>) {
        if (event.previousIndex === event.currentIndex) return;

        const currentPlanes = [...this.planes()];
        moveItemInArray(currentPlanes, event.previousIndex, event.currentIndex);

        // Update Signal Optimistically
        this.planes.set(currentPlanes);

        // Update Backend
        const updates = currentPlanes.map((p: Plan, index: number) => {
            return { id: p.id, orden: index };
        });

        console.log('[Reorder] Sending updates to server:', updates);

        // Show loading
        this.feedback.showLoading('Guardando nuevo orden...');

        this.planService.reorderPlans(updates).subscribe({
            next: () => {
                this.feedback.hideLoading();
                this.feedback.showSuccess('Orden de planes actualizado correctamente');
                // Reload to be absolutely sure we match backend state
                this.loadPlanes();
            },
            error: (err) => {
                this.feedback.hideLoading();
                this.feedback.showError('Error al guardar el nuevo orden: ' + (err.error?.detail || err.message));
                this.loadPlanes(); // Revert
            }
        });
    }

    toggleActivo(plan: Plan) {
        this.confirmConfig.set({
            title: plan.activo ? 'Desactivar Plan' : 'Activar Plan',
            message: `¿Estás seguro de que deseas ${plan.activo ? 'desactivar' : 'activar'} el plan "${plan.nombre}"?`,
            confirmText: plan.activo ? 'Desactivar' : 'Activar',
            cancelText: 'Cancelar',
            type: plan.activo ? 'warning' : 'info'
        });
        this.pendingAction = () => {
            this.planService.updatePlan(plan.id, { activo: !plan.activo }).subscribe({
                next: () => {
                    this.loadPlanes();
                    this.feedback.showSuccess(`Plan ${plan.activo ? 'desactivado' : 'activado'} correctamente`);
                },
                error: (err) => this.feedback.showError('Error al cambiar estado')
            });
        };
        this.showConfirmModal.set(true);
    }

    deletePlan(plan: Plan) {
        this.confirmConfig.set({
            title: 'Eliminar Plan',
            message: `¿Eliminar definitivamente el plan "${plan.nombre}"? Esto no afectará a las empresas que ya lo tienen contratado hasta su renovación.`,
            confirmText: 'Eliminar definitivamente',
            cancelText: 'Cancelar',
            type: 'danger'
        });
        this.pendingAction = () => {
            this.planService.deletePlan(plan.id).subscribe({
                next: () => {
                    this.loadPlanes();
                    this.feedback.showSuccess('Plan eliminado');
                },
                error: (err) => this.feedback.showError('No se puede eliminar el plan')
            });
        };
        this.showConfirmModal.set(true);
    }

    viewCompanies(plan: Plan) {
        this.selectedPlan.set(plan);
        this.companiesModalOpen.set(true);
        this.loadingCompanies.set(true);
        this.planService.getCompaniesByPlan(plan.id).subscribe({
            next: (data) => {
                this.companiesInSelectedPlan.set(data);
                this.loadingCompanies.set(false);
            },
            error: (err) => {
                this.feedback.showError('Error al cargar empresas');
                this.loadingCompanies.set(false);
            }
        });
    }

    openAssignModal() {
        this.selectedEmpresaId.set('');
        this.assignModalOpen.set(true);
    }

    assignCompany() {
        if (!this.selectedEmpresaId() || !this.selectedPlan()) return;
        this.assignmentLoading.set(true);

        // Using EmpresaService to update plan
        this.empresaService.updateEmpresa(this.selectedEmpresaId(), { plan_id: this.selectedPlan()!.id }).subscribe({
            next: () => {
                this.assignmentLoading.set(false);
                this.assignModalOpen.set(false);
                this.feedback.showSuccess('Empresa asignada al plan');
                this.viewCompanies(this.selectedPlan()!); // Refresh list
            },
            error: () => {
                this.assignmentLoading.set(false);
                this.feedback.showError('Error al asignar empresa');
            }
        });
    }

    isExpired(fechaStr: string): boolean {
        if (!fechaStr) return false;
        return new Date(fechaStr) < new Date();
    }
}

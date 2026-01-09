import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { EmpresaService, Empresa } from '../../../../core/services/empresa.service';
import { VendedorService, Vendedor } from '../../../../core/services/vendedor.service';
import { PlanService, Plan } from '../../../../core/services/plan.service';
import { PagoSuscripcionService } from '../../../../core/services/pago-suscripcion.service';
import { FeedbackService } from '../../../../shared/services/feedback.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, ModalComponent],
  template: `
    <div class="container-fluid p-0" style="font-family: 'Inter', sans-serif;">
      <div class="d-flex justify-content-between align-items-end mb-5">
        <div>
            <h5 class="text-uppercase text-muted small fw-bold mb-1" style="letter-spacing: 1px;">Administración</h5>
            <h1 class="display-6 fw-bold text-dark mb-0">Gestión de Empresas</h1>
        </div>
        <div class="d-flex gap-3">
            <button class="btn btn-dark rounded-pill px-4 fw-bold shadow-sm" (click)="openCreateModal()">
              <i class="bi bi-plus-lg me-2"></i> Nueva Empresa
            </button>
            <button class="btn btn-outline-dark rounded-pill px-4 fw-bold" (click)="loadEmpresas(filterVendorControl.value || '', true)">
                <i class="bi bi-arrow-clockwise me-1"></i>
            </button>
        </div>
      </div>


      <!-- SUMMARY WIDGETS -->
      <div class="row g-4 mb-5">
        <div class="col-md-4">
          <div class="card border-0 p-4 shadow-sm" style="border-radius: 20px; border-left: 5px solid #000 !important;">
            <h6 class="text-uppercase text-muted small fw-bold mb-1">Total Empresas</h6>
            <h3 class="fw-bold mb-0 text-dark">{{ empresas().length }}</h3>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 p-4 shadow-sm" style="border-radius: 20px; border-left: 5px solid #00ca72 !important;">
            <h6 class="text-uppercase text-muted small fw-bold mb-1">Empresas Activas</h6>
            <h3 class="fw-bold mb-0 text-dark">{{ totalActivas() }}</h3>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card border-0 p-4 shadow-sm" style="border-radius: 20px; border-left: 5px solid #ff4d6d !important;">
            <h6 class="text-uppercase text-muted small fw-bold mb-1">Suscripciones Vencidas</h6>
            <h3 class="fw-bold mb-0 text-dark">{{ totalVencidas() }}</h3>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm p-4" style="border-radius: 20px;">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr class="bg-dark text-white">
                <th class="ps-4 py-3 border-0 rounded-start-4">Empresa / RUC</th>
                <th class="py-3 border-0">Plan & Periodo</th>
                <th class="py-3 border-0">Estado</th>
                <th class="py-3 border-0">Suscripción</th>
                <th class="py-3 border-0 text-end pe-4 rounded-end-4">Acciones</th>
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
                          Vence: {{ empresa.fecha_fin_plan | date:'dd MMM, yyyy' }}
                      </div>
                    </td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                          <div class="rounded-circle" [ngClass]="empresa.activo ? 'bg-success shadow-sm' : 'bg-danger shadow-sm'" style="width: 8px; height: 8px;"></div>
                          <span class="fw-bold small text-uppercase" style="letter-spacing: 0.5px;">{{ empresa.activo ? 'ACTIVO' : 'INACTIVO' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge rounded-pill px-3 py-2 fw-bold small" 
                            [ngClass]="getSuscripcionBadgeClass(empresa.estado_suscripcion)">
                        {{ empresa.estado_suscripcion }}
                      </span>
                    </td>
                    <td class="text-end pe-4" (click)="$event.stopPropagation()">
                         <div class="dropdown">
                            <button class="btn btn-light btn-sm rounded-circle border shadow-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 p-2" style="min-width: 200px;">
                                <li><a class="dropdown-item rounded-3 py-2 fw-medium" (click)="openViewModal(empresa)"><i class="bi bi-eye me-2 text-info"></i>Ver Detalles</a></li>
                                <li><a class="dropdown-item rounded-3 py-2 fw-medium" (click)="openEditModal(empresa)"><i class="bi bi-pencil-fill me-2 text-secondary"></i>Editar</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item rounded-3 py-2 fw-medium" (click)="openAssignVendorModal(empresa)"><i class="bi bi-person-badge me-2 text-primary"></i>Asignar Vendedor</a></li>
                                <li><a class="dropdown-item rounded-3 py-2 fw-medium" (click)="openChangePlanModal(empresa)"><i class="bi bi-card-list me-2 text-warning"></i>Cambiar Plan</a></li>
                                <li><a class="dropdown-item rounded-3 py-2 fw-medium text-success" (click)="openQuickPayModal(empresa)"><i class="bi bi-currency-dollar me-2"></i>Registrar Pago</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item rounded-3 py-2 fw-medium" [ngClass]="empresa.activo ? 'text-danger' : 'text-success'" (click)="openToggleActiveModal(empresa)">
                                    <i class="bi me-2" [ngClass]="empresa.activo ? 'bi-toggle-on text-danger' : 'bi-toggle-off text-success'"></i>
                                    {{ empresa.activo ? 'Desactivar' : 'Activar' }}
                                </a></li>
                                <li><a class="dropdown-item rounded-3 py-2 fw-medium text-danger" (click)="openDeleteModal(empresa)"><i class="bi bi-trash me-2"></i>Eliminar</a></li>
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
                 <label class="small text-secondary fw-bold text-uppercase mb-1">Vendedor Asignado</label>
                 <p class="mb-0 text-dark fw-medium">{{ getVendedorNombre(selectedEmpresa()!.vendedor_id) }}</p>
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
                    <input type="text" class="form-control" formControlName="ruc" 
                           [class.is-invalid]="editForm.get('ruc')?.invalid && editForm.get('ruc')?.touched"
                           maxlength="13"
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                           placeholder="1234567890001">
                    <div class="invalid-feedback">RUC debe tener exactamente 13 números.</div>
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
                    <input type="email" class="form-control" formControlName="email" 
                           [class.is-invalid]="editForm.get('email')?.invalid && editForm.get('email')?.touched"
                           placeholder="empresa@ejemplo.com">
                    <div class="invalid-feedback">Ingrese un correo válido.</div>
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-bold text-secondary">Teléfono</label>
                    <input type="text" class="form-control" formControlName="telefono" 
                           [class.is-invalid]="editForm.get('telefono')?.invalid && editForm.get('telefono')?.touched"
                           maxlength="10"
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                           placeholder="0991234567">
                    <div class="invalid-feedback">Teléfono debe tener exactamente 10 números.</div>
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
                    <input type="text" class="form-control" formControlName="ruc"
                           maxlength="13"
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')">
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
                    <input type="text" class="form-control" formControlName="telefono"
                           maxlength="10"
                           oninput="this.value = this.value.replace(/[^0-9]/g, '')">
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
  `]
})
export class EmpresasListComponent implements OnInit {
  private empresaService = inject(EmpresaService);
  private vendedorService = inject(VendedorService);
  private planService = inject(PlanService);
  private pagoSuscripcionService = inject(PagoSuscripcionService);
  private feedbackService = inject(FeedbackService);
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
  quickPayModalOpen = signal<boolean>(false);

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

  editForm: FormGroup;
  vendorControl = this.fb.control(''); // Removed required validator to allow unassignment (empty value)
  filterVendorControl = this.fb.control('');
  planControl = this.fb.control('', Validators.required);

  currentEditingId: string | null = null;

  constructor() {
    this.editForm = this.fb.group({
      ruc: ['', [Validators.required, Validators.pattern('^([0-9]{13})?$')]],
      razon_social: ['', Validators.required],
      nombre_comercial: ['', Validators.required],
      logo_url: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern('^([0-9]{10})?$')]],
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
        this.feedbackService.showError('Error al cargar empresas');
      }
    });
  }

  onFilterChange() {
    // Just trigger computed signal if using local cache
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
      case 'PENDIENTE': return 'bg-warning bg-opacity-10 text-warning';
      case 'VENCIDA': return 'bg-danger bg-opacity-10 text-danger';
      case 'CANCELADA': return 'bg-secondary bg-opacity-10 text-secondary';
      default: return 'bg-light text-dark';
    }
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
        this.empresaService.clearCache();
        this.loadEmpresas(this.filterVendorControl.value || '', true);
        this.feedbackService.showSuccess('Empresa creada correctamente');
      },
      error: (err) => {
        this.saving.set(false);
        this.feedbackService.showError('Error al crear empresa');
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
      logo_url: empresa.logo_url || '',
      email: empresa.email,
      telefono: empresa.telefono || '',
      direccion: empresa.direccion || '',
      tipo_contribuyente: empresa.tipo_contribuyente || 'Persona Natural',
      obligado_contabilidad: empresa.obligado_contabilidad || false,
      vendedor_id: empresa.vendedor_id || ''
    });
    this.editForm.markAsPristine();
    this.editModalOpen.set(true);
  }

  // --- Helper Helpers ---
  getVendedorNombre(id?: string): string {
    if (!id) return 'Superadmin';
    const v = this.vendedores().find(vend => vend.id === id);
    return v ? `${v.nombres} ${v.apellidos}` : 'Vendedor no encontrado';
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

  // --- Quick Pay Modal ---
  openQuickPayModal(empresa: Empresa) {
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
        this.feedbackService.showSuccess('Pago registrado correctamente. La suscripción ha sido extendida.');
        this.closeQuickPayModal();
        this.loadEmpresas(this.filterVendorControl.value || '');
      },
      error: (err) => {
        this.saving.set(false);
        this.feedbackService.hideLoading();
        this.feedbackService.showError('Error al registrar pago: ' + (err.error?.detail || err.message));
      }
    });
  }
}

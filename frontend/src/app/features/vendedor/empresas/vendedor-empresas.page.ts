import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { VendedorEmpresaService, VendedorEmpresaStats } from './services/vendedor-empresa.service';
import { VendedorEmpresaTableComponent } from './components/empresa-table/vendedor-empresa-table.component';
import { VendedorCreateEmpresaModalComponent } from './components/create-empresa-modal/vendedor-create-empresa-modal.component';
import { VendedorEmpresaDetailsModalComponent } from './components/details-modal/vendedor-empresa-details-modal.component';
import { VendedorChangePlanModalComponent } from './components/change-plan-modal/vendedor-change-plan-modal.component';
import { EmpresaStatsComponent } from '../../super-admin/empresas/components/empresa-stats/empresa-stats.component';
import { UiService } from '../../../shared/services/ui.service';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { PermissionsService } from '../../../core/auth/permissions.service';


@Component({
    selector: 'app-vendedor-empresas',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        VendedorEmpresaTableComponent,
        VendedorCreateEmpresaModalComponent,
        VendedorCreateEmpresaModalComponent,
        VendedorEmpresaDetailsModalComponent,
        VendedorChangePlanModalComponent,
        EmpresaStatsComponent,
        ToastComponent
    ],
    template: `
    <div class="empresas-page-container">
      <!-- STATS -->
      <app-empresa-stats
        *ngIf="stats"
        [total]="stats.total"
        [active]="stats.activas"
        [inactive]="stats.inactivas"
      ></app-empresa-stats>

      <!-- SEARCH & ACTIONS BAR -->
      <section class="module-actions mb-4">
        <div class="actions-bar-container shadow-sm py-2 px-4 rounded-4">
            <div class="row align-items-center g-3">
            
            <!-- Búsqueda -->
            <div class="col-lg-5">
                <div class="search-box-premium">
                <i class="bi bi-search"></i>
                <input 
                    type="text" 
                    [(ngModel)]="searchQuery" 
                    placeholder="Buscar por razón social, RUC..." 
                    class="form-control-premium-search"
                >
                </div>
            </div>

            <!-- Filtros -->
            <div class="col-lg-4">
                <select class="form-select-premium" [(ngModel)]="filterEstado">
                    <option value="ALL">Todos los Estados</option>
                    <option value="ACTIVO">Activos</option>
                    <option value="INACTIVO">Inactivos</option>
                </select>
            </div>

            <!-- Botón de Acción -->
            <div class="col-lg-3 text-lg-end">
                <div class="d-inline-block w-100" [title]="!canCreate ? 'No tienes permiso para crear empresas' : ''">
                    <button 
                        [disabled]="!canCreate"
                        [class.restricted-btn]="!canCreate"
                        class="btn-premium-primary w-100 justify-content-center"
                        (click)="openCreateModal()"
                        style="height: 40px;"
                    >
                        <i class="bi" [ngClass]="canCreate ? 'bi-plus-lg' : 'bi-lock-fill'"></i>
                        <span class="ms-2">{{ canCreate ? 'Nueva Empresa' : 'Creación Restringida' }}</span>
                    </button>
                </div>
            </div>
            
            </div>
        </div>
      </section>

      <!-- TABLE -->
      <app-vendedor-empresa-table
        [empresas]="filteredEmpresas"
        [canAccess]="canAccess"
        [canChangePlan]="canChangePlan"
        (onAction)="handleAction($event)"
      ></app-vendedor-empresa-table>
      
      <!-- MODAL CREATE -->
      <app-vendedor-create-empresa-modal 
        *ngIf="showCreateModal" 
        (onSave)="saveEmpresa($event)" 
        (onClose)="showCreateModal = false"
      ></app-vendedor-create-empresa-modal>

      <!-- MODAL DETAILS -->
      <app-vendedor-empresa-details-modal
        *ngIf="showDetailsModal"
        [empresa]="selectedEmpresa"
        (onClose)="closeDetailsModal()"
        (onClose)="closeDetailsModal()"
      ></app-vendedor-empresa-details-modal>

      <!-- MODAL CHANGE PLAN -->
      <app-vendedor-change-plan-modal
        *ngIf="showPlanModal"
        [empresaName]="selectedEmpresa?.razonSocial || ''"
        [selectedPlanId]="selectedEmpresa?.planId || null"
        (onSave)="updatePlan($event)"
        (onClose)="closePlanModal()"
      ></app-vendedor-change-plan-modal>

      <app-toast></app-toast>
    </div>
  `,
    styles: [`
    .empresas-page-container {
      min-height: 100vh;
      background: #f8fafc;
    }
    .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        color: #161d35;
        letter-spacing: -0.5px;
        margin-bottom: 0.25rem;
    }
    
    /* REUSED STYLES FROM ADMIN */
    .actions-bar-container {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    .search-box-premium {
      position: relative;
      width: 100%;
    }
    .search-box-premium i {
      position: absolute;
      left: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 1.1rem;
    }
    .form-control-premium-search {
      background: #f8fafc;
      border: 1.5px solid rgba(0, 0, 0, 0.05);
      border-radius: 14px;
      padding: 0 1.25rem 0 3.25rem;
      height: 40px;
      font-size: 0.9rem;
      font-weight: 500;
      color: #161d35;
      transition: all 0.2s;
      width: 100%;
    }
    .form-control-premium-search:focus {
      background: #ffffff;
      border-color: #161d35;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
      outline: none;
    }
    .form-select-premium {
      background: #f8fafc;
      border: 1.5px solid rgba(0, 0, 0, 0.05);
      border-radius: 14px;
      padding: 0 1rem;
      height: 40px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      width: 100%;
      cursor: pointer;
      transition: all 0.2s;
    }
    .form-select-premium:focus {
      border-color: #161d35;
      outline: none;
    }

    .btn-premium-primary {
        background: #161d35;
        color: #ffffff;
        border: none;
        padding: 0 1.5rem;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3);
    }
    .btn-premium-primary:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 30px -8px rgba(22, 29, 53, 0.4);
        background: #232d4d;
    }
    
    /* RESTRICTED STATE */
    .restricted-btn {
        background: #94a3b8 !important;
        cursor: not-allowed !important;
        box-shadow: none !important;
        opacity: 0.7;
    }
    .restricted-btn:hover {
        transform: none !important;
    }
  `]
})
export class VendedorEmpresasPage implements OnInit, OnDestroy {
    empresas: any[] = [];
    stats: VendedorEmpresaStats = { total: 0, activas: 0, inactivas: 0 };

    showCreateModal = false;
    showDetailsModal = false;
    showPlanModal = false;
    selectedEmpresa: any = null;

    // Filters
    searchQuery = '';
    filterEstado = 'ALL';

    // Permissions
    canCreate = false;
    canAccess = false;
    canChangePlan = false;

    private destroy$ = new Subject<void>();

    constructor(
        private vendedorService: VendedorEmpresaService,
        private authFacade: AuthFacade,
        private permissionsService: PermissionsService,
        private uiService: UiService,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.checkPermissions();
        this.loadData();

        // Subscribe to data
        this.vendedorService.getEmpresas()
            .pipe(takeUntil(this.destroy$))
            .subscribe(data => {
                this.empresas = data;
                this.calculateStats(data);
                this.cd.detectChanges();
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    checkPermissions() {
        this.canCreate = this.permissionsService.hasPermission('crear_empresas');
        this.canAccess = this.permissionsService.hasPermission('acceder_empresas');
        this.canChangePlan = this.permissionsService.hasPermission('gestionar_planes');
    }

    loadData() {
        this.vendedorService.loadMyEmpresas();
    }

    get filteredEmpresas() {
        return this.empresas.filter(e => {
            const matchSearch = !this.searchQuery ||
                e.razonSocial.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (e.ruc && e.ruc.includes(this.searchQuery));

            const matchEstado = this.filterEstado === 'ALL' ||
                (this.filterEstado === 'ACTIVO' && e.activo) ||
                (this.filterEstado === 'INACTIVO' && !e.activo);

            return matchSearch && matchEstado;
        });
    }

    calculateStats(data: any[]) {
        this.stats = {
            total: data.length,
            activas: data.filter(e => e.activo || e.estado === 'ACTIVO').length,
            inactivas: data.filter(e => !e.activo && e.estado !== 'ACTIVO').length
        };
    }

    openCreateModal() {
        if (!this.canCreate) return;
        this.showCreateModal = true;
    }

    saveEmpresa(data: any) {
        this.vendedorService.createEmpresa(data).subscribe({
            next: () => {
                this.showCreateModal = false;
                this.uiService.showToast('Empresa registrada exitosamente', 'success');
            },
            error: (err) => this.uiService.showError(err, 'Error al registrar empresa')
        });
    }

    handleAction(event: { type: string, empresa: any }) {
        switch (event.type) {
            case 'view_details':
                this.selectedEmpresa = event.empresa;
                this.showDetailsModal = true;
                break;
            case 'access_company':
                if (this.canAccess) {
                    this.uiService.showToast('Accediendo a sistema de la empresa...', 'info');
                    // Aqui iria la logica de impersonation o redireccion
                } else {
                    this.uiService.showToast('No tienes permiso para acceder.', 'warning');
                }
                break;
            case 'change_plan':
                if (this.canChangePlan) {
                    this.selectedEmpresa = event.empresa;
                    this.showPlanModal = true;
                } else {
                    this.uiService.showToast('No tienes permiso para gestionar planes.', 'warning');
                }
                break;
            default:
                break;
        }
    }

    closeDetailsModal() {
        this.showDetailsModal = false;
        this.selectedEmpresa = null;
    }

    closePlanModal() {
        this.showPlanModal = false;
        this.selectedEmpresa = null;
    }

    updatePlan(data: { planId: string, monto: number, observaciones: string, metodo_pago: string }) {
        if (!this.selectedEmpresa) return;

        this.vendedorService.changePlan(
            this.selectedEmpresa.id,
            data.planId,
            data.monto,
            data.observaciones,
            data.metodo_pago
        ).subscribe({
            next: () => {
                this.uiService.showToast('Plan actualizado correctamente', 'success');
                this.closePlanModal();
            },
            error: (err) => this.uiService.showError(err, 'Error al actualizar el plan')
        });
    }
}

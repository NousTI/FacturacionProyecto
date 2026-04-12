import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { VendedorEmpresaService, VendedorEmpresaStats } from './services/vendedor-empresa.service';
import { VendedorEmpresaTableComponent } from './components/empresa-table/vendedor-empresa-table.component';
import { VendedorCreateEmpresaModalComponent } from './components/create-empresa-modal/vendedor-create-empresa-modal.component';
import { VendedorEmpresaDetailsModalComponent } from './components/details-modal/vendedor-empresa-details-modal.component';
import { VendedorChangePlanModalComponent } from './components/change-plan-modal/vendedor-change-plan-modal.component';
import { VendedorEmpresaStatsComponent } from './components/vendedor-empresa-stats.component';
import { VendedorEmpresaActionsComponent } from './components/vendedor-empresa-actions.component';
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
        VendedorEmpresaDetailsModalComponent,
        VendedorChangePlanModalComponent,
        VendedorEmpresaStatsComponent,
        VendedorEmpresaActionsComponent,
        ToastComponent
    ],
    template: `
    <div class="empresas-page-container">
      <!-- STATS -->
      <app-vendedor-empresa-stats
        *ngIf="stats"
        [stats]="stats"
      ></app-vendedor-empresa-stats>

      <!-- SEARCH & ACTIONS BAR -->
      <app-vendedor-empresa-actions
        [(searchQuery)]="searchQuery"
        [(filterEstado)]="filterEstado"
        [(filterPlan)]="filterPlan"
        [planes]="planes"
        [canCreate]="canCreate"
        (onCreate)="openCreateModal()"
      ></app-vendedor-empresa-actions>

      <!-- TABLE -->
      <app-vendedor-empresa-table
        [empresas]="filteredEmpresas"
        [canAccess]="canAccess"
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
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      overflow: hidden;
      min-height: 0;
    }
    .empresas-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
    }
  `]
})
export class VendedorEmpresasPage implements OnInit, OnDestroy {
    empresas: any[] = [];
    stats: VendedorEmpresaStats = { total: 0, activas: 0, inactivas: 0 };

    showCreateModal = false;
    showDetailsModal = false;
    showPlanModal = false;
    planes: any[] = [];
    selectedEmpresa: any = null;

    // Filters
    searchQuery = '';
    filterEstado = 'ALL';
    filterPlan = 'ALL';

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
        this.loadPlanes();

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

    loadPlanes() {
        this.vendedorService.getPlanes().subscribe(data => {
            this.planes = data;
            this.cd.detectChanges();
        });
    }

    get filteredEmpresas() {
        return this.empresas.filter(e => {
            const matchSearch = !this.searchQuery ||
                e.razonSocial.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                (e.ruc && e.ruc.includes(this.searchQuery));

            const matchEstado = this.filterEstado === 'ALL' ||
                (this.filterEstado === 'ACTIVO' && e.activo) ||
                (this.filterEstado === 'INACTIVO' && !e.activo);

            const matchPlan = this.filterPlan === 'ALL' || 
                (e.planId?.toString() === this.filterPlan.toString());

            return matchSearch && matchEstado && matchPlan;
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
                    this.uiService.showToast('Solicitando acceso...', 'info');
                    this.vendedorService.accederEmpresa(event.empresa.id).subscribe({
                        next: (res: any) => {
                            this.uiService.showToast(res, 'success');
                            // Logic for impersonation comes later
                        },
                        error: (err: any) => {
                            this.uiService.showError(err, 'Error al acceder a la empresa');
                        }
                    });
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

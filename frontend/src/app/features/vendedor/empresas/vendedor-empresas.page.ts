import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { VendedorEmpresaService, VendedorEmpresaStats } from './services/vendedor-empresa.service';
import { VendedorEmpresaTableComponent } from './components/empresa-table/vendedor-empresa-table.component';
import { VendedorCreateEmpresaModalComponent } from './components/create-empresa-modal/vendedor-create-empresa-modal.component';
import { EmpresaStatsComponent } from '../../super-admin/empresas/components/empresa-stats/empresa-stats.component';
import { UiService } from '../../../shared/services/ui.service';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
    selector: 'app-vendedor-empresas',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        VendedorEmpresaTableComponent,
        VendedorCreateEmpresaModalComponent,
        EmpresaStatsComponent,
        ToastComponent
    ],
    template: `
    <div class="empresas-page-container">
      
      <!-- HEADER & ACTIONS -->
      <div class="d-flex justify-content-between align-items-center mb-4">
         <div>
            <h1 class="page-title">Mis Empresas</h1>
            <p class="text-muted mb-0">Gestiona tu cartera de clientes y suscripciones</p>
         </div>
         <button 
            *ngIf="canCreate" 
            class="btn-premium-primary"
            (click)="openCreateModal()"
         >
            <i class="bi bi-plus-lg me-2"></i>Nueva Empresa
         </button>
      </div>

      <!-- STATS -->
      <app-empresa-stats
        *ngIf="stats"
        [total]="stats.total"
        [active]="stats.activas"
        [inactive]="stats.inactivas"
      ></app-empresa-stats>

      <!-- TABLE -->
      <app-vendedor-empresa-table
        [empresas]="empresas"
        [canAccess]="canAccess"
        (onAction)="handleAction($event)"
      ></app-vendedor-empresa-table>
      
      <!-- MODAL CREATE -->
      <app-vendedor-create-empresa-modal 
        *ngIf="showCreateModal" 
        (onSave)="saveEmpresa($event)" 
        (onClose)="showCreateModal = false"
      ></app-vendedor-create-empresa-modal>

      <app-toast></app-toast>
    </div>
  `,
    styles: [`
    .empresas-page-container {
      padding: 1.5rem 2rem;
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
    .btn-premium-primary {
        background: #161d35;
        color: #ffffff;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 10px 20px -5px rgba(22, 29, 53, 0.3);
    }
    .btn-premium-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 30px -8px rgba(22, 29, 53, 0.4);
        background: #232d4d;
    }
  `]
})
export class VendedorEmpresasPage implements OnInit, OnDestroy {
    empresas: any[] = [];
    stats: VendedorEmpresaStats = { total: 0, activas: 0, inactivas: 0 };

    showCreateModal = false;

    // Permissions
    canCreate = false;
    canAccess = false;

    private destroy$ = new Subject<void>();

    constructor(
        private vendedorService: VendedorEmpresaService,
        private authFacade: AuthFacade,
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
        const user = this.authFacade.getUser();
        if (user) {
            this.canCreate = !!user.puede_crear_empresas;
            this.canAccess = !!user.puede_acceder_empresas;
        }
    }

    loadData() {
        this.vendedorService.loadMyEmpresas();
    }

    calculateStats(data: any[]) {
        this.stats = {
            total: data.length,
            activas: data.filter(e => e.activo || e.estado === 'ACTIVO').length,
            inactivas: data.filter(e => !e.activo && e.estado !== 'ACTIVO').length
        };
    }

    openCreateModal() {
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
        if (event.type === 'access') {
            if (this.canAccess) {
                this.uiService.showToast('Accediendo a la empresa...', 'info');
                // Logic to switch context would go here or redirect
            } else {
                this.uiService.showToast('No tienes permiso para acceder a esta empresa', 'warning');
            }
        }
    }
}

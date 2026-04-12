import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { ProveedoresStatsComponent } from './components/proveedores-stats.component';
import { ProveedoresActionsComponent } from './components/proveedores-actions.component';
import { ProveedoresTableComponent } from './components/proveedores-table.component';
import { ProveedorFormModalComponent } from './components/modals/proveedor-form-modal.component';
import { ProveedorDetailModalComponent } from './components/modals/proveedor-detail-modal.component';
import { ToggleProveedorModalComponent } from './components/modals/toggle-proveedor-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

import { ProveedoresService } from './services/proveedores.service';
import { UiService } from '../../../shared/services/ui.service';
import { Proveedor } from '../../../domain/models/proveedor.model';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { PROVEEDORES_PERMISSIONS } from '../../../constants/permission-codes';

@Component({
    selector: 'app-usuario-proveedores',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ProveedoresStatsComponent,
        ProveedoresActionsComponent,
        ProveedoresTableComponent,
        ProveedorFormModalComponent,
        ProveedorDetailModalComponent,
        ToggleProveedorModalComponent,
        ConfirmModalComponent,
        ToastComponent
    ],
    template: `
    <div class="proveedores-page-container">
      <ng-container *ngIf="canView; else noPermission">
        
        <!-- 1. STATS -->
        <app-proveedores-stats
          [total]="totalProveedores"
          [active]="activosCount"
          [credit]="conCreditoCount"
        ></app-proveedores-stats>

        <!-- 2. ACCIONES Y FILTROS -->
        <app-proveedores-actions
          [(searchQuery)]="searchQuery"
          (onFilterChangeEmit)="handleFilters($event)"
          (onCreate)="openCreateModal()"
        ></app-proveedores-actions>

        <!-- 3. TABLA -->
        <app-proveedores-table
          [proveedores]="filteredProveedores"
          (onAction)="handleAction($event)"
        ></app-proveedores-table>

        <!-- MODALES -->
        <app-proveedor-form-modal
          *ngIf="showCreateModal"
          [proveedor]="selectedProveedor"
          [loading]="isSaving"
          (onSave)="saveProveedor($event)"
          (onClose)="showCreateModal = false"
        ></app-proveedor-form-modal>

        <app-proveedor-detail-modal
          *ngIf="showDetailModal && selectedProveedor"
          [proveedor]="selectedProveedor"
          (onClose)="showDetailModal = false"
        ></app-proveedor-detail-modal>

        <app-toggle-proveedor-modal
          *ngIf="showToggleModal && selectedProveedor"
          [proveedor]="selectedProveedor"
          [loading]="isToggling"
          (onConfirm)="confirmToggle()"
          (onClose)="showToggleModal = false"
        ></app-toggle-proveedor-modal>

        <app-confirm-modal
          *ngIf="showConfirmModal"
          title="¿Eliminar Proveedor?"
          [message]="'¿Estás seguro de que deseas eliminar a ' + selectedProveedor?.razon_social + '? Esta acción no se puede deshacer.'"
          confirmText="Eliminar Proveedor"
          type="danger"
          icon="bi-trash3-fill"
          [loading]="isDeleting"
          (onConfirm)="deleteProveedor()"
          (onCancel)="showConfirmModal = false"
        ></app-confirm-modal>

      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container">
          <div class="icon-lock-wrapper">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h2>Acceso Restringido</h2>
          <p>
            No tienes permisos suficientes para gestionar el directorio de proveedores. 
            Contacta al administrador si crees que esto es un error.
          </p>
          <button class="btn-retry" (click)="refreshData()">
            <i class="bi bi-arrow-clockwise me-2"></i> Reintentar sincronización
          </button>
        </div>
      </ng-template>

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

    .proveedores-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
    }

    /* No Permission */
    .no-permission-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem;
    }
    .icon-lock-wrapper {
      width: 100px;
      height: 100px;
      background: #fee2e2;
      color: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);
    }
    .no-permission-container h2 { font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .no-permission-container p { color: #64748b; max-width: 400px; margin-bottom: 2rem; line-height: 1.6; }
    
    .btn-retry {
      background: #1e293b;
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 100px;
      font-weight: 700;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-retry:hover { transform: scale(1.05); background: #0f172a; }
  `]
})
export class ProveedoresPage implements OnInit, OnDestroy {
    get canView(): boolean {
        return this.permissionsService.hasPermission(PROVEEDORES_PERMISSIONS.VER);
    }

    private _allProveedores: Proveedor[] = [];
    filteredProveedores: Proveedor[] = [];

    totalProveedores = 0;
    activosCount = 0;
    conCreditoCount = 0;

    searchQuery: string = '';
    filters = { estado: 'ALL' };
    showCreateModal = false;
    showDetailModal = false;
    showConfirmModal = false;
    showToggleModal = false;
    selectedProveedor: Proveedor | null = null;

    isLoading = false;
    isSaving = false;
    isDeleting = false;
    isToggling = false;

    private destroy$ = new Subject<void>();
    private permissionsService = inject(PermissionsService);

    constructor(
        private proveedoresService: ProveedoresService,
        private uiService: UiService,
        private cd: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.uiService.setPageHeader('Gestión de Proveedores', 'Administra el directorio de proveedores de tu empresa');
        this.proveedoresService.loadInitialData();

        this.proveedoresService.proveedores$
            .pipe(takeUntil(this.destroy$))
            .subscribe(proveedores => {
                this._allProveedores = proveedores;
                this.updateStats();
                this.applyFilters();
                this.cd.detectChanges();
            });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    updateStats() {
        this.totalProveedores = this._allProveedores.length;
        this.activosCount = this._allProveedores.filter(p => p.activo).length;
        this.conCreditoCount = this._allProveedores.filter(p => p.dias_credito > 0).length;
    }

    applyFilters() {
        const query = this.searchQuery.toLowerCase();
        this.filteredProveedores = this._allProveedores.filter(p => {
            const matchSearch = !query ||
                p.razon_social.toLowerCase().includes(query) ||
                p.identificacion.includes(query) ||
                (p.email && p.email.toLowerCase().includes(query));

            const matchEstado = this.filters.estado === 'ALL' ||
                (this.filters.estado === 'ACTIVO' && p.activo) ||
                (this.filters.estado === 'INACTIVO' && !p.activo);

            return matchSearch && matchEstado;
        });
    }

    handleFilters(filters: any) {
        this.filters = filters;
        this.applyFilters();
    }

    openCreateModal() {
        this.selectedProveedor = null;
        this.showCreateModal = true;
    }

    handleAction(event: { type: string, proveedor: Proveedor }) {
        this.selectedProveedor = event.proveedor;
        if (event.type === 'edit') {
            this.showCreateModal = true;
        } else if (event.type === 'delete') {
            this.showConfirmModal = true;
        } else if (event.type === 'view') {
            this.showDetailModal = true;
        } else if (event.type === 'toggle') {
            this.showToggleModal = true;
        }
    }

    saveProveedor(data: any) {
        this.isSaving = true;
        const operation = this.selectedProveedor
            ? this.proveedoresService.updateProveedor(this.selectedProveedor.id, data)
            : this.proveedoresService.createProveedor(data);

        operation
            .pipe(finalize(() => {
                this.isSaving = false;
                this.cd.detectChanges();
            }))
            .subscribe({
                next: () => {
                    this.uiService.showToast(
                        this.selectedProveedor ? 'Proveedor actualizado' : 'Proveedor creado exitosamente',
                        'success'
                    );
                    this.showCreateModal = false;
                },
                error: (err) => {
                    this.uiService.showError(err, 'Error al guardar proveedor');
                }
            });
    }

    deleteProveedor() {
        if (!this.selectedProveedor) return;
        this.isDeleting = true;
        this.proveedoresService.deleteProveedor(this.selectedProveedor.id)
            .pipe(finalize(() => {
                this.isDeleting = false;
                this.cd.detectChanges();
            }))
            .subscribe({
                next: () => {
                    this.uiService.showToast('Proveedor eliminado correctamente', 'success');
                    this.showConfirmModal = false;
                },
                error: (err) => {
                    this.uiService.showError(err, 'Error al eliminar proveedor');
                }
            });
    }

    confirmToggle() {
        if (!this.selectedProveedor) return;
        this.isToggling = true;
        this.proveedoresService.toggleActivo(this.selectedProveedor.id)
            .pipe(finalize(() => {
                this.isToggling = false;
                this.cd.detectChanges();
            }))
            .subscribe({
                next: (updated) => {
                    const estado = updated.activo ? 'activado' : 'desactivado';
                    this.uiService.showToast(`Proveedor ${estado} correctamente`, 'success');
                    this.showToggleModal = false;
                },
                error: (err) => {
                    this.uiService.showError(err, 'Error al cambiar estado');
                }
            });
    }

    refreshData() {
        this.isLoading = true;
        this.proveedoresService.refresh();
        setTimeout(() => {
            this.isLoading = false;
            this.cd.detectChanges();
        }, 800);
    }
}

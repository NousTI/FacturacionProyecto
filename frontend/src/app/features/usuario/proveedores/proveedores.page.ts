import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { ProveedorStatsComponent } from './components/proveedor-stats/proveedor-stats.component';
import { ProveedorActionsComponent } from './components/proveedor-actions/proveedor-actions.component';
import { ProveedorTableComponent } from './components/proveedor-table/proveedor-table.component';
import { CreateProveedorModalComponent } from './components/create-proveedor-modal/create-proveedor-modal.component';
import { ProveedorDetailModalComponent } from './components/proveedor-detail-modal/proveedor-detail-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

import { ProveedoresService } from './services/proveedores.service';
import { UiService } from '../../../shared/services/ui.service';
import { Proveedor } from '../../../domain/models/proveedor.model';

@Component({
    selector: 'app-usuario-proveedores',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ProveedorStatsComponent,
        ProveedorActionsComponent,
        ProveedorTableComponent,
        CreateProveedorModalComponent,
        ProveedorDetailModalComponent,
        ConfirmModalComponent,
        ToastComponent
    ],
    template: `
    <div class="proveedores-page-container">

      <!-- STATS -->
      <app-proveedor-stats
        [total]="totalProveedores"
        [activos]="activosCount"
        [conCredito]="conCreditoCount"
      ></app-proveedor-stats>

      <!-- ACCIONES Y FILTROS -->
      <app-proveedor-actions
        [(searchQuery)]="searchQuery"
        (onFilterChangeEmit)="handleFilters($event)"
        (onCreate)="openCreateModal()"
      ></app-proveedor-actions>

      <!-- TABLA -->
      <app-proveedor-table
        [proveedores]="filteredProveedores"
        (onAction)="handleAction($event)"
      ></app-proveedor-table>

      <!-- MODAL CREAR / EDITAR -->
      <app-create-proveedor-modal
        *ngIf="showCreateModal"
        [proveedor]="selectedProveedor"
        [loading]="isSaving"
        (onSave)="saveProveedor($event)"
        (onClose)="showCreateModal = false"
      ></app-create-proveedor-modal>

      <!-- MODAL DETALLE -->
      <app-proveedor-detail-modal
        *ngIf="showDetailModal && selectedProveedor"
        [proveedor]="selectedProveedor"
        (onClose)="showDetailModal = false"
      ></app-proveedor-detail-modal>

      <!-- MODAL CONFIRMACION ELIMINAR -->
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

      <app-toast></app-toast>
    </div>
  `,
    styles: [`
    .proveedores-page-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
  `]
})
export class ProveedoresPage implements OnInit, OnDestroy {

    // All proveedores from service
    private _allProveedores: Proveedor[] = [];
    filteredProveedores: Proveedor[] = [];

    // Stats
    totalProveedores = 0;
    activosCount = 0;
    conCreditoCount = 0;

    // UI State
    searchQuery: string = '';
    filters = { estado: 'ALL' };
    showCreateModal = false;
    showDetailModal = false;
    showConfirmModal = false;
    selectedProveedor: Proveedor | null = null;

    // Loading
    isSaving = false;
    isDeleting = false;

    private destroy$ = new Subject<void>();

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
}

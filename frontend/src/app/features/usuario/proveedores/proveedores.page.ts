import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable, BehaviorSubject, combineLatest } from 'rxjs';

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
    changeDetection: ChangeDetectionStrategy.OnPush,
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
          *ngIf="stats$ | async as st"
          [total]="st.total"
          [active]="st.activos"
          [credit]="st.con_credito"
        ></app-proveedores-stats>

        <!-- 2. ACCIONES Y FILTROS -->
        <app-proveedores-actions
          [(searchQuery)]="searchQuery"
          (searchQueryChange)="onSearchTrigger()"
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
          <div class="restricted-card-premium">
            <div class="icon-lock-wrapper mb-4">
              <i class="bi bi-shield-lock-fill"></i>
            </div>
            <h2 class="fw-bold mb-2">Acceso Reservado</h2>
            <p class="text-muted mb-4 mx-auto" style="max-width: 450px;">
              No tienes permisos suficientes para gestionar el directorio de proveedores. 
              Contacta al administrador para solicitar el permiso <strong>PROVEEDORES_VER</strong>.
            </p>
            <button class="btn btn-retry" (click)="refreshData()">
              <i class="bi bi-arrow-clockwise me-2"></i> Reintentar sincronización
            </button>
          </div>
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
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; padding: 3rem; min-height: 70vh;
    }
    .restricted-card-premium {
      background: white; padding: 4rem 3rem; border-radius: 32px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;
      max-width: 600px; width: 100%;
    }
    .icon-lock-wrapper {
      width: 100px; height: 100px; background: #fee2e2; color: #ef4444; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 3rem;
      margin: 0 auto 1.5rem; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);
    }
    .btn-retry {
      background: #1e293b; color: white; border: none; padding: 1rem 2.5rem;
      border-radius: 100px; font-weight: 700; transition: all 0.2s; cursor: pointer;
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
    
    // Observables
    proveedores$: Observable<Proveedor[]>;
    stats$: Observable<any>;

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
    private filterTrigger$ = new BehaviorSubject<void>(void 0);
    private permissionsService = inject(PermissionsService);

    constructor(
        private proveedoresService: ProveedoresService,
        private uiService: UiService,
        private cdr: ChangeDetectorRef
    ) {
        this.proveedores$ = this.proveedoresService.proveedores$;
        this.stats$ = this.proveedoresService.stats$;
    }

    ngOnInit() {
        this.uiService.setPageHeader('Gestión de Proveedores', 'Administra el directorio de proveedores de tu empresa');
        this.proveedoresService.loadInitialData();

        combineLatest([
            this.proveedores$,
            this.filterTrigger$
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe(([proveedores]) => {
            this.filteredProveedores = this.applyFilters(proveedores);
            this.cdr.markForCheck();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onSearchTrigger() {
        this.filterTrigger$.next();
    }

    applyFilters(data: Proveedor[]): Proveedor[] {
        const query = this.searchQuery.toLowerCase();
        return data.filter(p => {
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
        this.filterTrigger$.next();
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
                this.cdr.markForCheck();
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
                this.cdr.markForCheck();
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
                this.cdr.markForCheck();
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
            this.cdr.markForCheck();
        }, 800);
    }
}

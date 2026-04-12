import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';

import { ProductosStatsComponent } from './components/productos-stats.component';
import { ProductosActionsComponent } from './components/productos-actions.component';
import { ProductosTableComponent } from './components/productos-table.component';
import { ProductosAnaliticaComponent } from './components/productos-analitica.component';

import { ProductoFormModalComponent } from './components/modals/producto-form-modal.component';
import { ProductoDetailModalComponent } from './components/modals/producto-detail-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

import { ProductosService } from './services/productos.service';
import { UiService } from '../../../shared/services/ui.service';
import { inject } from '@angular/core';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { PRODUCTOS_PERMISSIONS } from '../../../constants/permission-codes';
import { Producto, ProductoStats } from '../../../domain/models/producto.model';

@Component({
  selector: 'app-usuario-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductosStatsComponent,
    ProductosActionsComponent,
    ProductosTableComponent,
    ProductosAnaliticaComponent,
    ProductoFormModalComponent,
    ProductoDetailModalComponent,
    ConfirmModalComponent,
    ToastComponent
  ],
  template: `
    <div class="productos-page-container">
      
      <ng-container *ngIf="canView; else noPermission">
        <!-- TABS PRINCIPALES NAV -->
        <div class="main-tabs-wrapper">
          <div class="main-tabs">
            <button class="main-tab-btn" 
                    [class.active]="activeTab === 'catalogo'" 
                    (click)="activeTab = 'catalogo'">
              <i class="bi bi-box-seam"></i> Catálogo de Productos
            </button>
            <button class="main-tab-btn" 
                    [class.active]="activeTab === 'analitica'" 
                    (click)="activeTab = 'analitica'">
              <i class="bi bi-bar-chart-fill"></i> Analítica de Inventarios
            </button>
          </div>
        </div>

        <div class="view-section" *ngIf="activeTab === 'catalogo'">
          <!-- 1. ESTADÍSTICAS -->
          <app-productos-stats
            *ngIf="stats$ | async as st"
            [total]="st.total"
            [active]="st.activos"
            [sinStock]="st.sin_stock"
            [bajoStock]="st.bajo_stock"
          ></app-productos-stats>

          <!-- 2. ACCIONES Y FILTROS -->
          <app-productos-actions
            [(searchQuery)]="searchQuery"
            (onFilterChangeEmit)="handleFilters($event)"
            (onCreate)="openCreateModal()"
          ></app-productos-actions>

          <!-- 3. TABLA -->
          <app-productos-table
            [productos]="filteredProductos"
            (onAction)="handleAction($event)"
          ></app-productos-table>
        </div>

        <!-- 4. TAB: ANALÍTICA -->
        <div class="view-section" *ngIf="activeTab === 'analitica'">
          <app-productos-analitica></app-productos-analitica>
        </div>
      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container">
          <div class="restricted-card-premium">
            <div class="icon-lock-wrapper mb-4 mx-auto">
              <i class="bi bi-shield-lock-fill"></i>
            </div>
            <h2 class="fw-bold text-dark mb-2">Acceso Reservado</h2>
            <p class="text-muted mb-4 mx-auto" style="max-width: 450px;">
              Tu perfil actual no posee los privilegios necesarios para gestionar el catálogo de productos. 
              Contacta al administrador para solicitar el permiso <strong>PRODUCTOS_VER</strong>.
            </p>
            <button class="btn btn-retry" (click)="refreshData()">
              <i class="bi bi-arrow-clockwise me-2"></i> Reintentar acceso
            </button>
          </div>
        </div>
      </ng-template>

    </div>

    <!-- MODALS -->
    <app-producto-form-modal
      *ngIf="showCreateModal"
      [producto]="selectedProducto"
      [loading]="isSaving"
      (onSave)="saveProducto($event)"
      (onClose)="showCreateModal = false"
    ></app-producto-form-modal>

    <app-producto-detail-modal
      *ngIf="showDetailModal && selectedProducto"
      [producto]="selectedProducto"
      (onClose)="showDetailModal = false"
    ></app-producto-detail-modal>

    <app-confirm-modal
      *ngIf="showConfirmModal"
      title="Confirmar Eliminación"
      [message]="'¿Estás seguro de que deseas retirar \\'' + selectedProducto?.nombre + '\\' del catálogo? Esta acción no se puede deshacer.'"
      confirmText="Eliminar permanentemente"
      type="danger"
      icon="bi-trash3"
      [loading]="isDeleting"
      (onConfirm)="deleteProducto()"
      (onCancel)="showConfirmModal = false"
    ></app-confirm-modal>

    <app-toast></app-toast>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; width: 100%; overflow: hidden; min-height: 0; }
    .productos-page-container { flex: 1; display: flex; flex-direction: column; background: var(--bg-main, #ffffff); padding: 0; overflow: hidden; min-height: 0; gap: 24px; }

    /* Modern Tabs Layout */
    .main-tabs-wrapper { border-bottom: 2px solid #f1f5f9; margin-bottom: 0.5rem; }
    .main-tabs { display: flex; gap: 2.5rem; }
    .main-tab-btn {
      background: none; border: none; padding: 1rem 0.5rem; font-size: 0.95rem; font-weight: 800;
      color: #94a3b8; cursor: pointer; display: flex; align-items: center; gap: 0.75rem;
      border-bottom: 3px solid transparent; transition: all 0.2s; position: relative; bottom: -2px;
    }
    .main-tab-btn i { font-size: 1.1rem; }
    .main-tab-btn:hover { color: #64748b; }
    .main-tab-btn.active { color: #1e293b; border-bottom-color: #3b82f6; }

    .view-section { flex: 1; display: flex; flex-direction: column; gap: 24px; min-height: 0; }

    /* No Permission */
    .no-permission-container { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 3rem; }
    .restricted-card-premium { background: white; padding: 4rem 3rem; border-radius: 32px; box-shadow: 0 25px 50px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; text-align: center; }
    .icon-lock-wrapper {
      width: 100px; height: 100px; background: #fee2e2; color: #ef4444; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 3rem;
      margin-bottom: 1.5rem; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);
    }
    .btn-retry { background: #1e293b; color: white; border: none; padding: 1rem 2.5rem; border-radius: 100px; font-weight: 700; transition: all 0.2s; cursor: pointer; }
    .btn-retry:hover { transform: scale(1.05); background: #0f172a; }

    @media (max-width: 768px) { .main-tabs { gap: 1rem; } .main-tab-btn { font-size: 0.85rem; } }
  `]
})
export class ProductosPage implements OnInit, OnDestroy {
  get canView(): boolean {
    return this.permissionsService.hasPermission(PRODUCTOS_PERMISSIONS.VER);
  }

  activeTab: 'catalogo' | 'analitica' = 'catalogo';
  productos$: Observable<Producto[]>;
  stats$: Observable<ProductoStats | null>;

  filteredProductos: Producto[] = [];
  private _allProductos: Producto[] = [];

  searchQuery: string = '';
  filters = { tipo: 'ALL', estado: 'ALL', tipo_iva: 'ALL' };

  showCreateModal: boolean = false;
  showDetailModal: boolean = false;
  showConfirmModal: boolean = false;
  selectedProducto: Producto | null = null;

  isLoading: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;

  private destroy$ = new Subject<void>();
  private permissionsService = inject(PermissionsService);

  constructor(
    private productosService: ProductosService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {
    this.productos$ = this.productosService.productos$;
    this.stats$ = this.productosService.stats$;
  }

  ngOnInit() {
    this.uiService.setPageHeader('Catálogo de Productos', 'Gestión integral de inventario, servicios y analítica comercial');
    this.productosService.loadInitialData();

    this.productos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(productos => {
        this._allProductos = productos;
        this.applyFilters();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters() {
    this.filteredProductos = this._allProductos.filter(p => {
      const query = this.searchQuery.toLowerCase();
      const matchSearch = !query ||
        p.nombre.toLowerCase().includes(query) ||
        p.codigo.toLowerCase().includes(query);

      const matchTipo = this.filters.tipo === 'ALL' || p.tipo === this.filters.tipo;

      const matchEstado = this.filters.estado === 'ALL' ||
        (this.filters.estado === 'ACTIVO' && p.activo) ||
        (this.filters.estado === 'INACTIVO' && !p.activo);

      const matchIva = this.filters.tipo_iva === 'ALL' || p.tipo_iva === this.filters.tipo_iva;

      return matchSearch && matchTipo && matchEstado && matchIva;
    });
    this.cd.detectChanges();
  }

  handleFilters(filters: any) {
    this.filters = filters;
    this.applyFilters();
  }

  openCreateModal() {
    this.selectedProducto = null;
    this.showCreateModal = true;
  }

  handleAction(event: { type: string, producto: Producto }) {
    this.selectedProducto = event.producto;
    if (event.type === 'edit') {
      this.showCreateModal = true;
    } else if (event.type === 'delete') {
      this.showConfirmModal = true;
    } else if (event.type === 'view') {
      this.showDetailModal = true;
    }
  }

  saveProducto(data: any) {
    this.isSaving = true;
    const operation = this.selectedProducto
      ? this.productosService.updateProducto(this.selectedProducto.id, data)
      : this.productosService.createProducto(data);

    operation
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast(
            this.selectedProducto ? 'Producto actualizado' : 'Producto registrado exitosamente',
            'success'
          );
          this.showCreateModal = false;
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al guardar producto');
        }
      });
  }

  deleteProducto() {
    if (!this.selectedProducto) return;

    this.isDeleting = true;
    this.productosService.deleteProducto(this.selectedProducto.id)
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Producto eliminado correctamente', 'success');
          this.showConfirmModal = false;
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al eliminar');
        }
      });
  }

  refreshData() {
    this.isLoading = true;
    this.productosService.refresh();
    setTimeout(() => {
      this.isLoading = false;
      this.cd.detectChanges();
    }, 800);
  }
}

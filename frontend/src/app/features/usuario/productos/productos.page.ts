import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';

import { ProductoStatsComponent } from './components/producto-stats/producto-stats.component';
import { ProductoActionsComponent } from './components/producto-actions/producto-actions.component';
import { ProductoTableComponent } from './components/producto-table/producto-table.component';
import { CreateProductoModalComponent } from './components/create-producto-modal/create-producto-modal.component';
import { ProductoDetailModalComponent } from './components/producto-detail-modal/producto-detail-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ProductoAnaliticaComponent } from './components/producto-analitica/producto-analitica.component';

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
    ProductoStatsComponent,
    ProductoActionsComponent,
    ProductoTableComponent,
    CreateProductoModalComponent,
    ProductoDetailModalComponent,
    ConfirmModalComponent,
    ToastComponent,
    ProductoAnaliticaComponent
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
              <i class="bi bi-bar-chart-fill"></i> Analítica e Inventarios
            </button>
          </div>
        </div>

        <div class="view-section" *ngIf="activeTab === 'catalogo'">
          <!-- ESTADÍSTICAS (Sectional Cards) -->
          <app-producto-stats
            *ngIf="stats$ | async as st"
            [total]="st.total"
            [active]="st.activos"
            [sinStock]="st.sin_stock"
            [bajoStock]="st.bajo_stock"
          ></app-producto-stats>

          <!-- ACCIONES Y FILTROS -->
          <app-producto-actions
            [(searchQuery)]="searchQuery"
            (onFilterChangeEmit)="handleFilters($event)"
            (onCreate)="openCreateModal()"
          ></app-producto-actions>

          <!-- MAIN CONTENT TABLE -->
          <div class="table-minimal">
            <app-producto-table
              [productos]="filteredProductos"
              (onAction)="handleAction($event)"
            ></app-producto-table>
          </div>
        </div>

        <!-- TAB: ANALÍTICA -->
        <div class="view-section" *ngIf="activeTab === 'analitica'">
          <div class="analitica-section">
            <app-producto-analitica></app-producto-analitica>
          </div>
        </div>
      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container d-flex flex-row align-items-center justify-content-center text-center p-5 animate__animated animate__fadeIn" style="min-height: 70vh;">
          <div class="restricted-card-premium">
            <div class="icon-lock-wrapper mb-4 mx-auto">
              <i class="bi bi-shield-lock-fill"></i>
            </div>
            <h2 class="fw-bold text-dark mb-2">Acceso No Autorizado</h2>
            <p class="text-muted mb-4 mx-auto" style="max-width: 450px;">
              No posees los privilegios de seguridad necesarios para visualizar el catálogo de productos o realizar gestiones de inventario. 
              Por favor, solicita el permiso <strong>PRODUCTOS_VER</strong> a tu supervisor.
            </p>
            <button class="btn btn-primary-lux rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center gap-2 mx-auto" (click)="refreshData()">
              <i class="bi bi-arrow-clockwise"></i> Reintentar sincronización
            </button>
          </div>
        </div>
      </ng-template>

    </div>

    <!-- MODALS (Fuera del contenedor animado para evitar 'trapping' de posición fija) -->
    <app-create-producto-modal
      *ngIf="showCreateModal"
      [producto]="selectedProducto"
      [loading]="isSaving"
      (onSave)="saveProducto($event)"
      (onClose)="showCreateModal = false"
    ></app-create-producto-modal>

    <app-producto-detail-modal
      *ngIf="showDetailModal && selectedProducto"
      [producto]="selectedProducto"
      (onClose)="showDetailModal = false"
    ></app-producto-detail-modal>

    <app-confirm-modal
      *ngIf="showConfirmModal"
      title="Confirmar Eliminación"
      [message]="'¿Estás seguro de que deseas retirar \\'' + selectedProducto?.nombre + '\\' del catálogo? Esta acción no se puede revertir.'"
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
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      overflow: hidden;
      min-height: 0;
    }

    .productos-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 0;
    }

    .view-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-height: 0;
      overflow: hidden;
      animation: fadeIn 0.3s ease;
    }

    .table-minimal {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      background: transparent;
      border: none;
      border-radius: 0;
    }

    /* TABS STYLES - COPIED FROM CLIENTES */
    .main-tabs-wrapper {
      margin-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .main-tabs {
      display: flex;
      gap: 1.5rem;
    }
    .main-tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 0.5rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
    }
    .main-tab-btn i { font-size: 1.1rem; }
    .main-tab-btn:hover { color: #1e293b; }
    .main-tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .view-section {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      animation: fadeIn 0.3s ease;
    }

    .analitica-section { display: flex; flex-direction: column; gap: 0; }
    
    .toolbar-minimal {
      background: transparent;
    }

    .btn-refresh-minimal {
      background: white;
      border: 1px solid #e2e8f0;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
    }
    .btn-refresh-minimal:hover {
      background: #f8fafc;
      color: #161d35;
    }

    .table-minimal {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      overflow: visible;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .icon-lock-wrapper {
      width: 90px; height: 90px; background: #eff6ff; border: 1px solid #dbeafe;
      border-radius: 28px; display: flex; align-items: center; justify-content: center;
      font-size: 3rem; color: #3b82f6;
      box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.2);
    }

    .btn-primary-lux {
      background: #1e293b; color: white; border: none;
      transition: all 0.2s;
    }
    .btn-primary-lux:hover { background: #0f172a; transform: translateY(-2px); }

    .restricted-card-premium {
      background: white; padding: 3rem; border-radius: 32px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.05);
      border: 1px solid #f1f5f9;
    }
  `]
})
export class ProductosPage implements OnInit, OnDestroy {
  get canView(): boolean {
    return this.permissionsService.hasPermission(PRODUCTOS_PERMISSIONS.VER);
  }

  // Navigation State
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
    this.uiService.setPageHeader('Catálogo de Productos', 'Gestiona tus productos, servicios e inventarios');
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
            this.selectedProducto ? 'Producto actualizado' : 'Producto creado exitosamente',
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

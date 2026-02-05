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

import { ProductosService } from './services/productos.service';
import { UiService } from '../../../shared/services/ui.service';
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
    ToastComponent
  ],
  template: `
    <div class="productos-page-container">

      <div class="px-4 pb-5 animate-fade-in">
        <!-- ESTADÍSTICAS (Sectional Cards) -->
        <app-producto-stats
          *ngIf="stats$ | async as st"
          [total]="st.total"
          [active]="st.activos"
          [sinStock]="st.sin_stock"
          [bajoStock]="st.bajo_stock"
        ></app-producto-stats>

        <!-- TOOLBAR -->
        <div class="toolbar-lux my-4 glass-morphism p-3 rounded-4 d-flex align-items-center gap-3">
          <app-producto-actions
            class="flex-grow-1"
            [(searchQuery)]="searchQuery"
            (onFilterChangeEmit)="handleFilters($event)"
            (onCreate)="openCreateModal()"
          ></app-producto-actions>
          
          <button class="btn-refresh-lux shadow-sm" (click)="refreshData()" [class.spinning]="isLoading" title="Actualizar Datos">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>

        <!-- MAIN CONTENT TABLE -->
        <div class="table-lux shadow-premium-lg">
          <app-producto-table
            [productos]="filteredProductos"
            (onAction)="handleAction($event)"
          ></app-producto-table>
        </div>
      </div>

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
    .productos-page-container {
      min-height: 100vh;
      background: #f8fafc;
      overflow-x: hidden;
    }
    
    .header-premium {
      border-radius: 0 0 32px 32px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
    }

    .brand-icon-bg {
      width: 64px; height: 64px;
      background: #161d35;
      border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
    }
    
    .page-title {
      font-size: 2.25rem; font-weight: 900;
      color: #161d35; letter-spacing: -1px;
    }
    
    .badge-premium {
      background: rgba(22, 29, 53, 0.05);
      color: #161d35; padding: 0.4rem 0.85rem;
      border-radius: 10px; font-weight: 700; font-size: 0.75rem;
      letter-spacing: 0.5px;
    }

    .btn-refresh-lux {
      background: white; border: 1px solid #e2e8f0;
      width: 48px; height: 48px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; transition: all 0.3s;
      font-size: 1.25rem;
    }
    .btn-refresh-lux:hover {
      background: #161d35; color: white; transform: rotate(180deg);
      border-color: #161d35;
    }

    .table-lux { border-radius: 32px; overflow: visible; background: white; position: relative; z-index: 1; }

    .spinning i { animation: spin 0.8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
  `]
})
export class ProductosPage implements OnInit, OnDestroy {
  productos$: Observable<Producto[]>;
  stats$: Observable<ProductoStats | null>;

  filteredProductos: Producto[] = [];
  private _allProductos: Producto[] = [];

  searchQuery: string = '';
  filters = { tipo: 'ALL', estado: 'ALL' };

  showCreateModal: boolean = false;
  showDetailModal: boolean = false;
  showConfirmModal: boolean = false;
  selectedProducto: Producto | null = null;

  isLoading: boolean = false;
  isSaving: boolean = false;
  isDeleting: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private productosService: ProductosService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {
    this.productos$ = this.productosService.productos$;
    this.stats$ = this.productosService.stats$;
  }

  ngOnInit() {
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

      return matchSearch && matchTipo && matchEstado;
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

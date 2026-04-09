import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, finalize, Observable } from 'rxjs';

import { InventariosService } from './services/inventarios.service';
import { ProductosService } from '../productos/services/productos.service';
import { UiService } from '../../../shared/services/ui.service';
import { Producto } from '../../../domain/models/producto.model';
import { MovimientoInventario } from '../../../domain/models/inventario.model';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

// Modular components
import { InventarioStatsComponent } from './components/inventario-stats.component';
import { InventarioFiltersComponent } from './components/inventario-filters.component';
import { InventarioTableComponent } from './components/inventario-table.component';
import { InventarioFormComponent } from './components/inventario-form.component';
import { InventoryManagementComponent } from './components/inventory-management.component';

@Component({
  selector: 'app-inventarios',
  standalone: true,
  imports: [
    CommonModule,
    ToastComponent,
    ConfirmModalComponent,
    HasPermissionDirective,
    InventarioStatsComponent,
    InventarioFiltersComponent,
    InventarioTableComponent,
    InventarioFormComponent,
    InventoryManagementComponent
  ],
  template: `
    <div class="page-container">
      <!-- STATS KPI SECTION -->
      <app-inventario-stats [stats]="stats$ | async"></app-inventario-stats>

      <!-- TABS -->
      <div class="tabs-wrapper">
        <button class="tab-btn" [class.active]="activeTab === 'kardex'" (click)="activeTab = 'kardex'">
          <i class="bi bi-box-seam"></i> Kardex de Movimientos
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'inventario'" (click)="activeTab = 'inventario'">
          <i class="bi bi-boxes"></i> Gestión de Inventario
        </button>
      </div>

      <!-- TAB: MOVIMIENTOS (KARDEX) -->
      <div *ngIf="activeTab === 'kardex'" class="tab-content">
        <!-- FILTER BAR -->
        <app-inventario-filters
          [isLoading]="isLoading"
          (onFilter)="applyFilters($event)"
          (onCreate)="openCreateMovimientoModal()">
        </app-inventario-filters>

        <!-- TABLE SECTION -->
        <app-inventario-table
          [movimientos]="movimientos$ | async"
          (onDelete)="handleDeleteMovimiento($event)">
        </app-inventario-table>
      </div>

      <!-- TAB: GESTIÓN DE INVENTARIO -->
      <div *ngIf="activeTab === 'inventario'" class="tab-content">
        <app-inventory-management></app-inventory-management>
      </div>

      <!-- MODAL: NUEVO MOVIMIENTO -->
      <app-inventario-form
        #inventarioForm
        [show]="showMovimientoModal"
        [isSaving]="isSaving"
        [productos]="productos$ | async"
        (onClose)="closeMovimientoModal()"
        (onSave)="saveMovimiento($event)">
      </app-inventario-form>

      <app-confirm-modal
        *ngIf="showConfirmModal"
        [title]="confirmTitle"
        [message]="confirmMessage"
        confirmText="Confirmar Eliminación"
        type="danger"
        [loading]="isDeleting"
        (onConfirm)="confirmDelete()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .page-container { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
    .tabs-wrapper { display: flex; gap: 2rem; border-bottom: 2px solid #f1f5f9; margin-bottom: 1rem; }
    .tab-btn { background: none; border: none; padding: 1rem 0.5rem; color: #64748b; font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; }
    .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    .tab-btn i { margin-right: 0.5rem; }
    .tab-content { display: flex; flex-direction: column; }
    .maintenance-notice { text-align: center; padding: 4rem; color: #94a3b8; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1; }
    .maintenance-notice i { font-size: 3rem; margin-bottom: 1rem; display: block; }
  `]
})
export class InventariosPage implements OnInit, OnDestroy {
  @ViewChild('inventarioForm') inventarioForm!: InventarioFormComponent;

  movimientos$: Observable<MovimientoInventario[]>;
  stats$: Observable<any>;
  productos$: Observable<Producto[]> | undefined;

  activeTab: 'kardex' | 'inventario' = 'kardex';
  showMovimientoModal = false;
  showConfirmModal = false;
  
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  
  selectedMovimiento: MovimientoInventario | null = null;
  confirmTitle = '';
  confirmMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private inventariosService: InventariosService,
    private productosService: ProductosService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {
    this.movimientos$ = this.inventariosService.movimientos$;
    this.stats$ = this.inventariosService.stats$;
  }

  ngOnInit() {
    this.uiService.setPageHeader('Gestión de Inventarios (Kardex)', 'Control total de existencias, movimientos y valorización de inventario');
    this.productos$ = this.productosService.getActivos();
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(filtros: any = {}) {
    this.isLoading = true;
    this.inventariosService.loadInitialData(filtros);
    setTimeout(() => {
      this.isLoading = false;
      this.cd.detectChanges();
    }, 600);
  }

  applyFilters(filtros: any) {
    this.loadData(filtros);
  }

  openCreateMovimientoModal() {
    this.showMovimientoModal = true;
  }

  closeMovimientoModal() {
    this.showMovimientoModal = false;
    if (this.inventarioForm) {
      this.inventarioForm.reset();
    }
  }

  saveMovimiento(datos: any) {
    this.isSaving = true;
    this.inventariosService.createMovimiento(datos)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Movimiento registrado con éxito', 'success');
          this.closeMovimientoModal();
          this.inventariosService.getStats().subscribe();
        },
        error: (err) => this.uiService.showError(err, 'Error al registrar')
      });
  }

  handleDeleteMovimiento(mov: MovimientoInventario) {
    this.selectedMovimiento = mov;
    this.confirmTitle = 'Eliminar Movimiento';
    this.confirmMessage = '¿Está seguro de eliminar este registro del historial? Esta acción no se puede deshacer y puede afectar la trazabilidad.';
    this.showConfirmModal = true;
  }

  confirmDelete() {
    if (!this.selectedMovimiento) return;
    
    this.isDeleting = true;
    this.inventariosService.deleteMovimiento(this.selectedMovimiento.id)
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Movimiento eliminado', 'success');
          this.showConfirmModal = false;
          this.inventariosService.getStats().subscribe();
        },
        error: (err) => this.uiService.showError(err, 'Error')
      });
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { InventarioStockService, InventarioStock, StockResumen } from '../services/inventario-stock.service';
import { ProductosService } from '../../productos/services/productos.service';
import { UiService } from '../../../../shared/services/ui.service';
import { Producto } from '../../../../domain/models/producto.model';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';
import { InventoryStockTableComponent } from './inventory-stock-table.component';
import { InventoryStockFormComponent } from './inventory-stock-form.component';
import { StockResumenComponent } from './stock-resumen.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [
    CommonModule,
    ToastComponent,
    FormsModule,
    ConfirmModalComponent,
    InventoryStockTableComponent,
    InventoryStockFormComponent,
    StockResumenComponent
  ],
  template: `
    <div class="page-container">
      <!-- FILTER AND CREATE -->
      <div class="controls-section">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="Buscar por producto..." [(ngModel)]="searchTerm" class="search-input">
        </div>
        <button class="btn-primary" (click)="openCreateModal()" *ngIf="!showCreateModal">
          <i class="bi bi-plus-circle me-2"></i>Nuevo Registro
        </button>
      </div>

      <!-- TABLE -->
      <app-inventory-stock-table
        [inventarios]="inventarios$ | async"
        [searchTerm]="searchTerm"
        (onEdit)="handleEditInventario($event)"
        (onDelete)="handleDeleteInventario($event)">
      </app-inventory-stock-table>

      <!-- RESUMEN DE STOCK POR ESTADO -->
      <app-stock-resumen [resumen]="resumen$ | async"></app-stock-resumen>

      <!-- FORM MODAL -->
      <app-inventory-stock-form
        *ngIf="showCreateModal"
        [show]="showCreateModal"
        [isSaving]="isSaving"
        [editingId]="editingId"
        [productos]="productos$ | async"
        (onClose)="closeCreateModal()"
        (onSave)="saveInventario($event)">
      </app-inventory-stock-form>

      <!-- CONFIRM MODAL -->
      <app-confirm-modal
        *ngIf="showConfirmModal"
        [title]="'Eliminar Registro'"
        [message]="'¿Está seguro de eliminar este registro de inventario? Esta acción no se puede deshacer.'"
        confirmText="Eliminar"
        type="danger"
        [loading]="isDeleting"
        (onConfirm)="confirmDelete()"
        (onCancel)="showConfirmModal = false">
      </app-confirm-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .page-container { padding: 1rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .controls-section { display: flex; gap: 1rem; align-items: center; }
    .search-box { flex: 1; position: relative; display: flex; align-items: center; }
    .search-box i { position: absolute; left: 0.75rem; color: #94a3b8; }
    .search-input { width: 100%; padding: 0.75rem 0.75rem 0.75rem 2.5rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.875rem; }
    .search-input:focus { outline: none; border-color: #3b82f6; }
    .btn-primary { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3); }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 12px -1px rgba(37, 99, 235, 0.4); }
  `]
})
export class InventoryManagementComponent implements OnInit, OnDestroy {
  inventarios$: Observable<InventarioStock[]>;
  resumen$: Observable<StockResumen[]>;
  productos$: Observable<Producto[]> | undefined;

  showCreateModal = false;
  showConfirmModal = false;
  editingId: string | null = null;
  searchTerm = '';

  isSaving = false;
  isDeleting = false;

  selectedInventario: InventarioStock | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private inventarioStockService: InventarioStockService,
    private productosService: ProductosService,
    private uiService: UiService
  ) {
    this.inventarios$ = this.inventarioStockService.getInventarios();
    this.resumen$ = this.inventarioStockService.getResumen();
  }

  ngOnInit() {
    this.productos$ = this.productosService.getActivos();
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.inventarioStockService.listar().subscribe({
      error: (err) => this.uiService.showError(err, 'Error al cargar')
    });
    this.inventarioStockService.obtenerResumen().subscribe({
      error: (err) => this.uiService.showError(err, 'Error al cargar resumen')
    });
  }

  openCreateModal() {
    this.editingId = null;
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.editingId = null;
  }

  handleEditInventario(inventario: InventarioStock) {
    this.editingId = inventario.id;
    this.showCreateModal = true;
  }

  handleDeleteInventario(inventario: InventarioStock) {
    this.selectedInventario = inventario;
    this.showConfirmModal = true;
  }

  confirmDelete() {
    if (!this.selectedInventario) return;

    this.isDeleting = true;
    this.inventarioStockService.eliminar(this.selectedInventario.id).subscribe({
      next: () => {
        this.uiService.showToast('Registro eliminado', 'success');
        this.showConfirmModal = false;
        this.loadData();
      },
      error: (err) => {
        this.uiService.showError(err, 'Error al eliminar');
        this.isDeleting = false;
      },
      complete: () => this.isDeleting = false
    });
  }

  saveInventario(datos: any) {
    this.isSaving = true;

    const request = this.editingId
      ? this.inventarioStockService.actualizar(this.editingId, datos)
      : this.inventarioStockService.crear(datos);

    request.subscribe({
      next: () => {
        const msg = this.editingId ? 'Actualizado' : 'Creado';
        this.uiService.showToast(`Registro ${msg} correctamente`, 'success');
        this.closeCreateModal();
        this.loadData();
      },
      error: (err) => this.uiService.showError(err, 'Error'),
      complete: () => this.isSaving = false
    });
  }
}

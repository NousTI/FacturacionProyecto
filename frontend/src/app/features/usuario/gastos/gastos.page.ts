import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GastosService } from './services/gastos.service';
import { UiService } from '../../../shared/services/ui.service';
import { Gasto, GastoStats } from '../../../domain/models/gasto.model';
import { CategoriaGasto } from '../../../domain/models/categoria-gasto.model';
import { Proveedor } from '../../../domain/models/proveedor.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ConfirmModalComponent, ToastComponent],
  template: `
    <div class="page-container">
      <!-- Stats -->
      <div class="stats-row" *ngIf="stats$ | async as stats">
        <div class="stat-card">
          <div class="stat-label">Total Gastos</div>
          <div class="stat-value">{{ stats.total }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pendientes</div>
          <div class="stat-value">{{ stats.pendientes }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pagados</div>
          <div class="stat-value">{{ stats.pagados }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Monto Total</div>
          <div class="stat-value">\${{ stats.total_monto | number:'1.2-2' }}</div>
        </div>
      </div>

      <!-- Filtros y búsqueda -->
      <div class="filters-section">
        <input
          type="text"
          class="search-input"
          placeholder="Buscar por concepto, factura o proveedor..."
          [(ngModel)]="searchTerm"
          (input)="applyFilters()">
        <select class="filter-select" [(ngModel)]="filterEstado" (change)="applyFilters()">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          <option value="vencido">Vencido</option>
          <option value="cancelado">Cancelado</option>
          <option value="reembolsado">Reembolsado</option>
        </select>
        <select class="filter-select" [(ngModel)]="filterCategoria" (change)="applyFilters()">
          <option value="">Todas las categorías</option>
          <option *ngFor="let cat of categorias$ | async" [value]="cat.id">
            {{ cat.nombre }}
          </option>
        </select>
      </div>

      <div class="toolbar-minimal">
        <button class="btn-primary" (click)="openCreateModal()" *appHasPermission="'GASTOS_CREAR'">
          <i class="bi bi-plus-lg"></i> Nuevo Gasto
        </button>
        <button class="btn-refresh-minimal" (click)="refreshData()" [disabled]="isLoading">
          <i class="bi bi-arrow-clockwise" [class.spinning]="isLoading"></i>
        </button>
      </div>

      <div class="table-minimal">
        <table class="table">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Proveedor</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let gasto of filteredGastos$ | async">
              <td>{{ gasto.numero_factura || '-' }}</td>
              <td>{{ gasto.concepto }}</td>
              <td>{{ getCategoriaName(gasto.categoria_gasto_id) }}</td>
              <td>{{ getProveedorName(gasto.proveedor_id) || '-' }}</td>
              <td>\${{ gasto.total | number:'1.2-2' }}</td>
              <td>
                <span class="badge" [ngClass]="'badge-' + gasto.estado_pago">
                  {{ gasto.estado_pago }}
                </span>
              </td>
              <td>{{ gasto.fecha_emision | date:'short' }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-sm btn-info" (click)="handleEdit(gasto)" *appHasPermission="'GASTOS_EDITAR'" title="Editar">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn-sm btn-danger" (click)="handleDelete(gasto)" *appHasPermission="'GASTOS_ELIMINAR'" title="Eliminar">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!(filteredGastos$ | async)?.length">
              <td colspan="8" class="text-center text-muted">No hay gastos que coincidan con los filtros</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal crear/editar -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h5>{{ selectedGasto ? 'Editar Gasto' : 'Nuevo Gasto' }}</h5>
            <button class="btn-close" (click)="closeModal()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form" *ngIf="form">
              <div class="form-group">
                <label>Categoría de Gasto *</label>
                <select class="form-control" formControlName="categoria_gasto_id" required>
                  <option value="">Selecciona una categoría</option>
                  <option *ngFor="let cat of categorias$ | async" [value]="cat.id">
                    {{ cat.nombre }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Proveedor</label>
                <select class="form-control" formControlName="proveedor_id">
                  <option value="">Selecciona un proveedor</option>
                  <option *ngFor="let prov of proveedores$ | async" [value]="prov.id">
                    {{ prov.razon_social }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Número de Factura</label>
                <input type="text" class="form-control" formControlName="numero_factura" placeholder="Ej: FAC-2024-001">
              </div>
              <div class="form-group">
                <label>Concepto *</label>
                <input type="text" class="form-control" formControlName="concepto" required placeholder="Descripción del gasto">
              </div>
              <div class="form-group">
                <label>Fecha de Emisión *</label>
                <input type="date" class="form-control" formControlName="fecha_emision" required>
              </div>
              <div class="form-row">
                <div class="form-group half">
                  <label>Subtotal *</label>
                  <input type="number" class="form-control" formControlName="subtotal" step="0.01" required (change)="onSubtotalChange()">
                </div>
                <div class="form-group half">
                  <label>IVA</label>
                  <input type="number" class="form-control" formControlName="iva" step="0.01" (change)="onSubtotalChange()">
                </div>
              </div>
              <div class="form-group">
                <label>Total *</label>
                <input type="number" class="form-control" formControlName="total" step="0.01" required>
              </div>
              <div class="form-group">
                <label>Estado de Pago</label>
                <select class="form-control" formControlName="estado_pago">
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="vencido">Vencido</option>
                  <option value="cancelado">Cancelado</option>
                  <option value="reembolsado">Reembolsado</option>
                </select>
              </div>
              <div class="form-group">
                <label>Observaciones</label>
                <textarea class="form-control" formControlName="observaciones" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()" [disabled]="isSaving">Cancelar</button>
            <button class="btn btn-primary" (click)="saveGasto()" [disabled]="isSaving || !form?.valid">
              {{ isSaving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal eliminar -->
      <app-confirm-modal
        *ngIf="showConfirmModal && selectedGasto"
        title="Eliminar Gasto"
        [message]="'¿Estás seguro de que deseas eliminar este gasto (' + selectedGasto.numero_factura + ') por \$' + selectedGasto.total + '?'"
        confirmText="Eliminar"
        type="danger"
        [loading]="isDeleting"
        (onConfirm)="deleteGasto()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    .stat-card { background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; }
    .stat-label { color: #64748b; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.8rem; font-weight: 700; color: #161d35; }
    .filters-section { display: flex; gap: 1rem; flex-wrap: wrap; }
    .search-input, .filter-select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; font-size: 0.9rem; }
    .search-input { flex: 1; min-width: 200px; }
    .filter-select { min-width: 150px; }
    .toolbar-minimal { display: flex; gap: 1rem; }
    .btn-primary, .btn-refresh-minimal { padding: 0.5rem 1rem; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover { background: #2563eb; }
    .btn-refresh-minimal { background: white; border: 1px solid #e2e8f0; color: #64748b; }
    .btn-refresh-minimal:hover { background: #f8fafc; }
    .btn-refresh-minimal.spinning i { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .table-minimal { background: white; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden; }
    .table { margin: 0; width: 100%; }
    .table th { background: #f8fafc; padding: 1rem; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    .table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-sm { padding: 0.25rem 0.5rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
    .btn-info { background: #e0f2fe; color: #0369a1; }
    .btn-danger { background: #fee2e2; color: #dc2626; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 500; }
    .badge-pendiente { background: #fef3c7; color: #92400e; }
    .badge-pagado { background: #dcfce7; color: #166534; }
    .badge-vencido { background: #fee2e2; color: #991b1b; }
    .badge-cancelado { background: #e5e7eb; color: #374151; }
    .badge-reembolsado { background: #ddd6fe; color: #5b21b6; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 12px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; }
    .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h5 { margin: 0; font-weight: 600; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
    .modal-body { padding: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-row { display: flex; gap: 1rem; }
    .form-group.half { flex: 1; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-control { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
    .modal-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.5rem; }
    .btn { padding: 0.5rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
    .btn-secondary { background: #e2e8f0; color: #333; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .text-center { text-align: center; }
    .text-muted { color: #999; }
  `]
})
export class GastosPage implements OnInit, OnDestroy {
  gastos$: Observable<Gasto[]>;
  categorias$: Observable<CategoriaGasto[]>;
  proveedores$: Observable<Proveedor[]>;
  stats$: Observable<GastoStats | null>;
  filteredGastos$: Observable<Gasto[]>;

  showModal = false;
  showConfirmModal = false;
  selectedGasto: Gasto | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;

  form: FormGroup | null = null;
  searchTerm = '';
  filterEstado = '';
  filterCategoria = '';

  private destroy$ = new Subject<void>();
  private gastos: Gasto[] = [];
  private categorias: CategoriaGasto[] = [];
  private proveedores: Proveedor[] = [];
  private filter$ = new Subject<void>();

  constructor(
    private service: GastosService,
    private uiService: UiService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.gastos$ = this.service.gastos$;
    this.categorias$ = this.service.categorias$;
    this.proveedores$ = this.service.proveedores$;
    this.stats$ = this.service.stats$;
    this.filteredGastos$ = this.createFilteredObservable();
  }

  ngOnInit() {
    this.uiService.setPageHeader('Gastos', 'Registra y gestiona los gastos de tu empresa');
    this.service.loadInitialData();

    this.gastos$.pipe(takeUntil(this.destroy$)).subscribe(gastos => {
      this.gastos = gastos;
      this.applyFilters();
    });

    this.categorias$.pipe(takeUntil(this.destroy$)).subscribe(cats => {
      this.categorias = cats;
    });

    this.proveedores$.pipe(takeUntil(this.destroy$)).subscribe(provs => {
      this.proveedores = provs;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilteredObservable(): Observable<Gasto[]> {
    return this.filter$.asObservable().pipe(
      map(() => {
        let filtered = this.gastos;

        if (this.searchTerm) {
          const search = this.searchTerm.toLowerCase();
          filtered = filtered.filter(g =>
            g.concepto.toLowerCase().includes(search) ||
            (g.numero_factura && g.numero_factura.toLowerCase().includes(search)) ||
            (this.getProveedorName(g.proveedor_id)?.toLowerCase().includes(search))
          );
        }

        if (this.filterEstado) {
          filtered = filtered.filter(g => g.estado_pago === this.filterEstado);
        }

        if (this.filterCategoria) {
          filtered = filtered.filter(g => g.categoria_gasto_id === this.filterCategoria);
        }

        return filtered;
      })
    );
  }

  applyFilters() {
    this.filter$.next();
  }

  getCategoriaName(id: string): string {
    return this.categorias.find(c => c.id === id)?.nombre || 'N/A';
  }

  getProveedorName(id?: string): string | undefined {
    if (!id) return undefined;
    return this.proveedores.find(p => p.id === id)?.razon_social;
  }

  openCreateModal() {
    this.selectedGasto = null;
    this.form = this.fb.group({
      categoria_gasto_id: ['', Validators.required],
      proveedor_id: [''],
      numero_factura: [''],
      concepto: ['', Validators.required],
      fecha_emision: [new Date().toISOString().split('T')[0], Validators.required],
      fecha_vencimiento: [''],
      subtotal: [0, [Validators.required, Validators.min(0)]],
      iva: [0],
      total: [0, [Validators.required, Validators.min(0)]],
      estado_pago: ['pendiente'],
      observaciones: ['']
    });
    this.showModal = true;
  }

  handleEdit(gasto: Gasto) {
    this.openCreateModal();
    this.selectedGasto = gasto;
    this.form!.patchValue({
      ...gasto,
      fecha_emision: gasto.fecha_emision.split('T')[0],
      fecha_vencimiento: gasto.fecha_vencimiento ? gasto.fecha_vencimiento.split('T')[0] : ''
    });
    this.showModal = true;
  }

  handleDelete(gasto: Gasto) {
    this.selectedGasto = gasto;
    this.showConfirmModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.form = null;
    this.selectedGasto = null;
  }

  onSubtotalChange() {
    if (!this.form) return;
    const subtotal = this.form.get('subtotal')?.value || 0;
    const iva = this.form.get('iva')?.value || 0;
    this.form.get('total')?.setValue(subtotal + iva, { emitEvent: false });
  }

  saveGasto() {
    if (!this.form?.valid) return;

    this.isSaving = true;
    const operation = this.selectedGasto
      ? this.service.updateGasto(this.selectedGasto.id, this.form.value)
      : this.service.createGasto(this.form.value);

    operation
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast(
            this.selectedGasto ? 'Gasto actualizado' : 'Gasto registrado',
            'success'
          );
          this.closeModal();
          this.applyFilters();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al guardar');
        }
      });
  }

  deleteGasto() {
    if (!this.selectedGasto) return;

    this.isDeleting = true;
    this.service.deleteGasto(this.selectedGasto.id)
      .pipe(finalize(() => {
        this.isDeleting = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.uiService.showToast('Gasto eliminado', 'success');
          this.showConfirmModal = false;
          this.applyFilters();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al eliminar');
        }
      });
  }

  refreshData() {
    this.isLoading = true;
    this.service.refresh();
    setTimeout(() => {
      this.isLoading = false;
      this.applyFilters();
      this.cd.detectChanges();
    }, 800);
  }
}

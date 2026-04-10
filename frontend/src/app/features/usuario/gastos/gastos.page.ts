import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';

import { GastosService } from './services/gastos.service';
import { UiService } from '../../../shared/services/ui.service';
import { Gasto, GastoStats } from '../../../domain/models/gasto.model';
import { CategoriaGasto } from '../../../domain/models/categoria-gasto.model';
import { PagoGasto } from '../../../domain/models/pago-gasto.model';
import { Proveedor } from '../../../domain/models/proveedor.model';

// Shared Components
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

// Modular Components
import { EgresosStatsComponent } from './components/egresos-stats.component';
import { GastoFormComponent } from './components/gasto-form.component';
import { PagoFormComponent } from './components/pago-form.component';
import { CategoriaFormComponent } from './components/categoria-form.component';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HasPermissionDirective,
    ConfirmModalComponent,
    ToastComponent,
    EgresosStatsComponent,
    GastoFormComponent,
    PagoFormComponent,
    CategoriaFormComponent
  ],
  template: `
    <div class="page-container">
      
      <!-- Stats (Consolidated Component) -->
      <app-egresos-stats [stats]="stats$ | async"></app-egresos-stats>

      <!-- Tabs Navigation -->
      <div class="tabs-minimal mb-4">
        <button class="tab-btn" [class.active]="activeTab === 'general'" (click)="setTab('general')">
          <i class="bi bi-list-task"></i> Movimientos
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'pagos'" (click)="setTab('pagos')">
          <i class="bi bi-cash-stack"></i> Historial de Pagos
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'categorias'" (click)="setTab('categorias')">
          <i class="bi bi-tags"></i> Categorías
        </button>
      </div>

      <div [ngSwitch]="activeTab" class="tab-content">
        
        <!-- SECCIÓN 1: GASTOS GENERALES -->
        <div *ngSwitchCase="'general'" class="fade-in">
          <!-- Filtros -->
          <div class="filters-card mb-4">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="search-box">
                  <i class="bi bi-search"></i>
                  <input type="text" class="form-control" placeholder="Buscar concepto, factura o proveedor..." [(ngModel)]="searchTerm" (input)="applyFilters()">
                </div>
              </div>
              <div class="col-md-3">
                <select class="form-select" [(ngModel)]="filterEstado" (change)="applyFilters()">
                  <option value="">Todos los estados</option>
                  <option value="pendiente" class="text-warning">Pendiente</option>
                  <option value="pagado" class="text-success">Pagado</option>
                  <option value="vencido" class="text-danger">Vencido</option>
                </select>
              </div>
              <div class="col-md-3 d-flex gap-2">
                <button *hasPermission="'GASTOS_CREAR'" class="btn btn-primary w-100" (click)="openCreateGastoModal()">
                  <i class="bi bi-plus-lg me-2"></i> Nuevo Gasto
                </button>
                <button class="btn btn-light" (click)="refresh()" [disabled]="isLoading">
                  <i class="bi bi-arrow-clockwise" [class.spinning]="isLoading"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Tabla de Gastos -->
          <div class="table-responsive soft-card">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4">Factura</th>
                  <th>Concepto</th>
                  <th>Categoría</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th class="text-end pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let gasto of filteredGastos$ | async">
                  <td class="ps-4">
                    <span class="fw-bold">{{ gasto.numero_factura || 'S/N' }}</span>
                  </td>
                  <td>
                    <div class="d-flex flex-column">
                      <span class="fw-bold">{{ gasto.concepto }}</span>
                      <small class="text-muted">{{ getProveedorName(gasto.proveedor_id) }}</small>
                    </div>
                  </td>
                  <td><span class="badge badge-soft-info">{{ getCategoriaName(gasto.categoria_gasto_id) }}</span></td>
                  <td><span class="fw-bold text-dark">\${{ gasto.total | number:'1.2-2' }}</span></td>
                  <td><span class="badge" [ngClass]="'badge-' + gasto.estado_pago">{{ gasto.estado_pago }}</span></td>
                  <td>{{ gasto.fecha_emision | date:'shortDate' }}</td>
                  <td class="text-end pe-4">
                    <div class="action-buttons justify-content-end">
                      <ng-container *ngIf="gasto.estado_pago === 'pagado' && isGastoComplete(gasto); else editGastoBtn">
                        <button class="btn-action view" (click)="handleViewGasto(gasto)" title="Ver Detalles"><i class="bi bi-eye"></i></button>
                      </ng-container>
                      <ng-template #editGastoBtn>
                        <button *hasPermission="'GASTOS_EDITAR'" class="btn-action edit" (click)="handleEditGasto(gasto)" title="Editar"><i class="bi bi-pencil"></i></button>
                      </ng-template>

                      <ng-container *hasPermission="'PAGO_GASTO_CREAR'">
                        <button class="btn-action pay" *ngIf="gasto.estado_pago !== 'pagado'" (click)="handleQuickPay(gasto)" title="Registrar Pago"><i class="bi bi-cash"></i></button>
                      </ng-container>
                      <button *hasPermission="'GASTOS_ELIMINAR'" class="btn-action delete" (click)="handleDeleteGasto(gasto)" title="Eliminar"><i class="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="!(filteredGastos$ | async)?.length">
                  <td colspan="7" class="text-center py-5">
                    <div class="empty-state">
                      <i class="bi bi-search text-muted" style="font-size: 2rem;"></i>
                      <p class="mt-2 text-muted">No se encontraron egresos con los filtros aplicados</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECCIÓN 2: PAGOS -->
        <div *ngSwitchCase="'pagos'" class="fade-in">
          <div class="toolbar-minimal mb-3">
             <button *hasPermission="'PAGO_GASTO_CREAR'" class="btn btn-primary" (click)="openCreatePagoModal()">
                <i class="bi bi-plus-lg me-1"></i> Registrar Pago
              </button>
          </div>
          <div class="table-responsive soft-card">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4">Gasto / Factura</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th>Referencia</th>
                  <th class="text-end pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pago of pagos$ | async">
                  <td class="ps-4">
                    <div class="d-flex flex-column">
                      <span>{{ getGastoInfo(pago.gasto_id) }}</span>
                    </div>
                  </td>
                  <td><span class="fw-bold text-success">\${{ pago.monto | number:'1.2-2' }}</span></td>
                  <td>{{ pago.fecha_pago | date:'mediumDate' }}</td>
                  <td><span class="text-capitalize">{{ pago.metodo_pago }}</span></td>
                  <td><code class="text-muted">{{ pago.numero_referencia || '-' }}</code></td>
                  <td class="text-end pe-4">
                    <div class="action-buttons justify-content-end">
                      <ng-container *ngIf="getGastoStatus(pago.gasto_id) === 'pagado' && isPagoComplete(pago); else editPagoBtn">
                        <button class="btn-action view" (click)="handleViewPago(pago)" title="Ver Detalles"><i class="bi bi-eye"></i></button>
                      </ng-container>
                      <ng-template #editPagoBtn>
                        <button *hasPermission="'PAGO_GASTO_EDITAR'" class="btn-action edit" (click)="handleEditPago(pago)" title="Editar"><i class="bi bi-pencil"></i></button>
                      </ng-template>

                      <button *hasPermission="'PAGO_GASTO_ELIMINAR'" class="btn-action delete" (click)="handleDeletePago(pago)" title="Eliminar"><i class="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="!(pagos$ | async)?.length">
                  <td colspan="6" class="text-center py-5 text-muted small">No hay pagos registrados aún</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECCIÓN 3: CATEGORÍAS -->
        <div *ngSwitchCase="'categorias'" class="fade-in">
          <div class="toolbar-minimal mb-3">
             <button *hasPermission="'CATEGORIA_GASTO_CREAR'" class="btn btn-primary" (click)="openCreateCategoriaModal()">
                <i class="bi bi-plus-lg me-1"></i> Nueva Categoría
              </button>
          </div>
          <div class="table-responsive soft-card">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4">Código</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th class="text-end pe-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of categorias$ | async">
                  <td class="ps-4"><code>{{ cat.codigo }}</code></td>
                  <td><span class="fw-bold">{{ cat.nombre }}</span></td>
                  <td><span class="text-muted text-capitalize">{{ cat.tipo }}</span></td>
                  <td>
                    <span class="badge" [ngClass]="cat.activo ? 'badge-success' : 'badge-danger'">
                      {{ cat.activo ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                  <td class="text-end pe-4">
                    <div class="action-buttons justify-content-end">
                      <button *hasPermission="'CATEGORIA_GASTO_EDITAR'" class="btn-action edit" (click)="handleEditCategoria(cat)"><i class="bi bi-pencil"></i></button>
                      <button *hasPermission="'CATEGORIA_GASTO_ELIMINAR'" class="btn-action delete" (click)="handleDeleteCategoria(cat)"><i class="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- MODALES UNIFICADOS (Using Modular Components) -->
      
      <!-- Modal Gasto -->
      <div class="modal-overlay" *ngIf="showGastoModal" (click)="closeModals()">
        <div class="modal-content-container glass-modal" (click)="$event.stopPropagation()">
          <div class="modal-header border-0">
            <h5 class="fw-bold">{{ selectedGasto ? 'Editar Gasto' : 'Nuevo Gasto' }}</h5>
            <button class="btn-close" (click)="closeModals()"></button>
          </div>
          <div class="modal-body pt-0">
            <app-gasto-form 
            [editData]="selectedGasto" 
            [categorias]="categorias" 
            [proveedores]="proveedores"
            [loading]="isSaving"
            [viewOnly]="isViewOnlyGasto"
            (onSubmit)="saveGasto($event)" 
            (cancel)="showGastoModal = false"
          ></app-gasto-form>
          </div>
        </div>
      </div>

      <!-- Modal Pago -->
      <div class="modal-overlay" *ngIf="showPagoModal" (click)="closeModals()">
        <div class="modal-content-container glass-modal" (click)="$event.stopPropagation()">
          <div class="modal-header border-0">
            <h5 class="fw-bold">{{ selectedPago ? 'Editar Pago' : 'Registrar Pago' }}</h5>
            <button class="btn-close" (click)="closeModals()"></button>
          </div>
          <div class="modal-body pt-0">
            <app-pago-form 
            [editData]="selectedPago" 
            [selectedGasto]="selectedGastoForPay"
            [availableGastos]="gastosPendientes"
            [loading]="isSaving"
            [viewOnly]="isViewOnlyPago"
            (onSubmit)="savePago($event)" 
            (cancel)="showPagoModal = false"
          ></app-pago-form>
          </div>
        </div>
      </div>

      <!-- Modal Categoría -->
      <div class="modal-overlay" *ngIf="showCategoriaModal" (click)="closeModals()">
        <div class="modal-content-container glass-modal" (click)="$event.stopPropagation()">
          <div class="modal-header border-0">
            <h5 class="fw-bold">{{ selectedCategoria ? 'Editar Categoría' : 'Nueva Categoría' }}</h5>
            <button class="btn-close" (click)="closeModals()"></button>
          </div>
          <div class="modal-body pt-0">
            <app-categoria-form
              [editData]="selectedCategoria"
              [loading]="isSaving"
              (onSubmit)="saveCategoria($event)"
              (cancel)="closeModals()"
            ></app-categoria-form>
          </div>
        </div>
      </div>

      <app-toast></app-toast>
      
      <!-- Confirm Modal Generic -->
      <app-confirm-modal
        *ngIf="showConfirmModal"
        [title]="confirmTitle"
        [message]="confirmMessage"
        [type]="confirmType"
        (onConfirm)="executeDelete()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

    </div>
  `,
  styles: [`
    .page-container { animation: fadeIn 0.4s ease-out; }
    
    .soft-card { background: white; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); overflow: hidden; }
    
    .tabs-minimal { display: flex; gap: 0.5rem; border-bottom: 2px solid #f1f5f9; position: sticky; top: 0; background: #f8fafc; z-index: 10; padding-top: 0.5rem; }
    .tab-btn { background: none; border: none; padding: 0.75rem 1.25rem; cursor: pointer; color: #64748b; font-weight: 600; font-size: 0.9rem; border-radius: 10px 10px 0 0; border-bottom: 3px solid transparent; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
    .tab-btn:hover { background: #f1f5f9; color: #1e293b; }
    .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; background: white; }
    
    .filters-card { background: white; border-radius: 16px; padding: 1.25rem; border: 1px solid #f1f5f9; }
    .search-box { position: relative; }
    .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-box .form-control { padding-left: 2.5rem; border-radius: 10px; border-color: #e2e8f0; }
    
    .table th { padding: 1.25rem 1rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; border: none; }
    .table td { padding: 1.1rem 1rem; border-color: #f1f5f9; }
    
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-action { width: 34px; height: 34px; border: none; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; cursor: pointer; }
    .btn-action.edit { color: #6366f1; background: rgba(99, 102, 241, 0.1); }
    .btn-action.view { color: #0ea5e9; background: rgba(14, 165, 233, 0.1); }
    .btn-action.pay { color: #10b981; background: rgba(16, 185, 129, 0.1); }
    .btn-action.delete { background: #fef2f2; color: #ef4444; }
    .btn-action:hover { transform: scale(1.1); }
    
    .badge { padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 600; text-transform: capitalize; font-size: 0.75rem; }
    .badge-soft-info { background: #e0f2fe; color: #0369a1; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-pendiente { background: #fff7ed; color: #9a3412; }
    .badge-parcial { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }
    .badge-pagado { background: #f0fdf4; color: #166534; }
    .badge-vencido { background: #fef2f2; color: #991b1b; }
    
    .glass-modal { backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1050; animation: fadeIn 0.2s; }
    .modal-content-container { display: block; background: white; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-height: 90vh; overflow-y: auto; width: 95%; max-width: 700px; position: relative; }
    
    .spinning { animation: spin 1s linear infinite; display: inline-block; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class GastosPage implements OnInit, OnDestroy {
  activeTab: 'general' | 'pagos' | 'categorias' = 'general';

  // Observables
  gastos$: Observable<Gasto[]>;
  categorias$: Observable<CategoriaGasto[]>;
  pagos$: Observable<PagoGasto[]>;
  stats$: Observable<GastoStats | null>;
  filteredGastos$: Observable<Gasto[]>;

  // Data Local
  public gastos: Gasto[] = [];
  public categorias: CategoriaGasto[] = [];
  public proveedores: Proveedor[] = [];
  public gastosPendientes: Gasto[] = [];

  // Navigation State
  showGastoModal = false;
  showPagoModal = false;
  showCategoriaModal = false;
  showConfirmModal = false;

  // Selection
  selectedGasto: Gasto | null = null;
  selectedPago: PagoGasto | null = null;
  selectedCategoria: CategoriaGasto | null = null;
  selectedGastoForPay: Gasto | null = null;

  // View Mode States
  isViewOnlyGasto = false;
  isViewOnlyPago = false;
  
  // Generic UI State
  isLoading = false;
  isSaving = false;
  // Reactive Filter States
  private searchTerm$ = new BehaviorSubject<string>('');
  private filterEstado$ = new BehaviorSubject<string>('');
  
  confirmTitle = '';
  confirmMessage = '';
  confirmType: 'danger' | 'primary' | 'warning' = 'primary';
  deleteTarget: 'gasto' | 'pago' | 'categoria' = 'gasto';
  
  private destroy$ = new Subject<void>();

  constructor(
    private service: GastosService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {
    this.gastos$ = this.service.gastos$;
    this.categorias$ = this.service.categorias$;
    this.pagos$ = this.service.pagos$;
    this.stats$ = this.service.stats$;
    this.filteredGastos$ = this.createFilteredObservable();
  }

  ngOnInit() {
    this.uiService.setPageHeader('Administración de Egresos', 'Visión integral de gastos y flujo de caja');
    this.service.loadInitialData();
    
    // Subscripciones para data local (dropdowns, etc)
    this.gastos$.pipe(takeUntil(this.destroy$)).subscribe(g => {
      this.gastos = g;
      this.gastosPendientes = g.filter(x => x.estado_pago !== 'pagado');
      this.cd.markForCheck();
    });

    this.categorias$.pipe(takeUntil(this.destroy$)).subscribe(c => this.categorias = c);
    this.service.proveedores$.pipe(takeUntil(this.destroy$)).subscribe(p => this.proveedores = p);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- UI Methods ---
  setTab(tab: 'general' | 'pagos' | 'categorias') {
    this.activeTab = tab;
    if (tab === 'pagos') this.service.loadPagos();
    this.cd.detectChanges();
  }

  refresh() {
    this.isLoading = true;
    this.service.refresh();
    setTimeout(() => { this.isLoading = false; this.cd.detectChanges(); }, 600);
  }

  // Public getters/setters for template binding with reactive notification
  get searchTerm(): string { return this.searchTerm$.value; }
  set searchTerm(val: string) { this.searchTerm$.next(val); }

  get filterEstado(): string { return this.filterEstado$.value; }
  set filterEstado(val: string) { this.filterEstado$.next(val); }

  applyFilters() { 
    // Manual trigger no longer strictly needed with push-based BehaviorSubjects,
    // but kept for backward compatibility if called from template.
    this.cd.markForCheck();
  }

  isGastoComplete(g: Gasto): boolean {
    // Only consider the invoice number as a 'mandatory' missing field 
    // to keep the pencil icon visible for paid records.
    return !!g.numero_factura;
  }

  isPagoComplete(p: PagoGasto): boolean {
    // A payment is complete when all optional fields are filled
    return !!p.numero_referencia && !!p.numero_comprobante && !!p.observaciones;
  }

  getGastoStatus(id: string): string {
    return this.gastos.find(x => x.id === id)?.estado_pago || 'pendiente';
  }

  private createFilteredObservable(): Observable<Gasto[]> {
    return combineLatest([
      this.service.gastos$,
      this.searchTerm$,
      this.filterEstado$
    ]).pipe(
      map(([gastos, searchTerm, filterEstado]) => {
        let filtered = [...gastos];
        
        if (searchTerm) {
          const s = searchTerm.toLowerCase().trim();
          filtered = filtered.filter(g => 
            g.concepto.toLowerCase().includes(s) || 
            g.numero_factura?.toLowerCase().includes(s) ||
            this.getProveedorName(g.proveedor_id).toLowerCase().includes(s)
          );
        }
        
        if (filterEstado) {
          filtered = filtered.filter(g => g.estado_pago === filterEstado);
        }
        
        return filtered;
      }),
      tap(() => this.cd.markForCheck())
    );
  }

  // --- Helpers ---
  getCategoriaName(id: string): string {
    return this.categorias.find(c => c.id === id)?.nombre || 'S/N';
  }

  getProveedorName(id?: string): string {
    if (!id) return '';
    return this.proveedores.find(p => p.id === id)?.razon_social || '';
  }

  getGastoInfo(id: string): string {
    const g = this.gastos.find(x => x.id === id);
    return g ? `${g.concepto} (${g.numero_factura || 'S/N'})` : `Gasto #${id.substring(0,8)}`;
  }

  // --- Modal Openers ---
  openCreateGastoModal() { 
    this.selectedGasto = null; 
    this.isViewOnlyGasto = false;
    this.showGastoModal = true; 
  }

  handleEditGasto(g: Gasto) { 
    this.selectedGasto = g; 
    this.isViewOnlyGasto = false;
    this.showGastoModal = true; 
  }

  handleViewGasto(g: Gasto) {
    this.selectedGasto = g;
    this.isViewOnlyGasto = true;
    this.showGastoModal = true;
  }

  openCreatePagoModal() { 
    this.selectedPago = null; 
    this.selectedGastoForPay = null; 
    this.isViewOnlyPago = false;
    this.showPagoModal = true; 
  }

  handleEditPago(p: PagoGasto) { 
    this.selectedPago = p; 
    this.selectedGastoForPay = this.gastos.find(g => g.id === p.gasto_id) || null;
    this.isViewOnlyPago = false;
    this.showPagoModal = true; 
  }

  handleViewPago(p: PagoGasto) {
    this.selectedPago = p;
    this.selectedGastoForPay = this.gastos.find(g => g.id === p.gasto_id) || null;
    this.isViewOnlyPago = true;
    this.showPagoModal = true;
  }

  handleQuickPay(g: Gasto) {
    this.selectedGastoForPay = g;
    this.selectedPago = null;
    this.isViewOnlyPago = false;
    this.showPagoModal = true;
  }

  openCreateCategoriaModal() { this.selectedCategoria = null; this.showCategoriaModal = true; }

  handleEditCategoria(c: CategoriaGasto) { this.selectedCategoria = c; this.showCategoriaModal = true; }

  closeModals() {
    this.showGastoModal = this.showPagoModal = this.showCategoriaModal = false;
    this.selectedGasto = this.selectedPago = this.selectedCategoria = this.selectedGastoForPay = null;
  }

  // --- Save Actions ---
  saveGasto(data: any) {
    this.isSaving = true;
    const op = this.selectedGasto ? this.service.updateGasto(this.selectedGasto.id, data) : this.service.createGasto(data);
    op.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => { 
        this.uiService.showToast(this.selectedGasto ? 'Gasto actualizado' : 'Gasto registrado', 'success'); 
        this.closeModals(); 
      },
      error: (e) => this.uiService.showError(e)
    });
  }

  savePago(data: any) {
    this.isSaving = true;
    const op = this.selectedPago ? this.service.updatePago(this.selectedPago.id, data) : this.service.createPago(data);
    op.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: (p) => { 
        this.uiService.showToast('Pago procesado correctamente', 'success'); 
        this.closeModals();
        // Forzar recarga de para ver el estado del gasto actualizado
        this.service.refresh();
      },
      error: (e) => this.uiService.showError(e, 'Error al procesar pago')
    });
  }

  saveCategoria(data: any) {
    this.isSaving = true;
    const op = this.selectedCategoria ? this.service.updateCategoria(this.selectedCategoria.id, data) : this.service.createCategoria(data);
    op.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => { 
        this.uiService.showToast('Categoría guardada', 'success'); 
        this.closeModals(); 
      },
      error: (e) => this.uiService.showError(e)
    });
  }

  // --- Delete Logic ---
  handleDeleteGasto(g: Gasto) {
    this.selectedGasto = g; this.deleteTarget = 'gasto';
    this.confirmTitle = '¿Eliminar Gasto?';
    this.confirmMessage = `Esta acción eliminará el gasto "${g.concepto}" por $${g.total}. No se puede deshacer.`;
    this.confirmType = 'danger';
    this.showConfirmModal = true;
  }

  handleDeletePago(p: PagoGasto) {
    this.selectedPago = p; this.deleteTarget = 'pago';
    this.confirmTitle = '¿Anular Pago?';
    this.confirmMessage = `Se anulará el pago por $${p.monto}. El saldo del gasto volverá a aumentar.`;
    this.confirmType = 'warning';
    this.showConfirmModal = true;
  }

  handleDeleteCategoria(c: CategoriaGasto) {
    this.selectedCategoria = c; this.deleteTarget = 'categoria';
    this.confirmTitle = 'Eliminar Categoría';
    this.confirmMessage = `¿Seguro que deseas eliminar la categoría "${c.nombre}"? Esto solo será posible si no hay gastos asociados.`;
    this.confirmType = 'danger';
    this.showConfirmModal = true;
  }

  executeDelete() {
    this.showConfirmModal = false;
    let op: Observable<any>;
    if (this.deleteTarget === 'gasto' && this.selectedGasto) op = this.service.deleteGasto(this.selectedGasto.id);
    else if (this.deleteTarget === 'pago' && this.selectedPago) op = this.service.deletePago(this.selectedPago.id);
    else if (this.deleteTarget === 'categoria' && this.selectedCategoria) op = this.service.deleteCategoria(this.selectedCategoria.id);
    else return;

    op.subscribe({
      next: () => this.uiService.showToast('Registro eliminado con éxito', 'success'),
      error: (e) => this.uiService.showError(e, 'No se pudo completar la eliminación')
    });
  }
}

import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';

import { GastosService } from './services/gastos.service';
import { UiService } from '../../../shared/services/ui.service';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { GASTOS_PERMISSIONS } from '../../../constants/permission-codes';
import { Gasto, GastoStats } from '../../../domain/models/gasto.model';
import { CategoriaGasto } from '../../../domain/models/categoria-gasto.model';
import { PagoGasto } from '../../../domain/models/pago-gasto.model';
import { Proveedor } from '../../../domain/models/proveedor.model';

// Shared Components
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

// Modular Components
import { GastosStatsComponent } from './components/gastos-stats/gastos-stats.component';
import { GastosActionsComponent } from './components/gastos-actions/gastos-actions.component';
import { GastosTableComponent } from './components/gastos-table/gastos-table.component';
import { PagosTableComponent } from './components/pagos-table/pagos-table.component';
import { CategoriasTableComponent } from './components/categorias-table/categorias-table.component';
import { GastoFormComponent } from './components/gasto-form.component';
import { PagoFormComponent } from './components/pago-form.component';
import { CategoriaFormComponent } from './components/categoria-form.component';
import { PagosActionsComponent } from './components/pagos-actions/pagos-actions.component';
import { CategoriasActionsComponent } from './components/categorias-actions/categorias-actions.component';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HasPermissionDirective,
    ConfirmModalComponent,
    ToastComponent,
    GastosStatsComponent,
    GastosActionsComponent,
    PagosActionsComponent,
    CategoriasActionsComponent,
    GastosTableComponent,
    PagosTableComponent,
    CategoriasTableComponent,
    GastoFormComponent,
    PagoFormComponent,
    CategoriaFormComponent
  ],
  template: `
    <div class="page-container" style="display: flex; flex-direction: column; gap: 24px;">
      
      <ng-container *ngIf="canViewModule; else noPermission">
        <!-- Stats -->
        <app-gastos-stats *ngIf="canViewGeneral" [stats]="stats$ | async"></app-gastos-stats>

        <div class="main-content-card">
          <!-- Tabs Navigation -->
          <div class="tabs-minimal-premium">
            <button *ngIf="canViewGeneral" class="tab-btn" [class.active]="activeTab === 'general'" (click)="setTab('general')">
              <i class="bi bi-list-task"></i> Movimientos
            </button>
            <button *ngIf="canViewPagos" class="tab-btn" [class.active]="activeTab === 'pagos'" (click)="setTab('pagos')">
              <i class="bi bi-cash-stack"></i> Historial de Pagos
            </button>
            <button *ngIf="canViewCategorias" class="tab-btn" [class.active]="activeTab === 'categorias'" (click)="setTab('categorias')">
              <i class="bi bi-tags"></i> Categorías
            </button>
          </div>

          <div [ngSwitch]="activeTab" class="tab-content" style="padding-top: 1.5rem;">
            
            <!-- SECCIÓN 1: GASTOS GENERALES -->
            <div *ngSwitchCase="'general'" class="fade-in" style="display: flex; flex-direction: column; gap: 20px;">
              <ng-container *ngIf="canViewGeneral">
                <!-- Acciones y Filtros -->
                <app-gastos-actions 
                  [(searchQuery)]="searchTerm" 
                  [(filterEstado)]="filterEstado"
                  [(filterTipo)]="filterTipoGastos"
                  (onCreate)="openCreateGastoModal()"
                ></app-gastos-actions>

                <!-- Tabla de Gastos -->
                <app-gastos-table 
                  [gastos]="(filteredGastos$ | async) ?? []" 
                  [categorias]="categorias" 
                  [proveedores]="proveedores"
                  (onAction)="handleTableAction($event)"
                ></app-gastos-table>
              </ng-container>
            </div>

            <!-- SECCIÓN 2: PAGOS -->
            <div *ngSwitchCase="'pagos'" class="fade-in" style="display: flex; flex-direction: column; gap: 20px;">
              <ng-container *ngIf="canViewPagos">
                <!-- Acciones y Filtros Pagos -->
                <app-pagos-actions
                  [(searchQuery)]="searchTermPagos"
                  [(filterMetodo)]="filterMetodoPagos"
                  (onCreate)="openCreatePagoModal()"
                ></app-pagos-actions>
                
                <app-pagos-table 
                  [pagos]="(filteredPagos$ | async) ?? []" 
                  [gastos]="gastos"
                  (onAction)="handlePagoTableAction($event)"
                ></app-pagos-table>
              </ng-container>
            </div>

            <!-- SECCIÓN 3: CATEGORÍAS -->
            <div *ngSwitchCase="'categorias'" class="fade-in" style="display: flex; flex-direction: column; gap: 20px;">
              <ng-container *ngIf="canViewCategorias">
                <!-- Acciones y Filtros Categorías -->
                <app-categorias-actions
                  [(searchQuery)]="searchTermCategorias"
                  [(filterTipo)]="filterTipoCategorias"
                  [(filterActivo)]="filterActivoCategorias"
                  (onCreate)="openCreateCategoriaModal()"
                ></app-categorias-actions>

                <app-categorias-table 
                  [categorias]="(filteredCategorias$ | async) ?? []"
                  (onAction)="handleCatTableAction($event)"
                ></app-categorias-table>
              </ng-container>
            </div>

          </div>
        </div>
      </ng-container>

      <!-- TEMPLATE SIN PERMISO -->
      <ng-template #noPermission>
        <div class="no-permission-container d-flex flex-column align-items-center justify-content-center text-center p-5 animate-in" style="min-height: 70vh;">
          <div class="icon-lock-wrapper mb-4">
            <i class="bi bi-shield-lock-fill" style="font-size: 3.5rem;"></i>
          </div>
          <h2 class="fw-bold text-dark mb-2">Acceso Restringido</h2>
          <p class="text-muted mb-4 mx-auto" style="max-width: 450px;">
            No dispones de los permisos de visualización necesarios para este módulo de egresos. 
          </p>
          <button class="btn btn-primary rounded-pill px-5 py-3 fw-bold shadow-sm" (click)="refresh()">
            <i class="bi bi-arrow-clockwise me-2"></i> Reintentar sincronización
          </button>
        </div>
      </ng-template>

      <!-- MODALES -->
      
      <!-- Modal Gasto -->
      <div class="modal-overlay" *ngIf="showGastoModal" (click)="closeModals()">
        <div class="modal-content-container glass-modal" (click)="$event.stopPropagation()">
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

      <!-- Modal Pago -->
      <div class="modal-overlay" *ngIf="showPagoModal" (click)="closeModals()">
        <div class="modal-content-container glass-modal" (click)="$event.stopPropagation()">
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

      <!-- Modal Categoría -->
      <div class="modal-overlay" *ngIf="showCategoriaModal" (click)="closeModals()">
        <div class="modal-content-container glass-modal" (click)="$event.stopPropagation()">
          <app-categoria-form
            [editData]="selectedCategoria"
            [loading]="isSaving"
            (onSubmit)="saveCategoria($event)"
            (cancel)="closeModals()"
          ></app-categoria-form>
        </div>
      </div>

      <app-toast></app-toast>
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
    .main-content-card {
      background: white; border-radius: 24px; padding: 2rem; border: 1px solid var(--border-color);
    }

    .tabs-minimal-premium {
      display: flex; gap: 0.5rem; border-bottom: 2px solid var(--border-color); margin-bottom: 0.5rem;
    }
    .tab-btn {
      background: none; border: none; padding: 0.85rem 1.5rem; cursor: pointer;
      color: var(--text-muted); font-weight: 600; font-size: 0.95rem;
      border-radius: 12px 12px 0 0; border-bottom: 3px solid transparent;
      transition: all 0.2s; display: flex; align-items: center; gap: 0.6rem;
    }
    .tab-btn:hover { background: var(--status-neutral-bg); color: var(--text-main); }
    .tab-btn.active { color: var(--primary-color); border-bottom-color: var(--primary-color); background: var(--status-info-bg); }

    .btn-system-action {
      background: var(--primary-color); color: #ffffff; border: none;
      padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 600;
      font-size: 0.9rem; display: inline-flex; align-items: center; transition: all 0.2s;
    }
    .btn-system-action:hover { background: var(--primary-hover); transform: translateY(-1px); }

    .glass-modal { backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 1050; animation: fadeIn 0.2s; padding: 1rem; }
    .modal-content-container { display: flex; flex-direction: column; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-height: 90vh; width: 100%; max-width: 700px; position: relative; overflow: hidden; border: 1px solid var(--border-color); }

    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(185, 28, 28, 0.2); }
      70%  { box-shadow: 0 0 0 14px rgba(185, 28, 28, 0); }
      100% { box-shadow: 0 0 0 0 rgba(185, 28, 28, 0); }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .icon-lock-wrapper {
      width: 90px; height: 90px; background: var(--status-danger-bg);
      color: var(--status-danger-text); border-radius: 24px;
      display: flex; align-items: center; justify-content: center;
      animation: pulse-ring 2s ease-out infinite;
    }
    .fade-in { animation: fadeIn 0.3s ease-out; }
  `]

})
export class GastosPage implements OnInit, OnDestroy {
  // Permission Getters
  get canViewGeneral(): boolean {
    return this.permissionsService.hasPermission(GASTOS_PERMISSIONS.GESTIONAR);
  }
  get canViewPagos(): boolean {
    return this.permissionsService.hasPermission(GASTOS_PERMISSIONS.GESTIONAR_PAGOS);
  }
  get canViewCategorias(): boolean {
    return this.permissionsService.hasPermission(GASTOS_PERMISSIONS.GESTIONAR_CATEGORIA);
  }
  get canViewModule(): boolean {
    return this.canViewGeneral || this.canViewPagos || this.canViewCategorias;
  }

  activeTab: 'general' | 'pagos' | 'categorias' = 'general';

  // Observables
  gastos$: Observable<Gasto[]>;
  categorias$: Observable<CategoriaGasto[]>;
  pagos$: Observable<PagoGasto[]>;
  stats$: Observable<GastoStats | null>;
  filteredGastos$: Observable<Gasto[]>;
  filteredPagos$: Observable<PagoGasto[]>;
  filteredCategorias$: Observable<CategoriaGasto[]>;

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
  private filterTipoGastos$ = new BehaviorSubject<string>('');
  private searchTermPagos$ = new BehaviorSubject<string>('');
  private filterMetodoPagos$ = new BehaviorSubject<string>('');
  private searchTermCategorias$ = new BehaviorSubject<string>('');
  private filterTipoCategorias$ = new BehaviorSubject<string>('');
  private filterActivoCategorias$ = new BehaviorSubject<string>('ALL');
  
  confirmTitle = '';
  confirmMessage = '';
  confirmType: 'danger' | 'primary' | 'warning' = 'primary';
  deleteTarget: 'gasto' | 'pago' | 'categoria' = 'gasto';
  
  private destroy$ = new Subject<void>();
  private permissionsService = inject(PermissionsService);

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
    this.filteredPagos$ = this.createFilteredPagosObservable();
    this.filteredCategorias$ = this.createFilteredCategoriasObservable();
  }

  ngOnInit() {
    this.uiService.setPageHeader('Administración de Egresos', 'Visión integral de gastos y flujo de caja');
    
    // Set initial tab based on permissions
    if (!this.canViewGeneral) {
      if (this.canViewPagos) this.activeTab = 'pagos';
      else if (this.canViewCategorias) this.activeTab = 'categorias';
    }

    this.service.loadInitialData(false, {
      loadGastos: this.canViewGeneral || this.canViewPagos,
      loadCategorias: this.canViewGeneral || this.canViewCategorias,
      loadProveedores: this.canViewGeneral || this.canViewPagos || this.permissionsService.hasPermission('PROVEEDOR_VER')
    });

    if (this.canViewPagos) {
      this.service.loadPagos();
    }

    // Subscripciones para data local (dropdowns, etc)
    this.gastos$.pipe(takeUntil(this.destroy$)).subscribe(g => {
      this.gastos = g;
      this.gastosPendientes = g.filter(x => x.estado_pago !== 'pagado');
      setTimeout(() => this.cd.detectChanges());
    });

    this.categorias$.pipe(takeUntil(this.destroy$)).subscribe(c => {
      this.categorias = c;
      setTimeout(() => this.cd.detectChanges());
    });
    this.service.proveedores$.pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.proveedores = p;
      setTimeout(() => this.cd.detectChanges());
    });
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
    this.service.refresh({
      loadGastos: this.canViewGeneral || this.canViewPagos,
      loadCategorias: this.canViewGeneral || this.canViewCategorias,
      loadProveedores: this.canViewGeneral || this.canViewPagos || this.permissionsService.hasPermission('PROVEEDOR_VER'),
      loadPagos: this.canViewPagos
    });
    setTimeout(() => { this.isLoading = false; this.cd.detectChanges(); }, 600);
  }

  // Public getters/setters for template binding with reactive notification
  get searchTerm(): string { return this.searchTerm$.value; }
  set searchTerm(val: string) { this.searchTerm$.next(val); }

  get filterEstado(): string { return this.filterEstado$.value; }
  set filterEstado(val: string) { this.filterEstado$.next(val); }

  get filterTipoGastos(): string { return this.filterTipoGastos$.value; }
  set filterTipoGastos(val: string) { this.filterTipoGastos$.next(val); }

  get searchTermPagos(): string { return this.searchTermPagos$.value; }
  set searchTermPagos(val: string) { this.searchTermPagos$.next(val); }

  get filterMetodoPagos(): string { return this.filterMetodoPagos$.value; }
  set filterMetodoPagos(val: string) { this.filterMetodoPagos$.next(val); }

  get searchTermCategorias(): string { return this.searchTermCategorias$.value; }
  set searchTermCategorias(val: string) { this.searchTermCategorias$.next(val); }

  get filterTipoCategorias(): string { return this.filterTipoCategorias$.value; }
  set filterTipoCategorias(val: string) { this.filterTipoCategorias$.next(val); }

  get filterActivoCategorias(): string { return this.filterActivoCategorias$.value; }
  set filterActivoCategorias(val: string) { this.filterActivoCategorias$.next(val); }

  // --- Event Handlers for Modular Components ---
  handleTableAction(event: any) {
    switch(event.type) {
      case 'view': this.handleViewGasto(event.data); break;
      case 'edit': this.handleEditGasto(event.data); break;
      case 'delete': this.handleDeleteGasto(event.data); break;
      case 'pay': this.handleQuickPay(event.data); break;
    }
  }

  handlePagoTableAction(event: any) {
    switch(event.type) {
      case 'view': this.handleViewPago(event.data); break;
      case 'edit': this.handleEditPago(event.data); break;
      case 'delete': this.handleDeletePago(event.data); break;
    }
  }

  handleCatTableAction(event: any) {
    switch(event.type) {
      case 'edit': this.handleEditCategoria(event.data); break;
      case 'delete': this.handleDeleteCategoria(event.data); break;
    }
  }

  private createFilteredObservable(): Observable<Gasto[]> {
    return combineLatest([
      this.service.gastos$,
      this.searchTerm$,
      this.filterEstado$,
      this.filterTipoGastos$,
      this.service.categorias$
    ]).pipe(
      map(([gastos, searchTerm, filterEstado, filterTipo, categorias]) => {
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

        if (filterTipo) {
          filtered = filtered.filter(g => {
            const cat = categorias.find(c => c.id === g.categoria_gasto_id);
            return cat?.tipo === filterTipo;
          });
        }
        
        return filtered;
      }),
      tap(() => this.cd.markForCheck())
    );
  }

  private createFilteredPagosObservable(): Observable<PagoGasto[]> {
    return combineLatest([
      this.service.pagos$,
      this.searchTermPagos$,
      this.filterMetodoPagos$
    ]).pipe(
      map(([pagos, searchTerm, filterMetodo]) => {
        let filtered = [...pagos];
        
        if (searchTerm) {
          const s = searchTerm.toLowerCase().trim();
          filtered = filtered.filter(p => {
            const gastoInfo = this.getGastoInfo(p.gasto_id).toLowerCase();
            return p.numero_referencia?.toLowerCase().includes(s) || gastoInfo.includes(s);
          });
        }
        
        if (filterMetodo) {
          filtered = filtered.filter(p => p.metodo_pago === filterMetodo);
        }
        
        return filtered;
      }),
      tap(() => this.cd.markForCheck())
    );
  }

  private createFilteredCategoriasObservable(): Observable<CategoriaGasto[]> {
    return combineLatest([
      this.service.categorias$,
      this.searchTermCategorias$,
      this.filterTipoCategorias$,
      this.filterActivoCategorias$
    ]).pipe(
      map(([categorias, searchTerm, filterTipo, filterActivo]) => {
        let filtered = [...categorias];
        
        if (searchTerm) {
          const s = searchTerm.toLowerCase().trim();
          filtered = filtered.filter(c => c.nombre.toLowerCase().includes(s));
        }

        if (filterTipo) {
          filtered = filtered.filter(c => c.tipo === filterTipo);
        }

        if (filterActivo !== 'ALL') {
          const isActive = filterActivo === 'true';
          filtered = filtered.filter(c => c.activo === isActive);
        }
        
        return filtered;
      }),
      tap(() => this.cd.markForCheck())
    );
  }

  getGastoInfo(id: string): string {
    const g = this.gastos.find(x => x.id === id);
    return g ? `${g.concepto} (${g.numero_factura || 'S/N'})` : `Gasto #${id.substring(0,8)}`;
  }

  getProveedorName(id?: string): string {
    if (!id) return '';
    return this.proveedores.find(p => p.id === id)?.razon_social || '';
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
    this.cd.detectChanges();
  }

  handleViewGasto(g: Gasto) {
    this.selectedGasto = g;
    this.isViewOnlyGasto = true;
    this.showGastoModal = true;
    this.cd.detectChanges();
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
    this.cd.detectChanges();
  }

  handleViewPago(p: PagoGasto) {
    this.selectedPago = p;
    this.selectedGastoForPay = this.gastos.find(g => g.id === p.gasto_id) || null;
    this.isViewOnlyPago = true;
    this.showPagoModal = true;
    this.cd.detectChanges();
  }

  handleQuickPay(g: Gasto) {
    this.selectedGastoForPay = g;
    this.selectedPago = null;
    this.isViewOnlyPago = false;
    this.showPagoModal = true;
    this.cd.detectChanges();
  }

  openCreateCategoriaModal() { this.selectedCategoria = null; this.showCategoriaModal = true; this.cd.detectChanges(); }

  handleEditCategoria(c: CategoriaGasto) { this.selectedCategoria = c; this.showCategoriaModal = true; this.cd.detectChanges(); }

  closeModals() {
    this.showGastoModal = this.showPagoModal = this.showCategoriaModal = false;
    this.selectedGasto = this.selectedPago = this.selectedCategoria = this.selectedGastoForPay = null;
    this.isViewOnlyGasto = false;
    this.isViewOnlyPago = false;
  }

  // --- Save Actions ---
  saveGasto(data: any) {
    this.isSaving = true;
    this.cd.detectChanges();
    const op = this.selectedGasto ? this.service.updateGasto(this.selectedGasto.id, data) : this.service.createGasto(data);
    op.pipe(finalize(() => { this.isSaving = false; this.cd.detectChanges(); })).subscribe({
      next: () => { 
        this.uiService.showToast(this.selectedGasto ? 'Gasto actualizado' : 'Gasto registrado', 'success'); 
        this.closeModals(); 
      },
      error: (e) => this.uiService.showError(e)
    });
  }

  savePago(data: any) {
    this.isSaving = true;
    this.cd.detectChanges();
    const op = this.selectedPago ? this.service.updatePago(this.selectedPago.id, data) : this.service.createPago(data);
    op.pipe(finalize(() => { this.isSaving = false; this.cd.detectChanges(); })).subscribe({
      next: (p) => { 
        this.uiService.showToast('Pago procesado correctamente', 'success'); 
        this.closeModals();
        // Forzar recarga de para ver el estado del gasto actualizado
        this.refresh();
      },
      error: (e) => this.uiService.showError(e, 'Error al procesar pago')
    });
  }

  saveCategoria(data: any) {
    this.isSaving = true;
    this.cd.detectChanges();
    const op = this.selectedCategoria ? this.service.updateCategoria(this.selectedCategoria.id, data) : this.service.createCategoria(data);
    op.pipe(finalize(() => { this.isSaving = false; this.cd.detectChanges(); })).subscribe({
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
      next: () => {
        this.uiService.showToast('Registro eliminado con éxito', 'success');
        this.cd.detectChanges();
      },
      error: (e) => this.uiService.showError(e, 'No se pudo completar la eliminación')
    });
  }
}

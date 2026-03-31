import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';

// Services
import { CuentasPagarService } from './services/cuentas-pagar.service';
import { UiService } from '../../../shared/services/ui.service';

// Models
import { 
  CuentasPagarOverview, ReporteGastosCategoria, 
  GastoProveedorDetalle, ReporteFlujoCaja, CuentasPagarFiltros 
} from '../../../domain/models/cuentas-pagar.model';

// Components
import { CuentasPagarResumenComponent } from './components/cuentas-pagar-resumen.component';
import { GastosCategoriaComponent } from './components/gastos-categoria.component';
import { GastosProveedorComponent } from './components/gastos-proveedor.component';
import { FlujoCajaComponent } from './components/flujo-caja.component';

@Component({
  selector: 'app-cuentas-pagar',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CuentasPagarResumenComponent,
    GastosCategoriaComponent,
    GastosProveedorComponent,
    FlujoCajaComponent
  ],
  template: `
    <div class="page-container p-3">
      <!-- FILTROS -->
      <div class="d-flex flex-wrap justify-content-end align-items-center gap-2 mb-3 bg-light p-2 rounded-3 shadow-sm border border-white">
        <!-- Rango de Fechas -->
        <div class="d-flex align-items-center bg-white px-2 rounded-2 border">
            <i class="bi bi-calendar-range text-muted small me-1"></i>
            <input type="date" class="form-control form-control-sm border-0 shadow-none ps-1" 
                   [(ngModel)]="filtros.fecha_inicio" (change)="cargarDatosModuloActivo()" 
                   style="font-size: 0.8rem; height: 31px; width: 120px;">
            <span class="text-muted px-1">-</span>
            <input type="date" class="form-control form-control-sm border-0 shadow-none ps-1" 
                   [(ngModel)]="filtros.fecha_fin" (change)="cargarDatosModuloActivo()" 
                   style="font-size: 0.8rem; height: 31px; width: 120px;">
        </div>

        <button class="btn btn-primary btn-sm rounded-2 px-3 shadow-none border-0" 
                (click)="cargarDatosModuloActivo()" [disabled]="loading" style="height: 31px;">
          <i class="bi bi-arrow-clockwise" [class.spin]="loading"></i>
        </button>
      </div>

      <!-- TABS -->
      <div class="tabs-slider d-flex gap-3 mb-4 overflow-auto pb-2 border-bottom">
        <button *ngFor="let tab of tabs" 
                (click)="!tab.disabled && cambiarTab(tab.id)"
                class="tab-btn btn border-0 rounded-pill px-4 py-2 fw-medium text-nowrap"
                [class.active]="activeTab === tab.id"
                [class.disabled]="tab.disabled"
                [style.opacity]="tab.disabled ? '0.5' : '1'"
                [style.cursor]="tab.disabled ? 'not-allowed' : 'pointer'">
          <i [class]="tab.icon + ' me-2'"></i>{{ tab.label }}
          <span *ngIf="tab.disabled" class="badge bg-secondary ms-2 small" style="font-size: 0.6rem;">Próximamente</span>
        </button>
      </div>

      <!-- STATES -->
      <div *ngIf="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
        <div class="spinner-grow text-corporate" role="status" style="width: 3rem; height: 3rem;"></div>
        <span class="text-muted mt-3 small fw-medium">Procesando información financiera...</span>
      </div>

      <div *ngIf="error && !loading" class="alert alert-danger border-0 rounded-4 shadow-sm p-4 text-center">
         <i class="bi bi-exclamation-octagon fs-1 d-block mb-3"></i>
         <h6 class="fw-bold">Error al cargar el módulo</h6>
         <p class="small mb-3 text-break">{{ error }}</p>
         <button class="btn btn-outline-danger rounded-pill px-4" (click)="cargarDatosModuloActivo()">Intentar de Nuevo</button>
      </div>

      <!-- CONTENT -->
      <div class="tab-content" *ngIf="!loading && !error">
        <div *ngIf="activeTab === 'resumen'">
          <app-cuentas-pagar-resumen [overview]="overviewData"></app-cuentas-pagar-resumen>
        </div>
        <div *ngIf="activeTab === 'categoria'">
          <app-gastos-categoria [data]="categoriaData"></app-gastos-categoria>
        </div>
        <div *ngIf="activeTab === 'proveedor'">
          <app-gastos-proveedor [data]="proveedorData"></app-gastos-proveedor>
        </div>
        <div *ngIf="activeTab === 'flujo'">
          <app-flujo-caja [data]="flujoData" (agrupacionChange)="onAgrupacionChange($event)"></app-flujo-caja>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-btn {
      color: #64748b;
      background: #f1f5f9;
      transition: all 0.3s ease;
    }
    .tab-btn:hover { background: #e2e8f0; color: #1e293b; }
    .tab-btn.active {
      background: #161d35;
      color: white;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class CuentasPagarPage implements OnInit {
  loading = false;
  error: string | null = null;
  activeTab = 'resumen';
  
  filtros: CuentasPagarFiltros = {
    fecha_fin: new Date().toISOString().split('T')[0],
    fecha_inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    agrupacion: 'week'
  };

  overviewData: CuentasPagarOverview | null = null;
  categoriaData: ReporteGastosCategoria | null = null;
  proveedorData: GastoProveedorDetalle[] = [];
  flujoData: ReporteFlujoCaja | null = null;

  tabs = [
    { id: 'resumen', label: 'Resumen AP', icon: 'bi bi-pie-chart-fill' },
    { id: 'categoria', label: 'Por Categoría', icon: 'bi bi-tags-fill' },
    { id: 'proveedor', label: 'Por Proveedor', icon: 'bi bi-truck', disabled: true },
    { id: 'flujo', label: 'Flujo de Caja', icon: 'bi bi-graph-up-arrow' }
  ];

  constructor(
    private service: CuentasPagarService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.uiService.setPageHeader('Cuentas por Pagar', 'Análisis de gastos y compromisos');
    this.cargarDatosModuloActivo();
  }

  cambiarTab(tabId: string) {
    this.activeTab = tabId;
    this.cargarDatosModuloActivo();
  }

  onAgrupacionChange(agrup: string) {
    this.filtros.agrupacion = agrup;
    this.cargarFlujo();
  }

  cargarDatosModuloActivo() {
    switch (this.activeTab) {
      case 'resumen': this.cargarResumen(); break;
      case 'categoria': this.cargarCategoria(); break;
      case 'proveedor': this.cargarProveedor(); break;
      case 'flujo': this.cargarFlujo(); break;
    }
  }

  private cargarResumen() {
    this.iniciarCarga();
    this.service.getResumen().pipe(finalize(() => this.finalizarCarga()))
      .subscribe({
        next: (res) => this.overviewData = res,
        error: (err) => this.manejarError(err)
      });
  }

  private cargarCategoria() {
    this.iniciarCarga();
    this.service.getGastosPorCategoria(this.filtros).pipe(finalize(() => this.finalizarCarga()))
      .subscribe({
        next: (res) => this.categoriaData = res,
        error: (err) => this.manejarError(err)
      });
  }

  private cargarProveedor() {
    this.iniciarCarga();
    this.service.getGastosPorProveedor(this.filtros).pipe(finalize(() => this.finalizarCarga()))
      .subscribe({
        next: (res) => this.proveedorData = res,
        error: (err) => this.manejarError(err)
      });
  }

  private cargarFlujo() {
    this.iniciarCarga();
    this.service.getFlujoCaja(this.filtros).pipe(finalize(() => this.finalizarCarga()))
      .subscribe({
        next: (res) => this.flujoData = res,
        error: (err) => this.manejarError(err)
      });
  }

  private iniciarCarga() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();
  }

  private finalizarCarga() {
    this.loading = false;
    this.cdr.detectChanges();
  }

  private manejarError(err: any) {
    console.error('Error loading Accounts Payable data:', err);
    this.error = err.error?.message || 'Error de conexión con el servidor. Intente más tarde.';
  }
}

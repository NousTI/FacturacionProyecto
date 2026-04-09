import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin, BehaviorSubject } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';

// Services
import { CuentasCobrarService } from './services/cuentas-cobrar.service';
import { UiService } from '../../../shared/services/ui.service';

// Models
import { 
  CuentasCobrarOverview, AntiguedadCliente, 
  ClienteMoroso, HistorialPago, ProyeccionCobro,
  CuentasCobrarFiltros
} from '../../../domain/models/cuentas-cobrar.model';

// Components
import { CuentasCobrarResumenComponent } from './components/cuentas-cobrar-resumen.component';
import { CuentasCobrarAntiguedadComponent } from './components/cuentas-cobrar-antiguedad.component';
import { CuentasCobrarMorososComponent } from './components/cuentas-cobrar-morosos.component';
import { CuentasCobrarPagosComponent } from './components/cuentas-cobrar-pagos.component';
import { CuentasCobrarProyeccionComponent } from './components/cuentas-cobrar-proyeccion.component';

@Component({
  selector: 'app-cuentas-cobrar',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CuentasCobrarResumenComponent,
    CuentasCobrarAntiguedadComponent,
    CuentasCobrarMorososComponent,
    CuentasCobrarPagosComponent,
    CuentasCobrarProyeccionComponent
  ],
  template: `
    <div class="page-container p-3">
      <!-- CABECERA CON TABS Y FILTROS -->
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 border-bottom pb-2">
        <!-- TABS NAVIGATION -->
        <div *ngIf="tabs.length > 1" class="tabs-slider d-flex gap-2">
          <button *ngFor="let tab of tabs" 
                  (click)="activeTab = tab.id"
                  class="tab-btn btn border-0 rounded-pill px-3 py-2 fw-medium text-nowrap"
                  [class.active]="activeTab === tab.id"
                  style="font-size: 0.85rem;">
            <i [class]="tab.icon + ' me-2'"></i>{{ tab.label }}
          </button>
        </div>

        <!-- FILTRO GLOBAL (FECHA DE CORTE Y RECARGA) -->
        <div class="d-flex align-items-center gap-2" *ngIf="activeTab !== 'pagos'">
          <div class="d-flex align-items-center bg-white px-2 rounded-2 border shadow-sm">
            <i class="bi bi-calendar3 text-muted small me-1"></i>
            <input type="date" class="form-control form-control-sm border-0 shadow-none ps-1" 
                   [(ngModel)]="filtros.fecha_corte" (change)="cargarDatos()" 
                   style="font-size: 0.8rem; height: 31px;">
          </div>
          <button class="btn btn-primary btn-sm rounded-pill px-3 shadow-sm border-0" 
                  (click)="cargarDatos()" [disabled]="loading" style="height: 31px;" title="Actualizar">
            <i class="bi bi-arrow-clockwise" [class.spin]="loading"></i>
          </button>
        </div>

        <!-- FILTROS POR RANGO DE FECHAS (EXCLUSIVO HISTORIAL) -->
        <div class="d-flex align-items-center gap-2" *ngIf="activeTab === 'pagos'">
          <div class="d-flex align-items-center bg-white px-2 rounded-2 border shadow-sm">
            <span class="text-muted small me-1 fw-medium" style="font-size: 0.75rem;">Desde:</span>
            <input type="date" class="form-control form-control-sm border-0 shadow-none px-1" 
                   [(ngModel)]="filtros.fecha_inicio" (change)="cargarDatosSecundarios()" 
                   style="font-size: 0.8rem; height: 31px;">
            <div class="vr bg-secondary opacity-25 mx-1" style="height: 20px;"></div>
            <span class="text-muted small ms-1 me-1 fw-medium" style="font-size: 0.75rem;">Hasta:</span>
            <input type="date" class="form-control form-control-sm border-0 shadow-none px-1" 
                   [(ngModel)]="filtros.fecha_fin" (change)="cargarDatosSecundarios()" 
                   style="font-size: 0.8rem; height: 31px;">
          </div>
          <button class="btn btn-primary btn-sm rounded-pill px-3 shadow-sm border-0" 
                  (click)="cargarDatosSecundarios()" [disabled]="loading" style="height: 31px;" title="Actualizar">
            <i class="bi bi-arrow-clockwise" [class.spin]="loading"></i>
          </button>
        </div>
      </div>

      <!-- LOADING STATE -->
      <div *ngIf="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
        <div class="spinner-grow text-primary" role="status"></div>
        <span class="text-muted mt-3 small fw-medium">Sincronizando cartera...</span>
      </div>

      <!-- ERROR STATE -->
      <div *ngIf="error && !loading" class="alert alert-danger border-0 rounded-4 shadow-sm p-4 text-center">
         <i class="bi bi-exclamation-triangle fs-1 d-block mb-3"></i>
         <h6 class="fw-bold">No se pudieron cargar los datos</h6>
         <p class="small mb-3">Error: {{ error }}</p>
         <button class="btn btn-outline-danger rounded-pill" (click)="cargarDatos()">Reintentar</button>
      </div>

      <!-- TABS CONTENT -->
      <div class="tab-content animate-in" *ngIf="!loading && !error">
        
        <!-- Tab 1: Resumen -->
        <div *ngIf="activeTab === 'resumen'">
          <app-cuentas-cobrar-resumen [overview]="overviewData"></app-cuentas-cobrar-resumen>
        </div>

        <!-- Tab 2: Antigüedad -->
        <div *ngIf="activeTab === 'antiguedad'">
          <app-cuentas-cobrar-antiguedad [data]="antiguedadData"></app-cuentas-cobrar-antiguedad>
        </div>

        <!-- Tab 3: Morosos -->
        <div *ngIf="activeTab === 'morosos'">
          <app-cuentas-cobrar-morosos [data]="morososData"></app-cuentas-cobrar-morosos>
        </div>

        <!-- Tab 4: Historial de Pagos -->
        <div *ngIf="activeTab === 'pagos'">
          <app-cuentas-cobrar-pagos [data]="pagosData"></app-cuentas-cobrar-pagos>
        </div>

        <!-- Tab 5: Proyección (Oculto temporalmente) -->
        <!-- <div *ngIf="activeTab === 'proyeccion'">
          <app-cuentas-cobrar-proyeccion [data]="proyeccionData"></app-cuentas-cobrar-proyeccion>
        </div> -->

      </div>
    </div>
  `,
  styles: [`
    .tab-btn {
      color: #64748b;
      background: #f1f5f9;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .tab-btn:hover {
      background: #e2e8f0;
      color: #334155;
      transform: translateY(-1px);
    }
    .tab-btn.active {
      background: #6366f1;
      color: white;
      box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
    }
    .tabs-slider::-webkit-scrollbar { display: none; }
    .tabs-slider { -ms-overflow-style: none; scrollbar-width: none; }
    
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .animate-in {
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CuentasCobrarPage implements OnInit {
  loading: boolean = false;
  error: string | null = null;
  activeTab: string = 'resumen';
  
  filtros: CuentasCobrarFiltros = {
    fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    fecha_corte: new Date().toISOString().split('T')[0]
  };

  overviewData: CuentasCobrarOverview | null = null;
  antiguedadData: AntiguedadCliente[] = [];
  morososData: ClienteMoroso[] = [];
  pagosData: HistorialPago[] = [];
  proyeccionData: ProyeccionCobro[] = [];

  tabs = [
    { id: 'resumen', label: 'Consolidado', icon: 'bi bi-pie-chart-fill' },
    { id: 'antiguedad', label: 'Antigüedad', icon: 'bi bi-reception-3' },
    { id: 'morosos', label: 'Morosos', icon: 'bi bi-person-x-fill' },
    { id: 'pagos', label: 'Historial', icon: 'bi bi-receipt-cutoff' }
    // { id: 'proyeccion', label: 'Proyección', icon: 'bi bi-graph-up-arrow' }
  ];

  constructor(
    private service: CuentasCobrarService,
    private uiService: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.uiService.setPageHeader('Cuentas por Cobrar', 'Gestión financiera de cartera');
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.service.getResumen(this.filtros).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.overviewData = res;
        this.cargarDatosSecundarios();
      },
      error: (err) => {
        console.error('Error loading accounts receivable overview:', err);
        this.error = err.error?.message || 'Error de conexión con el servidor';
      }
    });
  }

  cargarDatosSecundarios() {
    this.service.getAntiguedadClientes(this.filtros.fecha_corte).subscribe(data => this.antiguedadData = data);
    this.service.getClientesMorosos(this.filtros.dias_mora || 1).subscribe(data => this.morososData = data);
    this.service.getHistorialPagos(this.filtros).subscribe(data => this.pagosData = data);
    this.service.getProyeccionCobros().subscribe(data => this.proyeccionData = data);
  }
}

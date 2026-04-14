import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';
import { VendedorReportesService, VendedorMetricas } from './services/vendedor-reportes.service';
import { UiService } from '../../../shared/services/ui.service';
import { HttpClient } from '@angular/common/http';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { R031StatsComponent } from './components/reporte_031/r031-stats.component';
import { R032StatsComponent } from './components/reporte_032/r032-stats.component';
import { VendorChartComponent } from './components/vendor-chart.component';
import { EmpresasListComponent } from './components/reporte_031/empresas-list.component';
import { ComisionesListComponent } from './components/reporte_032/comisiones-list.component';
import { VendedorFiltersComponent, RangoTipo } from './components/vendedor-filters.component';
import { environment } from '../../../../environments/environment';

export type ReportTab = 'empresas' | 'comisiones';

@Component({
  selector: 'app-vendedor-reportes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ToastComponent, 
    R031StatsComponent,
    R032StatsComponent,
    VendorChartComponent,
    VendedorFiltersComponent,
    EmpresasListComponent,
    ComisionesListComponent
  ],
  template: `
    <div class="reportes-page-container animate__animated animate__fadeIn">
      <!-- BARRA DE NAVEGACIÓN Y ACCIONES -->
      <div class="header-actions-bar mb-4">
        <div class="tabs-navigation">
          <button class="nav-btn" [class.active]="tabActivo === 'empresas'" (click)="setTab('empresas')">
            <i class="bi bi-buildings me-2"></i>Mis Empresas (R-031)
          </button>
          <button class="nav-btn" [class.active]="tabActivo === 'comisiones'" (click)="setTab('comisiones')">
            <i class="bi bi-cash-stack me-2"></i>Mis Comisiones (R-032)
          </button>
        </div>

        <div class="filters-actions">
          <app-vendedor-filters
            *ngIf="tabActivo === 'empresas' || tabActivo === 'comisiones'"
            [loading]="isLoading"
            [rangoTipo]="rangoTipo"
            [fechaInicio]="fechaInicio"
            [fechaFin]="fechaFin"
            [diasRenovacion]="diasRenovacion"
            [showDiasRenovacion]="false"
            (rangoChange)="onRangoChange($event)"
            (generate)="handleGenerate()"
            (export)="exportarPDF()">
          </app-vendedor-filters>
        </div>
      </div>

      <!-- CABECERAS Y DASHBOARD (Debajo del Rango de Consulta) -->
      <div class="dashboard-top-section mt-4 animate__animated animate__fadeIn">
        <!-- Header R-031 -->
        <div class="page-header mb-4" *ngIf="tabActivo === 'empresas'">
            <h1 class="page-title text-primary">R-031 — Mis empresas</h1>
            <p class="page-subtitle text-muted">Vista filtrada automáticamente: solo las empresas asignadas a este vendedor.</p>
        </div>

        <!-- Header R-032 -->
        <div class="page-header mb-4" *ngIf="tabActivo === 'comisiones'">
            <h1 class="page-title text-success">R-032 — Mis comisiones</h1>
            <p class="page-subtitle text-muted">Resumen de ingresos acumulados y futuros para este vendedor.</p>
        </div>

        <!-- KPIs / Stats -->
        <div class="stats-container mb-4">
            <!-- R-031 Stats (Empresas) -->
            <app-r031-stats *ngIf="tabActivo === 'empresas'" [data]="r031Data"></app-r031-stats>
            
            <!-- R-032 Stats (Comisiones) -->
            <app-r032-stats *ngIf="tabActivo === 'comisiones'" [data]="r032Data"></app-r032-stats>
        </div>
      </div>

      <!-- GRÁFICAS R-031 / R-032 -->
      <div class="row mb-4 animate__animated animate__fadeIn" *ngIf="tabActivo === 'empresas'">
          <div class="col-md-6 mb-3 mb-md-0">
              <app-vendor-chart 
                  title="Planes más vendidos" 
                  subtitle="Distribución por tipo de plan"
                  type="pie" 
                  [data]="r031Data?.grafica_planes || []"
                  labelKey="nombre"
                  valueKey="cantidad">
              </app-vendor-chart>
          </div>
          <div class="col-md-6">
              <app-vendor-chart 
                  title="Ventas por meses" 
                  subtitle="Evolución mensual de ingresos"
                  type="line" 
                  [data]="r031Data?.grafica_ventas_mes || []"
                  labelKey="mes"
                  valueKey="total">
              </app-vendor-chart>
          </div>
      </div>


      <div class="row mb-4 animate__animated animate__fadeIn" *ngIf="tabActivo === 'comisiones'">
          <div class="col-md-6 offset-md-3">
              <app-vendor-chart
                  title="Rendimiento: Este Mes vs Mes Anterior"
                  subtitle="Comparativa de comisiones generadas"
                  type="doughnut"
                  [data]="[
                      {label: 'Este Mes', value: r032Data?.grafica_comparativa?.total_actual},
                      {label: 'Mes Anterior', value: r032Data?.grafica_comparativa?.total_anterior}
                  ]"
                  labelKey="label"
                  valueKey="value"
                  [colors]="['#10b981', '#cbd5e1']">
              </app-vendor-chart>
          </div>
      </div>
      <!-- SECCIONES DE REPORTE (Tablas de Datos) -->
      <div class="report-content-area">
          <div *ngIf="isLoading" class="loading-state py-5 text-center">
            <div class="spinner-grow text-primary" role="status"></div>
            <p class="mt-3 text-muted fw-bold">Consultando registros...</p>
          </div>

          <ng-container *ngIf="!isLoading">
              <app-empresas-list 
                *ngIf="tabActivo === 'empresas'" 
                [data]="r031Data?.empresas || []">
              </app-empresas-list>

              <app-comisiones-list 
                *ngIf="tabActivo === 'comisiones'" 
                [data]="r032Data?.detalle || []">
              </app-comisiones-list>
          </ng-container>
      </div>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .reportes-page-container { padding: 1.5rem; background: #f8fafc; min-height: 100vh; }
    
    .page-title { font-weight: 900; color: #0f172a; margin: 0; font-size: 1.75rem; letter-spacing: -0.025em; }
    .page-subtitle { color: #64748b; font-size: 0.95rem; font-weight: 500; margin-top: 0.25rem; }
    
    .header-actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      gap: 1.5rem;
      flex-wrap: nowrap;
      overflow: hidden;
    }

    /* TABS MODERNOS */
    .tabs-navigation { display: flex; gap: 0.5rem; overflow-x: auto; }
    .nav-btn {
      background: none; border: none; padding: 0.75rem 1.25rem; font-weight: 700; color: #64748b;
      border-radius: 12px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
      position: relative; white-space: nowrap; display: flex; align-items: center;
    }
    .nav-btn.active { background: #1e293b; color: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    
    .btn-tab-danger.active { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    .btn-tab-danger:not(.active):hover { background: #fef2f2; color: #991b1b; }
    
    .notification-badge {
        position: absolute; top: -5px; right: -5px; background: #3b82f6; color: white;
        font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 50%; border: 2px solid #fff;
    }

    .report-content-area { margin-top: 1.5rem; }
    
    .loading-state {
        background: white; border-radius: 20px; border: 1px dashed #cbd5e1;
    }
  `]
})
export class VendedorReportesPage implements OnInit, OnDestroy {
  // Estado de navegación
  tabActivo: ReportTab = 'empresas';
  
  // Datos y carga
  metricas: any = null;
  r031Data: any = null;
  r032Data: any = null;
  previewData: any[] = [];
  isLoading = false;
  
  // Filtros
  rangoTipo: RangoTipo = 'mes_actual';
  fechaInicio = '';
  fechaFin = '';
  diasRenovacion = 15;

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: VendedorReportesService,
    private uiService: UiService,
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initDefaultDates();
    // Ejecutar carga en el siguiente ciclo de eventos para asegurar sincronización de componentes hijos
    setTimeout(() => {
      this.cargarDatosConsolidados();
    }, 0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.fechaInicio = this.formatDate(firstDay);
    this.fechaFin = this.formatDate(today);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  setTab(tab: ReportTab) {
    if (this.tabActivo === tab) return;
    this.tabActivo = tab;
    this.cargarDatosConsolidados();
  }

  onRangoChange(event: {tipo: RangoTipo, inicio: string, fin: string, dias?: number}) {
    this.rangoTipo = event.tipo;
    this.fechaInicio = event.inicio;
    this.fechaFin = event.fin;
    if (event.dias !== undefined) this.diasRenovacion = event.dias;
    this.cd.detectChanges();
  }

  cargarDatosConsolidados() {
    this.isLoading = true;
    if (this.tabActivo === 'empresas') {
      this.reportesService.getR031Data(this.fechaInicio, this.fechaFin)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
            this.cd.detectChanges();
          })
        )
        .subscribe({
          next: (data) => {
            this.r031Data = data;
          },
          error: (err) => {
            this.uiService.showError(err, 'Error al cargar reporte de empresas');
          }
        });
    } else if (this.tabActivo === 'comisiones') {
      this.reportesService.getR032Data(this.fechaInicio, this.fechaFin)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
            this.cd.detectChanges();
          })
        )
        .subscribe({
          next: (data) => {
            this.r032Data = data;
          },
          error: (err) => {
            this.uiService.showError(err, 'Error al cargar reporte de comisiones');
          }
        });
    }
  }

  handleGenerate() {
    this.cargarDatosConsolidados();
  }


  exportarPDF() {
    this.uiService.showToast('Generando reporte PDF...', 'info');
    
    const tipo = this.getBackendTipo();
    const nombre = `Reporte ${this.tabActivo.toUpperCase()}`;
    const params = this.getParams();

    this.reportesService.generarReporte(tipo, nombre, params)
      .subscribe({
        next: (res) => {
          this.uiService.showToast('Reporte generado exitosamente', 'success');
          this.downloadLinkExtracted(res.url_descarga);
          this.cd.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'Error al generar el reporte');
          this.cd.detectChanges();
        }
      });
  }

  private getBackendTipo(): string {
    switch (this.tabActivo) {
        case 'empresas': return 'MIS_EMPRESAS';
        case 'comisiones': return 'COMISIONES_MES';
        default: return '';
    }
  }

  private getParams(): any {
    return {
        fecha_inicio: this.fechaInicio,
        fecha_fin: this.fechaFin
    };
  }

  private downloadLinkExtracted(url_descarga?: string) {
      if (url_descarga) {
          const filename = url_descarga.split('/').pop() || 'reporte.pdf';
          const apiUrl = environment.apiUrl;
          const downloadLink = `${apiUrl}/reportes/vendedor/descargar/${filename}`;

          // Descargar con HttpClient (que incluye el token automáticamente)
          this.http.get(downloadLink, { responseType: 'blob' })
              .subscribe({
                  next: (blob) => {
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = filename;
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(link.href);
                  },
                  error: () => {
                      this.uiService.showError('Error al descargar el archivo', 'Error');
                  }
              });
      }
  }
}

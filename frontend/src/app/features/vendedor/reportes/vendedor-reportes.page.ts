import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { VendedorReportesService, VendedorMetricas } from './services/vendedor-reportes.service';
import { UiService } from '../../../shared/services/ui.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ReportesStatsComponent } from './components/reportes-stats.component';
import { VendedorFiltersComponent, RangoTipo } from './components/vendedor-filters.component';
import { EmpresasListComponent } from './components/empresas-list.component';
import { VencidasListComponent } from './components/vencidas-list.component';
import { ProximasListComponent } from './components/proximas-list.component';
import { ComisionesListComponent } from './components/comisiones-list.component';
import { environment } from '../../../../environments/environment';

export type ReportTab = 'empresas' | 'vencidas' | 'proximas' | 'comisiones';

@Component({
  selector: 'app-vendedor-reportes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ToastComponent, 
    ReportesStatsComponent, 
    VendedorFiltersComponent,
    EmpresasListComponent,
    VencidasListComponent,
    ProximasListComponent,
    ComisionesListComponent
  ],
  template: `
    <div class="reportes-page-container animate__animated animate__fadeIn">
      
      <!-- CABECERA PERSONALIZADA -->
      <div class="header-section mb-4">
        <div class="d-flex justify-content-between align-items-center">
            <div class="title-group">
                <h2 class="page-title">Panel de Reportes</h2>
                <p class="page-subtitle">Gestiona tu cartera, monitorea renovaciones y liquida tus comisiones.</p>
            </div>
            <div class="last-sync text-end" *ngIf="metricas">
                <span class="badge bg-light text-dark shadow-sm">
                    <i class="bi bi-clock-history me-1"></i>
                    Actualizado hoy
                </span>
            </div>
        </div>
      </div>

      <!-- DASHBOARD ESENCIAL (Always visible as proposed) -->
      <app-reportes-stats [metricas]="metricas"></app-reportes-stats>

      <!-- NAVEGACIÓN POR PESTAÑAS (Estilo Moderno) -->
      <div class="tabs-navigation mb-4">
        <button class="nav-btn" [class.active]="tabActivo === 'empresas'" (click)="setTab('empresas')">
          <i class="bi bi-buildings me-2"></i>Mis Empresas
        </button>
        <button class="nav-btn" [class.active]="tabActivo === 'proximas'" (click)="setTab('proximas')">
          <i class="bi bi-calendar-event me-2"></i>Por Renovar
          <span class="notification-badge" *ngIf="metricas?.total_proximas > 0">{{ metricas?.total_proximas }}</span>
        </button>
        <button class="nav-btn btn-tab-danger" [class.active]="tabActivo === 'vencidas'" (click)="setTab('vencidas')">
          <i class="bi bi-exclamation-triangle me-2"></i>Suspendidas
          <span class="notification-badge bg-danger" *ngIf="metricas?.total_vencidas > 0">{{ metricas?.total_vencidas }}</span>
        </button>
        <button class="nav-btn" [class.active]="tabActivo === 'comisiones'" (click)="setTab('comisiones')">
          <i class="bi bi-cash-stack me-2"></i>Mis Comisiones
        </button>
      </div>

      <!-- FILTROS UNIFICADOS -->
      <app-vendedor-filters
        [loading]="isLoading"
        [rangoTipo]="rangoTipo"
        [fechaInicio]="fechaInicio"
        [fechaFin]="fechaFin"
        [diasRenovacion]="diasRenovacion"
        [showDiasRenovacion]="tabActivo === 'proximas'"
        (rangoChange)="onRangoChange($event)"
        (generate)="cargarPreview()"
        (export)="exportarPDF()">
      </app-vendedor-filters>

      <!-- SECCIONES DE REPORTE (Tablas de Datos) -->
      <div class="report-content-area">
          <div *ngIf="isLoading" class="loading-state py-5 text-center">
            <div class="spinner-grow text-primary" role="status"></div>
            <p class="mt-3 text-muted fw-bold">Consultando registros...</p>
          </div>

          <ng-container *ngIf="!isLoading">
              <app-empresas-list 
                *ngIf="tabActivo === 'empresas'" 
                [data]="previewData">
              </app-empresas-list>

              <app-vencidas-list 
                *ngIf="tabActivo === 'vencidas'" 
                [data]="previewData">
              </app-vencidas-list>

              <app-proximas-list 
                *ngIf="tabActivo === 'proximas'" 
                [data]="previewData">
              </app-proximas-list>

              <app-comisiones-list 
                *ngIf="tabActivo === 'comisiones'" 
                [data]="previewData">
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

    /* TABS MODERNOS */
    .tabs-navigation { display: flex; gap: 0.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; overflow-x: auto; }
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
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initDefaultDates();
    this.cargarMetricas();
    this.cargarPreview();
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
    this.previewData = [];
    this.cargarPreview();
  }

  onRangoChange(event: {tipo: RangoTipo, inicio: string, fin: string, dias?: number}) {
    this.rangoTipo = event.tipo;
    this.fechaInicio = event.inicio;
    this.fechaFin = event.fin;
    if (event.dias !== undefined) this.diasRenovacion = event.dias;
    this.cd.detectChanges();
  }

  cargarMetricas() {
    this.reportesService.getMetricas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.metricas = data;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'No se pudieron cargar las métricas');
        }
      });
  }

  cargarPreview() {
    this.isLoading = true;
    this.previewData = [];
    
    const tipo = this.getBackendTipo();
    const params = this.getParams();

    this.reportesService.getPreviewData(tipo, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.previewData = data;
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.uiService.showError(err, 'Error al cargar previsualización');
          this.cd.detectChanges();
        }
      });
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
        case 'vencidas': return 'SUSCRIPCIONES_VENCIDAS';
        case 'proximas': return 'SUSCRIPCIONES_PROXIMAS';
        case 'comisiones': return 'COMISIONES_MES';
        default: return '';
    }
  }

  private getParams(): any {
    const params: any = {
        fecha_inicio: this.fechaInicio,
        fecha_fin: this.fechaFin
    };
    if (this.tabActivo === 'proximas') {
        params.dias = this.diasRenovacion;
    }
    return params;
  }

  private downloadLinkExtracted(url_descarga?: string) {
      if (url_descarga) {
          const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
          const downloadLink = `${baseUrl}${url_descarga}`;
          window.open(downloadLink, '_blank');
      }
  }
}

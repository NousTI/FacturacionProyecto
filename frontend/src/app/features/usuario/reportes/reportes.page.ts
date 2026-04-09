import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancialReportsService, PyGReport, IVAReport, ExecutiveSummary } from './services/financial-reports.service';
import { UiService } from '../../../shared/services/ui.service';

// Sub-componentes
import { ReportesFiltersComponent, RangoTipo } from './components/filters.component';
import { ExecutiveSummaryComponent } from './components/executive-summary.component';
import { PygReportComponent } from './components/pyg-report.component';
import { IvaReportComponent } from './components/iva-report.component';

type Tab = 'resumen' | 'pyg' | 'iva';

@Component({
  selector: 'app-usuario-reportes',
  standalone: true,
  imports: [
    CommonModule, 
    ReportesFiltersComponent, 
    ExecutiveSummaryComponent, 
    PygReportComponent, 
    IvaReportComponent
  ],
  template: `
<div class="reportes-container animate__animated animate__fadeIn">
  
  <!-- CABECERA -->
  <div class="header-section mb-4">
    <div class="title-group">
      <h4 class="page-title">Reportes Financieros</h4>
      <p class="page-subtitle">Análisis profundo de rentabilidad, impuestos y KPIs de negocio.</p>
    </div>
  </div>

  <!-- NAVEGACIÓN -->
  <div class="tabs-navigation mb-4">
    <button class="nav-btn" [class.active]="tabActivo === 'resumen'" (click)="setTab('resumen')">
      <i class="bi bi-speedometer2 me-2"></i>Resumen Ejecutivo
    </button>
    <button class="nav-btn" [class.active]="tabActivo === 'pyg'" (click)="setTab('pyg')">
      <i class="bi bi-calculator me-2"></i>Estado de Resultados
    </button>
    <button class="nav-btn" [class.active]="tabActivo === 'iva'" (click)="setTab('iva')">
      <i class="bi bi-receipt me-2"></i>Reporte de IVA
    </button>
  </div>

  <!-- FILTROS (FRAGMENTADO) -->
  <app-reportes-filters
    [loading]="loading"
    [rangoTipo]="rangoTipo"
    [fechaInicio]="fechaInicio"
    [fechaFin]="fechaFin"
    (rangoChange)="onRangoChange($event)"
    (generate)="cargarDatos()"
    (export)="exportarPDF()">
  </app-reportes-filters>

  <!-- CONTENIDO CARGANDO -->
  <div class="loading-overlay" *ngIf="loading">
    <div class="spinner-border text-primary" role="status"></div>
    <p class="mt-2 text-muted">Procesando datos financieros...</p>
  </div>

  <!-- SECCIONES DE REPORTE (FRAGMENTADO) -->
  <ng-container *ngIf="!loading">
    <app-executive-summary 
      *ngIf="tabActivo === 'resumen' && resumenData" 
      [data]="resumenData">
    </app-executive-summary>

    <app-pyg-report 
      *ngIf="tabActivo === 'pyg' && pygData" 
      [data]="pygData">
    </app-pyg-report>

    <app-iva-report 
      *ngIf="tabActivo === 'iva' && ivaData" 
      [data]="ivaData">
    </app-iva-report>
  </ng-container>

</div>
  `,
  styles: [`
    .reportes-container { padding: 1.5rem; color: #1e293b; background: #f8fafc; min-height: 100vh; }
    .page-title { font-weight: 850; color: #0f172a; margin-bottom: 0.25rem; font-size: 1.85rem; }
    .page-subtitle { color: #64748b; font-weight: 500; }

    /* TABS */
    .tabs-navigation { display: flex; gap: 0.75rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    .nav-btn {
      background: none; border: none; padding: 0.85rem 1.5rem; font-weight: 650; color: #64748b;
      border-radius: 12px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
    }
    .nav-btn:hover { background: #f1f5f9; color: #0f172a; }
    .nav-btn.active { background: #1e293b; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

    .loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; }
  `]
})
export class ReportesPage implements OnInit {
  tabActivo: Tab = 'resumen';
  loading = false;
  
  // Filtros (Estado compartido con el componente de filtros)
  rangoTipo: RangoTipo = 'mes_actual';
  fechaInicio = '';
  fechaFin = '';

  // Datos
  resumenData?: ExecutiveSummary;
  pygData?: PyGReport;
  ivaData?: IVAReport;

  constructor(
    private reportsSvc: FinancialReportsService,
    private ui: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initDefaultDates();
  }

  private initDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.fechaInicio = firstDay.toISOString().split('T')[0];
    this.fechaFin = today.toISOString().split('T')[0];
  }

  setTab(tab: Tab) {
    this.tabActivo = tab;
  }

  onRangoChange(event: {tipo: RangoTipo, inicio: string, fin: string}) {
    this.rangoTipo = event.tipo;
    this.fechaInicio = event.inicio;
    this.fechaFin = event.fin;
    this.cdr.detectChanges();
  }

  cargarDatos() {
    if (!this.fechaInicio || !this.fechaFin) return;
    this.loading = true;
    
    if (this.tabActivo === 'resumen') {
      this.resumenData = undefined;
      this.reportsSvc.getExecutiveSummary(this.fechaInicio, this.fechaFin).subscribe({
        next: (d) => { this.resumenData = d; this.loading = false; this.cdr.detectChanges(); },
        error: () => { this.ui.showToast('Error al cargar resumen', 'danger'); this.loading = false; this.cdr.detectChanges(); }
      });
    } else if (this.tabActivo === 'pyg') {
      this.pygData = undefined;
      this.reportsSvc.getPyGReport(this.fechaInicio, this.fechaFin).subscribe({
        next: (d) => { this.pygData = d; this.loading = false; this.cdr.detectChanges(); },
        error: () => { this.ui.showToast('Error al cargar PyG', 'danger'); this.loading = false; this.cdr.detectChanges(); }
      });
    } else if (this.tabActivo === 'iva') {
      this.ivaData = undefined;
      this.reportsSvc.getIVAReport(this.fechaInicio, this.fechaFin).subscribe({
        next: (d) => { this.ivaData = d; this.loading = false; this.cdr.detectChanges(); },
        error: () => { this.ui.showToast('Error al cargar IVA', 'danger'); this.loading = false; this.cdr.detectChanges(); }
      });
    }
    this.cdr.detectChanges();
  }

  exportarPDF() {
    if (!this.fechaInicio || !this.fechaFin) return;
    let tipo = '';
    switch (this.tabActivo) {
      case 'resumen': tipo = 'FINANCIERO_RESUMEN'; break;
      case 'pyg': tipo = 'FINANCIERO_PYG'; break;
      case 'iva': tipo = 'FINANCIERO_IVA'; break;
    }

    this.ui.showToast('Generando PDF...', 'info');
    
    this.reportsSvc.exportarReportePDF(tipo, this.fechaInicio, this.fechaFin).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${tipo.toLowerCase()}_${this.fechaInicio}_${this.fechaFin}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.ui.showToast('Reporte descargado con éxito', 'success');
        this.cdr.detectChanges();
      },
      error: () => { this.ui.showToast('Error al generar el PDF', 'danger'); this.cdr.detectChanges(); }
    });
    this.cdr.detectChanges();
  }
}

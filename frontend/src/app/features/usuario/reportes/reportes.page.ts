import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FinancialReportsService, 
  PyGReport, 
  IVAReport, 
  ExecutiveSummary, 
  SalesGeneralReport, 
  AccountsReceivableReport 
} from './services/financial-reports.service';
import { UiService } from '../../../shared/services/ui.service';
import { inject } from '@angular/core';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { REPORTES_PERMISSIONS } from '../../../constants/permission-codes';

// Sub-componentes
import { ReportesFiltersComponent, RangoTipo } from './components/filters.component';
import { ExecutiveSummaryComponent } from './components/executive-summary.component';
import { PygReportComponent } from './components/pyg-report.component';
import { IvaReportComponent } from './components/iva-report.component';
import { SalesGeneralComponent } from './components/sales-general.component';
import { AccountsReceivableComponent } from './components/accounts-receivable.component';

type Tab = 'resumen' | 'ventas' | 'cartera' | 'pyg' | 'iva';

@Component({
  selector: 'app-usuario-reportes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    ReportesFiltersComponent, 
    ExecutiveSummaryComponent, 
    PygReportComponent, 
    IvaReportComponent,
    SalesGeneralComponent,
    AccountsReceivableComponent
  ],
  template: `
<div class="reportes-container animate__animated animate__fadeIn">
  
  <ng-container *ngIf="canView; else noPermission">
    <!-- CABECERA -->
    <div class="header-section mb-4">
      <div class="title-group">
        <h4 class="page-title text-gradient">Centro de Inteligencia</h4>
        <p class="page-subtitle">Análisis financiero y administrativo de Comercial Torres.</p>
      </div>
    </div>

    <!-- NAVEGACIÓN -->
    <div class="tabs-navigation mb-4">
      <button class="nav-btn" [class.active]="tabActivo === 'resumen'" (click)="setTab('resumen')">
        <i class="bi bi-speedometer2 me-2"></i>Dashboard Ejecutivo
      </button>
      <button class="nav-btn" [class.active]="tabActivo === 'ventas'" (click)="setTab('ventas')">
        <i class="bi bi-cart-check me-2"></i>Ventas Generales
      </button>
      <button class="nav-btn" [class.active]="tabActivo === 'cartera'" (click)="setTab('cartera')">
        <i class="bi bi-person-lines-fill me-2"></i>Cartera y Morosidad
      </button>
      <button class="nav-btn" [class.active]="tabActivo === 'pyg'" (click)="setTab('pyg')">
        <i class="bi bi-calculator me-2"></i>P & G
      </button>
      <button class="nav-btn" [class.active]="tabActivo === 'iva'" (click)="setTab('iva')">
        <i class="bi bi-receipt me-2"></i>IVA
      </button>
    </div>

    <!-- FILTROS -->
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
      <div class="premium-spinner"></div>
      <p class="mt-3 text-muted tracking-wide animate__animated animate__pulse animate__infinite">Consolidando métricas financieras...</p>
    </div>

    <!-- SECCIONES DE REPORTE -->
    <ng-container *ngIf="!loading">
      <app-executive-summary 
        *ngIf="tabActivo === 'resumen' && resumenData" 
        [data]="resumenData">
      </app-executive-summary>

      <app-sales-general
        *ngIf="tabActivo === 'ventas' && ventasData"
        [data]="ventasData"
        [usersData]="usersData">
      </app-sales-general>

      <app-accounts-receivable
        *ngIf="tabActivo === 'cartera' && carteraData"
        [data]="carteraData">
      </app-accounts-receivable>

      <app-pyg-report 
        *ngIf="tabActivo === 'pyg' && pygData" 
        [data]="pygData">
      </app-pyg-report>

      <app-iva-report 
        *ngIf="tabActivo === 'iva' && ivaData" 
        [data]="ivaData">
      </app-iva-report>
    </ng-container>
  </ng-container>

  <!-- TEMPLATE SIN PERMISO -->
  <ng-template #noPermission>
    <div class="no-permission-container d-flex flex-column align-items-center justify-content-center text-center p-5 animate__animated animate__fadeIn" style="min-height: 70vh;">
      <div class="icon-lock-wrapper mb-4">
        <i class="bi bi-shield-lock-fill" style="font-size: 3.5rem; color: #ef4444;"></i>
      </div>
      <h2 class="fw-bold text-dark mb-2" style="font-size: 2.25rem;">Acceso Restringido</h2>
      <p class="text-muted mb-4 mx-auto" style="max-width: 450px; font-size: 1.1rem;">
        No cuentas con los privilegios necesarios para visualizar el Centro de Inteligencia y sus reportes detallados. 
        Solicita el permiso <strong>REPORTES_VER</strong> a tu administrador.
      </p>
      <button class="btn btn-dark rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center gap-2" (click)="cargarDatos()">
        <i class="bi bi-arrow-clockwise"></i> Reintentar sincronización
      </button>
    </div>
  </ng-template>

</div>
  `,
  styles: [`
    .reportes-container { padding: 1.5rem; color: #1e293b; background: #f8fafc; min-height: 100vh; }
    .page-title { font-weight: 850; color: #0f172a; margin-bottom: 0.25rem; font-size: 2rem; letter-spacing: -0.02em; }
    .text-gradient { background: linear-gradient(90deg, #1e293b, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .page-subtitle { color: #64748b; font-weight: 500; font-size: 1rem; }

    /* TABS */
    .tabs-navigation { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.75rem; scrollbar-width: none; }
    .tabs-navigation::-webkit-scrollbar { display: none; }
    
    .nav-btn {
      background: #fff; border: 1px solid #e2e8f0; padding: 0.75rem 1.25rem; font-weight: 650; color: #64748b;
      border-radius: 14px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; white-space: nowrap;
      display: flex; align-items: center;
    }
    .nav-btn:hover { background: #f1f5f9; color: #0f172a; transform: translateY(-1px); }
    .nav-btn.active { background: #1e293b; color: #fff; border-color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

    .loading-overlay { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 0; }
    .premium-spinner {
      width: 48px; height: 48px; border: 4px solid #f1f5f9; border-top-color: #6366f1; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .tracking-wide { letter-spacing: 0.05em; font-weight: 600; font-size: 0.85rem; }

    .icon-lock-wrapper {
      width: 100px; height: 100px; background: #fff1f2; border: 1px solid #fecaca;
      border-radius: 30px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 15px 35px -10px rgba(225, 29, 72, 0.15);
    }
  `]
})
export class ReportesPage implements OnInit {
  get canView(): boolean {
    return this.permissionsService.hasPermission(REPORTES_PERMISSIONS.VER);
  }

  tabActivo: Tab = 'resumen';
  loading = false;
  
  // Filtros
  rangoTipo: RangoTipo = 'mes_actual';
  fechaInicio = '';
  fechaFin = '';

  // Datos
  resumenData?: ExecutiveSummary;
  ventasData?: SalesGeneralReport;
  carteraData?: AccountsReceivableReport;
  pygData?: PyGReport;
  ivaData?: IVAReport;
  usersData: any[] = [];

  private permissionsService = inject(PermissionsService);

  constructor(
    private reportsSvc: FinancialReportsService,
    private ui: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initDefaultDates();
    this.cargarDatos();
  }

  private initDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.fechaInicio = firstDay.toISOString().split('T')[0];
    this.fechaFin = today.toISOString().split('T')[0];
  }

  setTab(tab: Tab) {
    if (this.tabActivo === tab) return;
    this.tabActivo = tab;
    this.cargarDatos();
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
    this.cdr.detectChanges();
    
    switch (this.tabActivo) {
      case 'resumen':
        this.resumenData = undefined;
        this.reportsSvc.getExecutiveSummary(this.fechaInicio, this.fechaFin).subscribe({
          next: (d) => { this.resumenData = d; this.finishLoading(); },
          error: () => this.handleError('Error al cargar resumen ejecutivo')
        });
        break;

      case 'ventas':
        this.ventasData = undefined;
        this.usersData = [];
        this.reportsSvc.getSalesGeneral(this.fechaInicio, this.fechaFin).subscribe({
          next: (d) => {
            this.ventasData = d;
            this.reportsSvc.getSalesByUser(this.fechaInicio, this.fechaFin).subscribe({
                next: (response) => {
                  // El endpoint devuelve {detalles: [...], ranking: [...]}
                  // Extraemos el array de detalles
                  this.usersData = Array.isArray(response) ? response : (response?.detalles || []);
                  this.cdr.detectChanges();
                  this.finishLoading();
                },
                error: () => this.handleError('Error al cargar detalle de usuarios')
            });
          },
          error: () => this.handleError('Error al cargar ventas generales')
        });
        break;

      case 'cartera':
        this.carteraData = undefined;
        this.reportsSvc.getAccountsReceivable(this.fechaInicio, this.fechaFin).subscribe({
          next: (d) => { this.carteraData = d; this.finishLoading(); },
          error: () => this.handleError('Error al cargar reporte de cartera')
        });
        break;

      case 'pyg':
        this.pygData = undefined;
        this.reportsSvc.getPyGReport(this.fechaInicio, this.fechaFin).subscribe({
          next: (d) => { this.pygData = d; this.finishLoading(); },
          error: () => this.handleError('Error al cargar PyG')
        });
        break;

      case 'iva':
        this.ivaData = undefined;
        this.reportsSvc.getIVAReport(this.fechaInicio, this.fechaFin).subscribe({
          next: (d) => { this.ivaData = d; this.finishLoading(); },
          error: () => this.handleError('Error al cargar IVA')
        });
        break;
    }
  }

  private finishLoading() {
    this.loading = false;
    this.cdr.detectChanges();
  }

  private handleError(msg: string) {
    this.ui.showToast(msg, 'danger');
    this.loading = false;
    this.cdr.detectChanges();
  }

  exportarPDF() {
    if (!this.fechaInicio || !this.fechaFin) return;
    let tipo = '';
    switch (this.tabActivo) {
      case 'resumen': tipo = 'FINANCIERO_RESUMEN'; break;
      case 'ventas': tipo = 'VENTAS_GENERAL'; break;
      case 'cartera': tipo = 'FINANCIERO_CARTERA'; break;
      case 'pyg': tipo = 'FINANCIERO_PYG'; break;
      case 'iva': tipo = 'FINANCIERO_IVA'; break;
    }

    this.ui.showToast('Optimizando documento...', 'info');
    
    this.reportsSvc.exportarReportePDF(tipo, this.fechaInicio, this.fechaFin).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${tipo.toLowerCase()}_${this.fechaInicio}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.ui.showToast('Documento descargado con éxito', 'success');
        this.cdr.detectChanges();
      },
      error: () => { this.ui.showToast('Error al generar el documento', 'danger'); this.cdr.detectChanges(); }
    });
    this.cdr.detectChanges();
  }
}

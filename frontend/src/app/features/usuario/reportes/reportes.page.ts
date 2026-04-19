import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FinancialReportsService,
  IVAReport,
  IvaR027Report,
  ExecutiveSummary,
  SalesGeneralReport,
  AccountsReceivableReport,
  R001Report,
  MisVentasReport
} from './services/financial-reports.service';
import { UiService } from '../../../shared/services/ui.service';
import { inject } from '@angular/core';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { AuthService } from '../../../core/auth/auth.service';
import { REPORTES_PERMISSIONS } from '../../../constants/permission-codes';

// Sub-componentes
import { ExecutiveSummaryComponent } from './components/executive-summary.component';
import { IvaReportComponent } from './components/iva-report.component';
import { R027IvaComponent } from './components/reporte_027/r027-iva.component';
import { SalesGeneralComponent } from './components/sales-general.component';
import { R001VentasGeneralesComponent } from './components/reporte_001/r001-ventas-generales.component';
import { R008CuentasPorCobrarComponent } from './components/reporte_008/r008-cuentas-por-cobrar.component';
import { R028ResumenEjecutivoComponent } from './components/reporte_028/r028-resumen-ejecutivo.component';
import { R001MisVentasComponent } from './components/reporte_001_empleados/r001-mis-ventas.component';

export type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'semestre_1' | 'semestre_2' | 'personalizado' | 'personalizado_mes';
type Tab = 'resumen' | 'ventas' | 'cartera' | 'iva' | 'mis_ventas';

@Component({
  selector: 'app-usuario-reportes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ExecutiveSummaryComponent,
    IvaReportComponent,
    SalesGeneralComponent,
    R001VentasGeneralesComponent,
    R008CuentasPorCobrarComponent,
    R028ResumenEjecutivoComponent,
    R001MisVentasComponent,
    R027IvaComponent
  ],
  template: `
<div class="reportes-page-container animate__animated animate__fadeIn">

  <ng-container *ngIf="canView; else noPermission">

    <!-- BARRA DE NAVEGACIÓN Y ACCIONES -->
    <div class="header-actions-bar mb-4">
      <div class="tabs-navigation">
        <ng-container *ngIf="isAdminEmpresa">
          <button class="nav-btn" [class.active]="tabActivo === 'resumen'" (click)="setTab('resumen')">
            <i class="bi bi-speedometer2"></i>
            <span class="nav-label"><span class="nav-name">Dashboard Ejecutivo</span><span class="nav-code">R-028</span></span>
          </button>
          <button class="nav-btn" [class.active]="tabActivo === 'ventas'" (click)="setTab('ventas')">
            <i class="bi bi-cart-check"></i>
            <span class="nav-label"><span class="nav-name">Ventas Generales</span><span class="nav-code">R-001</span></span>
          </button>
          <button class="nav-btn" [class.active]="tabActivo === 'cartera'" (click)="setTab('cartera')">
            <i class="bi bi-person-lines-fill"></i>
            <span class="nav-label"><span class="nav-name">Cartera</span><span class="nav-code">R-008</span></span>
          </button>
          <button class="nav-btn" [class.active]="tabActivo === 'iva'" (click)="setTab('iva')">
            <i class="bi bi-receipt"></i>
            <span class="nav-label"><span class="nav-name">IVA</span><span class="nav-code">R-027</span></span>
          </button>
        </ng-container>
        <button class="nav-btn" [class.active]="tabActivo === 'mis_ventas'" (click)="setTab('mis_ventas')">
          <i class="bi bi-person-check"></i>
          <span class="nav-label"><span class="nav-name">Mis Ventas</span><span class="nav-code">R-001E</span></span>
        </button>
      </div>

      <div class="filters-actions">
        <div class="d-flex align-items-center gap-2">
          <!-- Selector de rango -->
          <select class="select-compact" [(ngModel)]="rangoTipo" (change)="onRangoChangeInternal()">
            <ng-container *ngIf="tabActivo === 'iva'; else otrosRangos">
              <option value="mes_anterior">Mes Anterior</option>
              <option value="mes_actual">Mes Actual</option>
              <option value="semestre_1">Semestre 1 (Ene–Jun)</option>
              <option value="semestre_2">Semestre 2 (Jul–Dic)</option>
              <option value="personalizado_mes">Personalizado</option>
            </ng-container>
            <ng-template #otrosRangos>
              <option value="mes_actual">Mes Actual</option>
              <option value="mes_anterior">Mes Anterior</option>
              <option value="anio_actual">Año Actual</option>
              <option value="personalizado">Personalizado</option>
            </ng-template>
          </select>

          <!-- Año + Mes para R-027 modo "Mes específico" -->
          <ng-container *ngIf="tabActivo === 'iva' && rangoTipo === 'personalizado_mes'">
            <select class="select-compact" [(ngModel)]="ivaAnio" (change)="onIvaFechaChange()">
              <option *ngFor="let a of ivaAnios" [value]="a">{{ a }}</option>
            </select>
            <select class="select-compact" [(ngModel)]="ivaMes" (change)="onIvaFechaChange()">
              <option value="1">Enero</option>
              <option value="2">Febrero</option>
              <option value="3">Marzo</option>
              <option value="4">Abril</option>
              <option value="5">Mayo</option>
              <option value="6">Junio</option>
              <option value="7">Julio</option>
              <option value="8">Agosto</option>
              <option value="9">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>
          </ng-container>

          <!-- Fechas personalizadas para otros reportes -->
          <ng-container *ngIf="tabActivo !== 'iva' && rangoTipo === 'personalizado'">
            <input type="date" class="control-compact date-small" [(ngModel)]="fechaInicio">
            <span class="sep-text">-</span>
            <input type="date" class="control-compact date-small" [(ngModel)]="fechaFin">
          </ng-container>

          <!-- Generar -->
          <button class="btn-generar" *ngIf="canGenerate" (click)="cargarDatos()" [disabled]="loading">
            <i class="bi" [class.bi-search]="!loading" [class.bi-arrow-repeat]="loading" [class.spin]="loading"></i>
            <span class="ms-2">{{ loading ? 'Cargando...' : 'Generar Reporte' }}</span>
          </button>

          <!-- Exportar PDF -->
          <button class="btn-exportar" *ngIf="canExport" (click)="exportarPDF()">
            <i class="bi bi-file-earmark-pdf"></i>
            <span class="ms-2">Exportar PDF</span>
          </button>
        </div>
      </div>
    </div>

    <!-- LOADING -->
    <div class="loading-state py-5 text-center" *ngIf="loading">
      <div class="spinner-grow text-dark" role="status"></div>
      <p class="mt-3 text-muted fw-bold">Consolidando métricas financieras...</p>
    </div>

    <!-- CONTENIDO CON SCROLL -->
    <div class="reports-scroll-viewport" *ngIf="!loading">
      <app-r028-resumen-ejecutivo
        *ngIf="tabActivo === 'resumen' && resumenData"
        [data]="resumenData"
        [fechaInicio]="fechaInicio"
        [fechaFin]="fechaFin"
        [rangoTipo]="rangoTipo">
      </app-r028-resumen-ejecutivo>
  
      <app-r001-ventas-generales
        *ngIf="tabActivo === 'ventas' && r001Data"
        [data]="r001Data"
        [rangoTipo]="rangoTipo">
      </app-r001-ventas-generales>
  
      <app-r008-cuentas-por-cobrar
        *ngIf="tabActivo === 'cartera' && carteraData"
        [data]="carteraData">
      </app-r008-cuentas-por-cobrar>
  
      <app-r027-iva
        *ngIf="tabActivo === 'iva' && ivaR027Data"
        [data]="ivaR027Data"
        (manualesChange)="ivaR027Manuales = $event">
      </app-r027-iva>
  
      <app-r001-mis-ventas
        *ngIf="tabActivo === 'mis_ventas' && misVentasData"
        [data]="misVentasData"
        [rangoTipo]="rangoTipo">
      </app-r001-mis-ventas>
    </div>

  </ng-container>

  <!-- SIN PERMISO -->
  <ng-template #noPermission>
    <div class="no-permission-container d-flex flex-column align-items-center justify-content-center text-center p-5" style="min-height: 70vh;">
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
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; height: 100%; width: 100%; }
    .reportes-page-container { flex: 1; display: flex; flex-direction: column; height: 100%; overflow: hidden; background: transparent; padding: 0.5rem 0 0 0; }

    /* BARRA PRINCIPAL */
    .header-actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 0.65rem 1.25rem;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      gap: 1.5rem;
      flex-wrap: nowrap;
      flex-shrink: 0;
      margin-bottom: 24px !important;
    }

    /* TABS */
    .tabs-navigation { display: flex; gap: 0.4rem; flex-shrink: 0; }
    .nav-btn {
      background: none; border: none; padding: 0.5rem 1rem; font-weight: 700; color: #64748b;
      border-radius: 12px; transition: all 0.2s cubic-bezier(0.4,0,0.2,1); cursor: pointer;
      white-space: nowrap; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;
    }
    .nav-label { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.1; }
    .nav-name  { font-size: 0.82rem; font-weight: 700; }
    .nav-code  { font-size: 0.62rem; font-weight: 600; opacity: 0.55; letter-spacing: 0.03em; }
    .nav-btn:hover { background: #f1f5f9; color: black; }
    .nav-btn.active { background: var(--primary-color); color: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

    /* FILTROS */
    .filters-actions { flex-shrink: 0; }

    .select-compact {
      border-radius: 10px; border: 1px solid #e2e8f0; padding: 0.4rem 0.6rem;
      font-weight: 700; font-size: 0.8rem; color: black; background: #f8fafc;
      min-width: 120px; cursor: pointer; outline: none;
    }
    .control-compact {
      border-radius: 10px; border: 1px solid #e2e8f0; padding: 0.4rem 0.5rem;
      font-weight: 600; font-size: 0.75rem; color: black; background: #f8fafc; outline: none;
    }
    .date-small { width: 110px; }
    .sep-text { font-size: 0.75rem; font-weight: 900; color: #cbd5e1; }

    .btn-generar {
      background: var(--primary-color); color: #fff; border: none;
      padding: 0.4rem 1rem; border-radius: 10px; font-weight: 700; font-size: 0.8rem;
      display: flex; align-items: center; cursor: pointer; white-space: nowrap; transition: all 0.2s;
    }
    .btn-generar:hover:not(:disabled) { background: #000; transform: scale(1.03); }
    .btn-generar:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-exportar {
      background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;
      padding: 0.4rem 0.9rem; border-radius: 10px; font-weight: 800; font-size: 0.8rem;
      display: flex; align-items: center; cursor: pointer; white-space: nowrap; transition: all 0.2s;
    }
    .btn-exportar:hover { background: #fef2f2; border-color: #fca5a5; transform: translateY(-1px); }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }

    /* LOADING */
    .loading-state { background: white; border-radius: 20px; border: 1px dashed #cbd5e1; }

    .icon-lock-wrapper {
      width: 100px; height: 100px; background: #fff1f2; border: 1px solid #fecaca;
      border-radius: 30px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 15px 35px -10px rgba(225,29,72,0.15);
    }

    /* VIEWPORT DE SCROLL */
    .reports-scroll-viewport {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 4px; /* Evitar layout shift */
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* Scrollbar minimalista */
    .reports-scroll-viewport::-webkit-scrollbar { width: 6px; }
    .reports-scroll-viewport::-webkit-scrollbar-track { background: transparent; }
    .reports-scroll-viewport::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .reports-scroll-viewport::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class ReportesPage implements OnInit {
  
  get canView(): boolean {
    return this.permissionsService.hasPermission(REPORTES_PERMISSIONS.VER);
  }

  get canGenerate(): boolean {
    return this.permissionsService.hasPermission(REPORTES_PERMISSIONS.GENERAR);
  }

  get canExport(): boolean {
    return this.permissionsService.hasPermission(REPORTES_PERMISSIONS.EXPORTAR);
  }

  get isAdminEmpresa(): boolean {
    return this.permissionsService.isAdminEmpresa;
  }

  tabActivo: Tab = 'resumen';
  loading = false;

  rangoTipo: RangoTipo = 'mes_actual';
  fechaInicio = '';
  fechaFin = '';

  // Filtro específico R-027 (año + mes)
  ivaAnio: number = new Date().getFullYear();
  ivaMes: number = new Date().getMonth() === 0 ? 12 : new Date().getMonth(); // mes anterior por defecto
  get ivaAnios(): number[] {
    const cur = new Date().getFullYear();
    return [cur, cur - 1, cur - 2, cur - 3];
  }

  resumenData?: ExecutiveSummary;
  r001Data?: R001Report;
  ventasData?: SalesGeneralReport;
  carteraData?: AccountsReceivableReport;
  ivaData?: IVAReport;
  ivaR027Data?: IvaR027Report;
  ivaR027Manuales = { manual507: 0, manual503: 0 };
  misVentasData?: MisVentasReport;

  private permissionsService = inject(PermissionsService);

  constructor(
    private reportsSvc: FinancialReportsService,
    private ui: UiService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initDefaultDates();
    
    // Si no es admin de empresa, forzar la vista de 'mis_ventas'
    if (!this.isAdminEmpresa) {
      this.tabActivo = 'mis_ventas';
    }

    // Solo cargar datos si tiene permiso de generar
    if (this.canGenerate) {
      this.cargarDatos();
      this.cdr.detectChanges();
    }
  }

  private initDefaultDates() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.fechaInicio = this.formatDate(firstDay);
    this.fechaFin = this.formatDate(today);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onIvaFechaChange() {
    const y = this.ivaAnio;
    const m = Number(this.ivaMes);
    const lastDay = new Date(y, m, 0).getDate();
    this.fechaInicio = `${y}-${String(m).padStart(2, '0')}-01`;
    this.fechaFin    = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    this.cdr.detectChanges();
  }

  onRangoChangeInternal() {
    const today = new Date();
    switch (this.rangoTipo) {
      case 'mes_actual':
        this.fechaInicio = this.formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
        this.fechaFin = this.formatDate(today);
        break;
      case 'mes_anterior':
        this.fechaInicio = this.formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
        this.fechaFin = this.formatDate(new Date(today.getFullYear(), today.getMonth(), 0));
        break;
      case 'anio_actual':
        this.fechaInicio = this.formatDate(new Date(today.getFullYear(), 0, 1));
        this.fechaFin = this.formatDate(today);
        break;
      case 'semestre_1':
        this.fechaInicio = this.formatDate(new Date(today.getFullYear(), 0, 1));
        this.fechaFin = this.formatDate(new Date(today.getFullYear(), 5, 30));
        break;
      case 'semestre_2':
        this.fechaInicio = this.formatDate(new Date(today.getFullYear(), 6, 1));
        this.fechaFin = this.formatDate(new Date(today.getFullYear(), 11, 31));
        break;
    }
    this.cdr.detectChanges();
  }

  setTab(tab: Tab) {
    if (this.tabActivo === tab) return;
    this.tabActivo = tab;
    // Al entrar al R-027 IVA, poner mes anterior por defecto
    if (tab === 'iva') {
      this.rangoTipo = 'mes_anterior';
      this.onRangoChangeInternal();
    }
    this.cargarDatos();
  }

  cargarDatos() {
    if (!this.canGenerate) return;
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
        this.r001Data = undefined;
        this.reportsSvc.getR001Report(this.fechaInicio, this.fechaFin).subscribe({
          next: (d) => { this.r001Data = d; this.finishLoading(); },
          error: () => this.handleError('Error al cargar reporte de ventas generales')
        });
        break;

      case 'cartera':
        this.carteraData = undefined;
        this.reportsSvc.getAccountsReceivable(this.fechaInicio, this.fechaFin).subscribe({
          next: (d) => { this.carteraData = d; this.finishLoading(); },
          error: () => this.handleError('Error al cargar reporte de cartera')
        });
        break;

      case 'iva':
        this.ivaR027Data = undefined;
        this.reportsSvc.getIvaR027(this.fechaInicio, this.fechaFin).subscribe({
          next: (d) => { this.ivaR027Data = d; this.finishLoading(); },
          error: () => this.handleError('Error al cargar IVA')
        });
        break;

      case 'mis_ventas':
        this.misVentasData = undefined;
        this.reportsSvc.getMisVentas(this.fechaInicio, this.fechaFin).subscribe({
          next: (d) => { this.misVentasData = d; this.finishLoading(); },
          error: () => this.handleError('Error al cargar Mis Ventas')
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
    if (!this.canExport) return;
    if (!this.fechaInicio || !this.fechaFin) return;

    // Mis Ventas usa su propio endpoint (filtra por usuario del token)
    if (this.tabActivo === 'mis_ventas') {
      this.ui.showToast('Optimizando documento...', 'info');
      this.reportsSvc.exportarMisVentasPDF(this.fechaInicio, this.fechaFin).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `mis-ventas_${this.fechaInicio}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          this.ui.showToast('Documento descargado con éxito', 'success');
          this.cdr.detectChanges();
        },
        error: () => { this.ui.showToast('Error al generar el documento', 'danger'); this.cdr.detectChanges(); }
      });
      return;
    }

    let tipo = '';
    switch (this.tabActivo) {
      case 'resumen': tipo = 'FINANCIERO_RESUMEN'; break;
      case 'ventas':  tipo = 'VENTAS_GENERAL'; break;
      case 'cartera': tipo = 'FINANCIERO_CARTERA'; break;
      case 'iva':     tipo = 'FINANCIERO_IVA'; break;
    }
    if (!tipo) return;

    this.ui.showToast('Optimizando documento...', 'info');
    const extras = tipo === 'FINANCIERO_IVA' ? this.ivaR027Manuales : undefined;
    this.reportsSvc.exportarReportePDF(tipo, this.fechaInicio, this.fechaFin, extras).subscribe({
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




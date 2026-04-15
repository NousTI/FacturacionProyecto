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

export type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'semestre_1' | 'semestre_2' | 'personalizado';
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
        <ng-container *ngIf="isAdmin">
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
          <!-- Selector de rango — R-027 tiene opciones específicas -->
          <select class="select-compact" [(ngModel)]="rangoTipo" (change)="onRangoChangeInternal()">
            <ng-container *ngIf="tabActivo === 'iva'; else otrosRangos">
              <option value="mes_anterior">Mes Anterior</option>
              <option value="mes_actual">Mes Actual</option>
              <option value="semestre_1">Semestre 1 (Ene–Jun)</option>
              <option value="semestre_2">Semestre 2 (Jul–Dic)</option>
              <option value="personalizado">Personalizado</option>
            </ng-container>
            <ng-template #otrosRangos>
              <option value="mes_actual">Mes Actual</option>
              <option value="mes_anterior">Mes Anterior</option>
              <option value="anio_actual">Año Actual</option>
              <option value="personalizado">Personalizado</option>
            </ng-template>
          </select>

          <!-- Fechas personalizadas -->
          <ng-container *ngIf="rangoTipo === 'personalizado'">
            <input type="date" class="control-compact date-small" [(ngModel)]="fechaInicio">
            <span class="sep-text">-</span>
            <input type="date" class="control-compact date-small" [(ngModel)]="fechaFin">
          </ng-container>

          <!-- Generar -->
          <button class="btn-generar" (click)="cargarDatos()" [disabled]="loading">
            <i class="bi" [class.bi-search]="!loading" [class.bi-arrow-repeat]="loading" [class.spin]="loading"></i>
            <span class="ms-2">{{ loading ? 'Cargando...' : 'Generar Reporte' }}</span>
          </button>

          <!-- Exportar PDF -->
          <button class="btn-exportar" (click)="exportarPDF()">
            <i class="bi bi-file-earmark-pdf"></i>
            <span class="ms-2">Exportar PDF</span>
          </button>
        </div>
      </div>
    </div>

    <!-- LOADING -->
    <div class="loading-state py-5 text-center" *ngIf="loading">
      <div class="spinner-grow text-primary" role="status"></div>
      <p class="mt-3 text-muted fw-bold">Consolidando métricas financieras...</p>
    </div>

    <!-- CONTENIDO -->
    <ng-container *ngIf="!loading">
      <app-r028-resumen-ejecutivo
        *ngIf="tabActivo === 'resumen' && resumenData"
        [data]="resumenData">
      </app-r028-resumen-ejecutivo>

      <app-r001-ventas-generales
        *ngIf="tabActivo === 'ventas' && r001Data"
        [data]="r001Data">
      </app-r001-ventas-generales>

      <app-r008-cuentas-por-cobrar
        *ngIf="tabActivo === 'cartera' && carteraData"
        [data]="carteraData">
      </app-r008-cuentas-por-cobrar>

      <app-r027-iva
        *ngIf="tabActivo === 'iva' && ivaR027Data"
        [data]="ivaR027Data">
      </app-r027-iva>

      <app-r001-mis-ventas
        *ngIf="tabActivo === 'mis_ventas' && misVentasData"
        [data]="misVentasData">
      </app-r001-mis-ventas>
    </ng-container>

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
    .reportes-page-container { padding: 1.5rem; background: #f8fafc; min-height: 100vh; }

    /* BARRA PRINCIPAL */
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
    .nav-btn:hover { background: #f1f5f9; color: #0f172a; }
    .nav-btn.active { background: #1e293b; color: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

    /* FILTROS */
    .filters-actions { flex-shrink: 0; }

    .select-compact {
      border-radius: 10px; border: 1px solid #e2e8f0; padding: 0.4rem 0.6rem;
      font-weight: 700; font-size: 0.8rem; color: #1e293b; background: #f8fafc;
      min-width: 120px; cursor: pointer; outline: none;
    }
    .control-compact {
      border-radius: 10px; border: 1px solid #e2e8f0; padding: 0.4rem 0.5rem;
      font-weight: 600; font-size: 0.75rem; color: #1e293b; background: #f8fafc; outline: none;
    }
    .date-small { width: 110px; }
    .sep-text { font-size: 0.75rem; font-weight: 900; color: #cbd5e1; }

    .btn-generar {
      background: #1e293b; color: #fff; border: none;
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
  `]
})
export class ReportesPage implements OnInit {
  isAdmin = false;

  get canView(): boolean {
    return this.permissionsService.hasPermission(REPORTES_PERMISSIONS.VER);
  }

  tabActivo: Tab = 'resumen';
  loading = false;

  rangoTipo: RangoTipo = 'mes_actual';
  fechaInicio = '';
  fechaFin = '';

  resumenData?: ExecutiveSummary;
  r001Data?: R001Report;
  ventasData?: SalesGeneralReport;
  carteraData?: AccountsReceivableReport;
  ivaData?: IVAReport;
  ivaR027Data?: IvaR027Report;
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
    this.authService.getPerfil().subscribe({
      next: (perfil: any) => {
        const rolCodigo = (perfil?.rol_codigo || '').toUpperCase();
        this.isAdmin = rolCodigo === 'ADMIN_EMPRESA';
        if (!this.isAdmin) this.tabActivo = 'mis_ventas';
        this.cargarDatos();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isAdmin = false;
        this.tabActivo = 'mis_ventas';
        this.cargarDatos();
      }
    });
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
    // Al entrar al R-027 IVA, cambiar a mes anterior por defecto
    if (tab === 'iva' && this.rangoTipo !== 'personalizado' && this.rangoTipo !== 'semestre_1' && this.rangoTipo !== 'semestre_2') {
      this.rangoTipo = 'mes_anterior';
      this.onRangoChangeInternal();
    }
    this.cargarDatos();
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

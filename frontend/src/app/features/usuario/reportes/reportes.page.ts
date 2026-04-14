import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FinancialReportsService,
  PyGReport,
  IVAReport,
  ExecutiveSummary,
  SalesGeneralReport,
  AccountsReceivableReport,
  R001Report
} from './services/financial-reports.service';
import { UiService } from '../../../shared/services/ui.service';
import { inject } from '@angular/core';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { REPORTES_PERMISSIONS } from '../../../constants/permission-codes';

// Sub-componentes
import { ExecutiveSummaryComponent } from './components/executive-summary.component';
import { PygReportComponent } from './components/pyg-report.component';
import { IvaReportComponent } from './components/iva-report.component';
import { SalesGeneralComponent } from './components/sales-general.component';
import { R001VentasGeneralesComponent } from './components/reporte_001/r001-ventas-generales.component';
import { AccountsReceivableComponent } from './components/accounts-receivable.component';

export type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'personalizado';
type Tab = 'resumen' | 'ventas' | 'cartera' | 'pyg' | 'iva';

@Component({
  selector: 'app-usuario-reportes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ExecutiveSummaryComponent,
    PygReportComponent,
    IvaReportComponent,
    SalesGeneralComponent,
    R001VentasGeneralesComponent,
    AccountsReceivableComponent
  ],
  template: `
<div class="reportes-page-container animate__animated animate__fadeIn">

  <ng-container *ngIf="canView; else noPermission">

    <!-- BARRA DE NAVEGACIÓN Y ACCIONES -->
    <div class="header-actions-bar mb-4">
      <div class="tabs-navigation">
        <button class="nav-btn" [class.active]="tabActivo === 'resumen'" (click)="setTab('resumen')">
          <i class="bi bi-speedometer2 me-2"></i>Dashboard Ejecutivo
        </button>
        <button class="nav-btn" [class.active]="tabActivo === 'ventas'" (click)="setTab('ventas')">
          <i class="bi bi-cart-check me-2"></i>Ventas Generales
        </button>
        <button class="nav-btn" [class.active]="tabActivo === 'cartera'" (click)="setTab('cartera')">
          <i class="bi bi-person-lines-fill me-2"></i>Cartera
        </button>
        <button class="nav-btn" [class.active]="tabActivo === 'pyg'" (click)="setTab('pyg')">
          <i class="bi bi-calculator me-2"></i>P &amp; G
        </button>
        <button class="nav-btn" [class.active]="tabActivo === 'iva'" (click)="setTab('iva')">
          <i class="bi bi-receipt me-2"></i>IVA
        </button>
      </div>

      <div class="filters-actions">
        <div class="d-flex align-items-center gap-2">
          <!-- Selector de rango -->
          <select class="select-compact" [(ngModel)]="rangoTipo" (change)="onRangoChangeInternal()">
            <option value="mes_actual">Mes Actual</option>
            <option value="mes_anterior">Mes Anterior</option>
            <option value="anio_actual">Año Actual</option>
            <option value="personalizado">Personalizado</option>
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
      <app-executive-summary
        *ngIf="tabActivo === 'resumen' && resumenData"
        [data]="resumenData">
      </app-executive-summary>

      <app-r001-ventas-generales
        *ngIf="tabActivo === 'ventas' && r001Data"
        [data]="r001Data">
      </app-r001-ventas-generales>

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
      background: none; border: none; padding: 0.65rem 1.1rem; font-weight: 700; color: #64748b;
      border-radius: 12px; transition: all 0.2s cubic-bezier(0.4,0,0.2,1); cursor: pointer;
      white-space: nowrap; display: flex; align-items: center; font-size: 0.85rem;
    }
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
  pygData?: PyGReport;
  ivaData?: IVAReport;

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
    }
    this.cdr.detectChanges();
  }

  setTab(tab: Tab) {
    if (this.tabActivo === tab) return;
    this.tabActivo = tab;
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
      case 'ventas':  tipo = 'VENTAS_GENERAL'; break;
      case 'cartera': tipo = 'FINANCIERO_CARTERA'; break;
      case 'pyg':     tipo = 'FINANCIERO_PYG'; break;
      case 'iva':     tipo = 'FINANCIERO_IVA'; break;
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

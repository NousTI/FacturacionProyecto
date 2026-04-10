import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  ReportesService, ReporteUso
} from '../../services/reportes.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'mes_especifico' | 'anio_especifico' | 'personalizado';

@Component({
  selector: 'app-r-033-uso',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoTooltipComponent],
  template: `
    <div class="section-header mb-4">
      <div>
        <h5 class="section-title">R-033 — Uso del Sistema por Empresa</h5>
        <p class="section-sub">Métricas de uso para detectar empresas cerca del límite de su plan</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn-generar" (click)="generar()" [disabled]="loading">
          <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!loading" class="bi bi-arrow-clockwise me-2"></i>
          {{ loading ? 'Generando...' : 'Generar Reporte' }}
        </button>
        <button class="btn-pdf" (click)="exportarPDF()" [disabled]="!datos || loadingPDF">
          <span *ngIf="loadingPDF" class="spinner-border spinner-border-sm me-2"></span>
          <i *ngIf="!loadingPDF" class="bi bi-file-earmark-pdf me-2"></i>
          {{ loadingPDF ? 'Generando PDF...' : 'Exportar PDF' }}
        </button>
      </div>
    </div>

    <!-- Filtros R-033 -->
    <div class="filtros-card mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label-sm">Rango</label>
          <select class="form-select form-select-sm" [(ngModel)]="rangoTipo" (change)="onRangoChange()">
            <option value="mes_actual">Mes actual</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="anio_actual">Año actual</option>
            <option value="mes_especifico">Mes específico</option>
            <option value="anio_especifico">Año específico</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'mes_especifico'">
          <label class="form-label-sm">Mes</label>
          <select class="form-select form-select-sm" [(ngModel)]="mesFiltro" (change)="onRangoChange()">
            <option *ngFor="let m of meses; let i = index" [value]="i+1">{{ m }}</option>
          </select>
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'mes_especifico' || rangoTipo === 'anio_especifico'">
          <label class="form-label-sm">Año</label>
          <input type="number" class="form-control form-control-sm" [(ngModel)]="anioFiltro" (change)="onRangoChange()" [min]="2020" [max]="anioActual">
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'personalizado'">
          <label class="form-label-sm">Desde</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaInicio">
        </div>
        <div class="col-md-2" *ngIf="rangoTipo === 'personalizado'">
          <label class="form-label-sm">Hasta</label>
          <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaFin">
        </div>
        <div class="col-auto">
          <span class="rango-preview">{{ fechaInicio }} → {{ fechaFin }}</span>
        </div>
      </div>
    </div>

    <div class="empty-state" *ngIf="!datos && !loading">
      <i class="bi bi-speedometer2"></i>
      <p>Presiona <strong>Generar Reporte</strong> para ver el uso del sistema</p>
    </div>
    <div class="loading-state" *ngIf="loading">
      <div class="spinner-grow text-primary" role="status"></div>
      <p>Analizando uso del sistema...</p>
    </div>

    <div *ngIf="datos" id="print-uso">
      <!-- KPIs -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <span class="kpi-label">Promedio usuarios/empresa</span>
          <span class="kpi-value">{{ datos.promedio_usuarios ?? 0 }}</span>
          <span class="kpi-sub text-muted">usuarios por empresa</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Máx. usuarios en una empresa</span>
          <span class="kpi-value">{{ datos.max_usuarios ?? 0 }}</span>
          <span class="kpi-sub text-muted">usuarios</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Mín. usuarios en una empresa</span>
          <span class="kpi-value">{{ datos.min_usuarios ?? 0 }}</span>
          <span class="kpi-sub text-muted">usuarios</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Empresas activas analizadas</span>
          <span class="kpi-value">{{ datos.empresas.length }}</span>
          <span class="kpi-sub text-muted">en el sistema</span>
        </div>
      </div>

      <!-- Gráficas -->
      <div class="row g-4 mb-4">
        <div class="col-md-5">
          <div class="card-graf">
            <h6 class="graf-title">Módulos más usados</h6>
            <div class="donut-modulos-wrap">
              <div *ngFor="let m of datos.modulos_mas_usados" class="modulo-row">
                <span class="modulo-label">{{ m.modulo }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-primary" [style.width.%]="m.porcentaje"></div>
                </div>
                <span class="bar-val">{{ m.porcentaje }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card-graf">
            <h6 class="graf-title">Empresas con más usuarios</h6>
            <div class="bar-chart">
              <div *ngFor="let e of topEmpresasPorUsuarios | slice:0:6" class="bar-row">
                <span class="bar-label">{{ e.empresa | slice:0:14 }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-info" [style.width.%]="barPct(e.total_usuarios, maxUsuariosEmpresa)"></div>
                </div>
                <span class="bar-val">{{ e.total_usuarios }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card-tabla">
        <div class="tabla-header">
          <span><i class="bi bi-table me-2"></i>Uso por empresa ({{ datos.empresas.length }} empresas)</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Empresa</th>
                <th class="text-center">Usuarios</th>
                <th class="text-center">Fact. mes</th>
                <th>% de uso</th>
                <th class="text-center">Módulos</th>
                <th>Último acceso</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of datos.empresas">
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-medium">{{ e.empresa }}</span>
                    <span class="text-muted small">{{ e.plan_nombre || 'Sin plan' }}</span>
                  </div>
                </td>
                <td class="text-center">{{ e.usuarios_activos }}<span class="text-muted">/{{ e.total_usuarios }}</span></td>
                <td class="text-center">{{ e.facturas_mes }}</td>
                <td>
                  <div class="progress-wrap">
                    <div class="progress-bar-custom"
                      [style.width.%]="e.porcentaje_uso"
                      [ngClass]="e.porcentaje_uso >= 80 ? (e.porcentaje_uso >= 95 ? 'bg-danger' : 'bg-warning') : 'bg-success'">
                    </div>
                    <span class="progress-label">{{ e.porcentaje_uso }}%</span>
                  </div>
                </td>
                <td class="text-center">
                  <span class="modulos-badge">{{ e.modulos_usados }}<span class="text-muted">/{{ e.modulos_total }}</span></span>
                </td>
                <td class="text-muted small">{{ formatAcceso(e.ultimo_acceso) }}</td>
              </tr>
              <tr *ngIf="datos.empresas.length === 0">
                <td colspan="6" class="text-center text-muted py-4">Sin datos disponibles</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }
    .section-title { font-size: 1.1rem; font-weight: 700; color: #161d35; margin: 0; }
    .section-sub { color: #64748b; font-size: 0.85rem; margin: 0.25rem 0 0; }
    .btn-generar { padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn-pdf { padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .btn-generar:disabled, .btn-pdf:disabled { opacity: 0.5; cursor: not-allowed; }
    .filtros-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1rem; }
    .form-label-sm { font-size: 0.75rem; font-weight: 600; color: #374151; display: block; margin-bottom: 0.25rem; }
    .form-select-sm, .form-control-sm { font-size: 0.8rem; padding: 0.25rem 0.5rem; }
    .rango-preview { color: #64748b; font-size: 0.8rem; }
    .empty-state, .loading-state { text-align: center; padding: 3rem 1rem; color: #64748b; }
    .spinner-grow { width: 2rem; height: 2rem; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem; background: #f8fafc; }
    .kpi-label { font-size: 0.6rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 0.25rem; }
    .kpi-value { font-size: 1.1rem; font-weight: 800; color: #161d35; display: block; }
    .kpi-sub { font-size: 0.7rem; color: #64748b; }
    .card-graf { border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; background: #f8fafc; }
    .graf-title { font-size: 0.85rem; font-weight: 700; color: #161d35; margin-bottom: 0.75rem; }
    .donut-modulos-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
    .modulo-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; }
    .modulo-label { width: 100px; white-space: nowrap; }
    .bar-track { flex: 1; height: 1.5rem; background: #e2e8f0; border-radius: 3px; position: relative; }
    .bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .bar-val { width: 40px; text-align: right; font-weight: 600; }
    .bar-chart { display: flex; flex-direction: column; gap: 0.5rem; }
    .bar-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; }
    .bar-label { width: 80px; white-space: nowrap; }
    .card-tabla { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
    .tabla-header { background: #f1f5f9; padding: 0.75rem 1rem; font-weight: 700; font-size: 0.8rem; color: #475569; }
    table { margin-bottom: 0; }
    th { background: #f1f5f9; padding: 0.5rem 0.75rem; font-size: 0.7rem; text-transform: uppercase; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.8rem; }
    tbody tr:nth-child(even) td { background: #fafbfc; }
    .progress-wrap { display: flex; align-items: center; gap: 0.25rem; height: 1.5rem; }
    .progress-bar-custom { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .progress-label { font-size: 0.65rem; font-weight: 600; white-space: nowrap; }
    .modulos-badge { font-size: 0.75rem; font-weight: 600; background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; }
  `]
})
export class R033UsoComponent implements OnInit, OnDestroy {

  datos: ReporteUso | null = null;
  loading = false;
  loadingPDF = false;

  rangoTipo: RangoTipo = 'mes_actual';
  mesFiltro = new Date().getMonth() + 1;
  anioFiltro = new Date().getFullYear();
  fechaInicio = '';
  fechaFin = '';

  anioActual = new Date().getFullYear();
  meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.onRangoChange();
    this.generar();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRangoChange() {
    const now = new Date();
    switch (this.rangoTipo) {
      case 'mes_actual':
        this.fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        this.fechaFin = now.toISOString().split('T')[0];
        break;
      case 'mes_anterior': {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        this.fechaInicio = prev.toISOString().split('T')[0];
        this.fechaFin = prevEnd.toISOString().split('T')[0];
        break;
      }
      case 'anio_actual':
        this.fechaInicio = `${now.getFullYear()}-01-01`;
        this.fechaFin = now.toISOString().split('T')[0];
        break;
      case 'mes_especifico': {
        const y = this.anioFiltro, m = this.mesFiltro;
        this.fechaInicio = `${y}-${String(m).padStart(2,'0')}-01`;
        const lastDay = new Date(y, m, 0).getDate();
        this.fechaFin = `${y}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
        break;
      }
      case 'anio_especifico':
        this.fechaInicio = `${this.anioFiltro}-01-01`;
        this.fechaFin = `${this.anioFiltro}-12-31`;
        break;
    }
  }

  generar() {
    this.loading = true;
    this.reportesService.getReporteUso({ fecha_inicio: this.fechaInicio, fecha_fin: this.fechaFin })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.datos = data; this.loading = false; this.cd.detectChanges(); },
        error: (err) => { this.loading = false; this.uiService.showError(err, 'Error al cargar uso del sistema'); this.cd.detectChanges(); }
      });
  }

  exportarPDF() {
    this.loadingPDF = true;
    this.uiService.showToast('Generando Reporte de Uso...', 'info', 'Esto puede tardar unos segundos', 8000);
    this.cd.detectChanges();

    this.reportesService.exportarPDF('SUPERADMIN_USO', {
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_uso_${new Date().getTime()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.uiService.showToast('PDF generado exitosamente', 'success', 'El archivo ha sido descargado', 4000);
      },
      error: (err) => {
        console.error('Error exportando PDF:', err);
        this.uiService.showError(err, 'Error al generar PDF');
      }
    }).add(() => {
      this.loadingPDF = false;
      this.cd.detectChanges();
    });
  }

  get topEmpresasPorUsuarios() {
    return [...(this.datos?.empresas ?? [])].sort((a,b) => b.total_usuarios - a.total_usuarios);
  }

  get maxUsuariosEmpresa(): number {
    return Math.max(...(this.datos?.empresas.map(e => e.total_usuarios) ?? [1]));
  }

  barPct(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  formatAcceso(fecha: string | null): string {
    if (!fecha) return 'Sin acceso';
    const d = new Date(fecha);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Hoy, ' + d.toLocaleTimeString('es-EC', {hour:'2-digit', minute:'2-digit'});
    if (diffDays === 1) return 'Ayer, ' + d.toLocaleTimeString('es-EC', {hour:'2-digit', minute:'2-digit'});
    if (diffDays < 30) return `Hace ${diffDays} días`;
    return d.toLocaleDateString('es-EC', {day:'2-digit',month:'short',year:'numeric'});
  }
}

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  ReportesService, ReporteComisiones
} from '../../services/reportes.service';
import { VendedorService, Vendedor } from '../../../vendedores/services/vendedor.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'mes_especifico' | 'anio_especifico' | 'personalizado';

@Component({
  selector: 'app-r-032-comisiones',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoTooltipComponent],
  template: `
    <div class="section-header mb-4">
      <div>
        <h5 class="section-title">R-032 — Comisiones por Vendedor</h5>
        <p class="section-sub">Control de comisiones generadas, estados de aprobación y pago</p>
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

    <!-- Filtros comisiones -->
    <div class="filtros-card mb-4">
      <div class="row g-3 align-items-end">
        <!-- Rango de fechas -->
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
        <!-- Vendedor -->
        <div class="col-md-3">
          <label class="form-label-sm">Vendedor</label>
          <select class="form-select form-select-sm" [(ngModel)]="vendedorId">
            <option value="">Todos</option>
            <option *ngFor="let v of vendedores" [value]="v.id">{{ v.nombres }} {{ v.apellidos }}</option>
          </select>
        </div>
        <!-- Estado -->
        <div class="col-md-2">
          <label class="form-label-sm">Estado</label>
          <select class="form-select form-select-sm" [(ngModel)]="estado">
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="APROBADA">Aprobada</option>
            <option value="PAGADA">Pagada</option>
          </select>
        </div>
      </div>
    </div>

    <div class="empty-state" *ngIf="!datos && !loading">
      <i class="bi bi-cash-stack"></i>
      <p>Configura los filtros y presiona <strong>Generar Reporte</strong></p>
    </div>
    <div class="loading-state" *ngIf="loading">
      <div class="spinner-grow text-primary" role="status"></div>
      <p>Calculando comisiones...</p>
    </div>

    <div *ngIf="datos" id="print-comisiones">
      <!-- KPIs -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card kpi-warning">
          <span class="kpi-label">Comisiones pendientes</span>
          <span class="kpi-value">{{ datos.kpis.comisiones_pendientes | currency:'USD':'symbol':'1.2-2' }}</span>
          <span class="kpi-sub text-warning">de aprobación</span>
        </div>
        <div class="kpi-card kpi-success">
          <span class="kpi-label">Pagadas este mes</span>
          <span class="kpi-value">{{ datos.kpis.pagadas_mes | currency:'USD':'symbol':'1.2-2' }}</span>
          <span class="kpi-sub text-success">ya procesadas</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Vendedores activos</span>
          <span class="kpi-value">{{ datos.kpis.vendedores_activos }}</span>
          <span class="kpi-sub text-muted">en el sistema</span>
        </div>
        <div class="kpi-card kpi-success">
          <span class="kpi-label">Upgrades concretados</span>
          <span class="kpi-value">{{ datos.kpis.porcentaje_upgrades ?? 0 }}%</span>
          <span class="kpi-sub text-success">de éxito</span>
        </div>
        <div class="kpi-card kpi-danger">
          <span class="kpi-label">Clientes perdidos</span>
          <span class="kpi-value">{{ datos.kpis.porcentaje_clientes_perdidos ?? 0 }}%</span>
          <span class="kpi-sub text-danger">en zona rescate</span>
        </div>
      </div>

      <!-- Gráficas -->
      <div class="row g-4 mb-4">
        <div class="col-md-6">
          <div class="card-graf">
            <h6 class="graf-title">Top vendedores por ingresos</h6>
            <div class="bar-chart">
              <div *ngFor="let v of datos.top_vendedores | slice:0:5" class="bar-row">
                <span class="bar-label">{{ v.vendedor.split(' ')[0] }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-primary" [style.width.%]="barPct(v.ingresos_generados, maxVendedorIngresos)"></div>
                </div>
                <span class="bar-val">{{ v.ingresos_generados | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card-graf">
            <h6 class="graf-title">Planes más vendidos</h6>
            <div class="bar-chart">
              <div *ngFor="let p of datos.planes_mas_vendidos" class="bar-row">
                <span class="bar-label">{{ p.plan }}</span>
                <div class="bar-track">
                  <div class="bar-fill bg-success" [style.width.%]="barPct(p.ventas, maxPlanVentas)"></div>
                </div>
                <span class="bar-val">{{ p.ventas }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla detalle -->
      <div class="card-tabla">
        <div class="tabla-header">
          <span><i class="bi bi-table me-2"></i>Detalle de comisiones ({{ datos.detalle.length }} registros)</span>
        </div>
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Empresa</th>
                <th>Tipo de venta</th>
                <th>Plan</th>
                <th class="text-end">Comisión</th>
                <th class="text-center">Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of datos.detalle">
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-sm">{{ c.vendedor.charAt(0) }}</div>
                    {{ c.vendedor }}
                  </div>
                </td>
                <td class="text-muted small">{{ c.empresa }}</td>
                <td><span class="badge-tipo" [ngClass]="tipoVentaClass(c.tipo_venta)">{{ c.tipo_venta }}</span></td>
                <td><span class="badge-plan">{{ c.plan }}</span></td>
                <td class="text-end fw-bold">{{ c.comision | currency }}</td>
                <td class="text-center">
                  <div class="d-flex align-items-center justify-content-center">
                    <span class="badge-estado" [ngClass]="estadoComisionClass(c.estado)">
                      {{ c.estado }}
                    </span>
                    <app-info-tooltip
                      *ngIf="c.estado === 'PENDIENTE'"
                      message="En espera de ciclo de pago"
                      icon="bi-clock-history">
                    </app-info-tooltip>
                  </div>
                </td>
                <td class="text-muted small">{{ c.fecha || '—' }}</td>
              </tr>
              <tr *ngIf="datos.detalle.length === 0">
                <td colspan="7" class="text-center text-muted py-4">Sin comisiones con los filtros seleccionados</td>
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
    .empty-state, .loading-state { text-align: center; padding: 3rem 1rem; color: #64748b; }
    .spinner-grow { width: 2rem; height: 2rem; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem; background: #f8fafc; }
    .kpi-label { font-size: 0.6rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 0.25rem; }
    .kpi-value { font-size: 1.1rem; font-weight: 800; color: #161d35; display: block; }
    .kpi-sub { font-size: 0.7rem; color: #64748b; }
    .kpi-warning { border-left: 3px solid #f59e0b; }
    .kpi-danger { border-left: 3px solid #ef4444; }
    .kpi-success { border-left: 3px solid #10b981; }
    .card-graf { border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem; background: #f8fafc; }
    .graf-title { font-size: 0.85rem; font-weight: 700; color: #161d35; margin-bottom: 0.75rem; }
    .bar-chart { display: flex; flex-direction: column; gap: 0.5rem; }
    .bar-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; }
    .bar-label { width: 60px; white-space: nowrap; }
    .bar-track { flex: 1; height: 1.5rem; background: #e2e8f0; border-radius: 3px; position: relative; }
    .bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .bar-val { width: 50px; text-align: right; font-weight: 600; }
    .card-tabla { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
    .tabla-header { background: #f1f5f9; padding: 0.75rem 1rem; font-weight: 700; font-size: 0.8rem; color: #475569; }
    table { margin-bottom: 0; }
    th { background: #f1f5f9; padding: 0.5rem 0.75rem; font-size: 0.7rem; text-transform: uppercase; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.8rem; }
    tbody tr:nth-child(even) td { background: #fafbfc; }
    .avatar-sm { width: 1.75rem; height: 1.75rem; background: #dbeafe; color: #1e40af; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; }
    .badge-tipo { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .tipo-nueva { background: #dcfce7; color: #166534; }
    .tipo-upgrade { background: #fef3c7; color: #92400e; }
    .tipo-renovacion { background: #dbeafe; color: #1e40af; }
    .badge-plan { background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
    .badge-estado { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; cursor: help; }
    .estado-pendiente { background: #fef3c7; color: #92400e; }
    .estado-aprobada { background: #dbeafe; color: #1e40af; }
    .estado-pagada { background: #dcfce7; color: #166534; }
  `]
})
export class R032ComisionesComponent implements OnInit, OnDestroy {

  datos: ReporteComisiones | null = null;
  loading = false;
  loadingPDF = false;

  rangoTipo: RangoTipo = 'mes_actual';
  mesFiltro = new Date().getMonth() + 1;
  anioFiltro = new Date().getFullYear();
  fechaInicio = '';
  fechaFin = '';
  vendedorId = '';
  estado = '';

  vendedores: Vendedor[] = [];
  anioActual = new Date().getFullYear();
  meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private vendedorService: VendedorService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.vendedorService.getVendedores()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Vendedor[]) => this.vendedores = data);
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
    const params: any = {};
    if (this.fechaInicio) params.fecha_inicio = this.fechaInicio;
    if (this.fechaFin) params.fecha_fin = this.fechaFin;
    if (this.vendedorId) params.vendedor_id = this.vendedorId;
    if (this.estado) params.estado = this.estado;

    this.reportesService.getReporteComisiones(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.datos = data; this.loading = false; this.cd.detectChanges(); },
        error: (err) => { this.loading = false; this.uiService.showError(err, 'Error al cargar comisiones'); this.cd.detectChanges(); }
      });
  }

  exportarPDF() {
    this.loadingPDF = true;
    this.uiService.showToast('Generando Reporte de Comisiones...', 'info', 'Esto puede tardar unos segundos', 8000);
    this.cd.detectChanges();

    const params: any = {
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin
    };
    if (this.vendedorId) params.vendedor_id = this.vendedorId;
    if (this.estado) params.estado = this.estado;

    this.reportesService.exportarPDF('SUPERADMIN_COMISIONES', params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_comisiones_${new Date().getTime()}.pdf`;
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

  get maxVendedorIngresos(): number {
    return Math.max(...(this.datos?.top_vendedores.map(v => v.ingresos_generados) ?? [1]));
  }

  get maxPlanVentas(): number {
    return Math.max(...(this.datos?.planes_mas_vendidos.map(p => p.ventas) ?? [1]));
  }

  barPct(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  tipoVentaClass(tipo: string): string {
    if (tipo === 'Nueva') return 'tipo-nueva';
    if (tipo === 'Upgrade') return 'tipo-upgrade';
    return 'tipo-renovacion';
  }

  estadoComisionClass(estado: string): string {
    if (estado === 'PENDIENTE') return 'estado-pendiente';
    if (estado === 'APROBADA') return 'estado-aprobada';
    if (estado === 'PAGADA') return 'estado-pagada';
    return '';
  }
}

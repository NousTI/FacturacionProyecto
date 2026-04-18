import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import {
  ReportesService, ReporteComisiones
} from '../../services/reportes.service';
import { UiService } from '../../../../../shared/services/ui.service';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

Chart.register(...registerables);

type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'personalizado';

@Component({
  selector: 'app-r-032-comisiones',
  standalone: true,
  imports: [CommonModule, FormsModule, InfoTooltipComponent],
  template: `
    <div class="empty-state" *ngIf="!datos && !loading">
      <i class="bi bi-cash-stack"></i>
      <p>Configura los filtros y presiona <strong>Consultar</strong></p>
    </div>
    <div class="loading-state" *ngIf="loading">
      <div class="spinner-grow text-primary" role="status"></div>
      <p>Calculando comisiones...</p>
    </div>

    <div *ngIf="datos" id="print-comisiones" class="animate__animated animate__fadeIn">
      <!-- KPIs -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card kpi-success">
          <span class="kpi-label">Pagadas este mes</span>
          <span class="kpi-value">{{ datos.kpis.pagadas_mes | currency:'USD':'symbol':'1.2-2' }}</span>
          <span class="kpi-sub">ya procesadas</span>
        </div>
        <div class="kpi-card kpi-warning">
          <span class="kpi-label">Comisiones pendientes</span>
          <span class="kpi-value">{{ datos.kpis.comisiones_pendientes | currency:'USD':'symbol':'1.2-2' }}</span>
          <span class="kpi-sub">de aprobación</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Vendedores activos</span>
          <span class="kpi-value">{{ datos.kpis.vendedores_activos }}</span>
          <span class="kpi-sub text-muted">en el sistema</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Upgrades concretados</span>
          <span class="kpi-value">{{ datos.kpis.porcentaje_upgrades ?? 0 }}%</span>
          <span class="kpi-sub text-muted">de éxito</span>
        </div>
        <div class="kpi-card kpi-danger">
          <span class="kpi-label">Clientes perdidos</span>
          <span class="kpi-value">{{ datos.kpis.porcentaje_clientes_perdidos ?? 0 }}%</span>
          <span class="kpi-sub">en zona rescate</span>
        </div>
      </div>

      <!-- Gráficas -->
      <div class="row g-4 mb-4">
        <div class="col-md-6">
          <div class="card-graf">
            <h6 class="graf-title">Top vendedores por ingresos</h6>
            <div class="chart-container-pie">
              <canvas #vendedoresChart></canvas>
            </div>
            <div class="chart-legend mt-2" *ngIf="datos.top_vendedores.length > 0">
              <div *ngFor="let v of datos.top_vendedores | slice:0:5; let i = index" class="legend-item">
                <span class="dot" [style.background-color]="colors[i]"></span>
                <span class="lbl">{{ v.vendedor.split(' ')[0] }} ({{ v.ingresos_generados | currency:'USD':'symbol':'1.0-0' }})</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card-graf">
            <h6 class="graf-title">Planes más vendidos</h6>
            <div class="chart-container-pie">
              <canvas #planesChart></canvas>
            </div>
            <div class="chart-legend mt-2" *ngIf="datos.planes_mas_vendidos.length > 0">
              <div *ngFor="let p of datos.planes_mas_vendidos; let i = index" class="legend-item">
                <span class="dot" [style.background-color]="colors[i]"></span>
                <span class="lbl">{{ p.plan }} ({{ p.ventas }})</span>
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
                    <span *ngIf="datos.top_vendedores.length > 0 && c.vendedor === datos.top_vendedores[0].vendedor"
                          class="top-vendedor-icon" title="Top vendedor">🔺</span>
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
                      icon="bi-info-circle">
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
    .kpi-card {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 0.85rem 1rem;
      min-height: 95px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #e2e8f0; }
    .kpi-label { font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; letter-spacing: 0.05em; }
    .kpi-value { font-size: 1.35rem; font-weight: 800; color: #0f172a; display: block; line-height: 1.2; }
    .kpi-sub { font-size: 0.72rem; font-weight: 600; color: #64748b; }
    .kpi-warning { background: #ffffff; }
    .kpi-danger  { background: #ffffff; }
    .kpi-success {
      background: var(--gradient-highlight);
      border-color: transparent;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
    }
    .kpi-success .kpi-label { color: rgba(255,255,255,0.8); }
    .kpi-success .kpi-value { color: #fff; }
    .kpi-success .kpi-sub   { color: rgba(255,255,255,0.75); }
    .card-graf { border: 1px solid #f1f5f9; border-radius: 16px; padding: 1.25rem; background: #ffffff; height: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .graf-title { font-size: 0.8rem; font-weight: 800; color: #1e293b; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
    .chart-container-pie { position: relative; height: 200px; width: 100%; display: flex; justify-content: center; }
    .chart-legend { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.65rem; color: #4b5563; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .lbl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
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
    .top-vendedor-icon { font-size: 0.75rem; line-height: 1; }
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
  fechaInicio = '';
  fechaFin = '';

  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1'];

  @ViewChild('vendedoresChart') vendedoresChartRef!: ElementRef;
  @ViewChild('planesChart') planesChartRef!: ElementRef;

  private chartVendedores: Chart | null = null;
  private chartPlanes: Chart | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.chartVendedores?.destroy();
    this.chartPlanes?.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  generar() {
    this.loading = true;
    const params: any = {};
    if (this.fechaInicio) params.fecha_inicio = this.fechaInicio;
    if (this.fechaFin) params.fecha_fin = this.fechaFin;

    this.reportesService.getReporteComisiones(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.datos = data;
          this.loading = false;
          this.cd.detectChanges();
          setTimeout(() => this.initCharts(), 100);
        },
        error: (err) => { this.loading = false; this.uiService.showError(err, 'Error al cargar comisiones'); this.cd.detectChanges(); }
      });
  }

  private initCharts() {
    this.chartVendedores?.destroy();
    this.chartPlanes?.destroy();

    if (this.vendedoresChartRef && this.datos?.top_vendedores.length) {
      const top5 = this.datos.top_vendedores.slice(0, 5);
      this.chartVendedores = new Chart(this.vendedoresChartRef.nativeElement.getContext('2d'), {
        type: 'pie',
        data: {
          labels: top5.map(v => v.vendedor.split(' ')[0]),
          datasets: [{ data: top5.map(v => v.ingresos_generados), backgroundColor: this.colors, borderWidth: 1, borderColor: '#fff' }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } }
        }
      });
    }

    if (this.planesChartRef && this.datos?.planes_mas_vendidos.length) {
      this.chartPlanes = new Chart(this.planesChartRef.nativeElement.getContext('2d'), {
        type: 'pie',
        data: {
          labels: this.datos.planes_mas_vendidos.map(p => p.plan),
          datasets: [{ data: this.datos.planes_mas_vendidos.map(p => p.ventas), backgroundColor: this.colors, borderWidth: 1, borderColor: '#fff' }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } }
        }
      });
    }
  }

  exportarPDF() {
    this.loadingPDF = true;
    this.uiService.showToast('Generando Reporte de Comisiones...', 'info', 'Esto puede tardar unos segundos', 8000);
    this.cd.detectChanges();

    const params: any = {
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin
    };

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

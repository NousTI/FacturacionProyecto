import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Chart from 'chart.js/auto';
import { VendedorReportesService, VendedorMetricas } from './services/vendedor-reportes.service';
import { UiService } from '../../../shared/services/ui.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-vendedor-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  template: `
    <div class="reportes-page-container animate__animated animate__fadeIn">
      <!-- METRICAS (DASHBOARD) -->
      <div class="dashboard-layout mb-5">
        <div class="metrics-grid">
          <!-- Tarjeta 1: Total Empresas -->
          <div class="metric-card">
            <div class="metric-icon bg-blue-100 text-blue-600">
              <i class="bi bi-buildings-fill"></i>
            </div>
            <div class="metric-content">
              <h3 class="metric-title">Total Empresas</h3>
              <p class="metric-value">{{ metricas?.total_empresas || 0 }}</p>
              <span class="metric-sub">{{ metricas?.empresas_activas || 0 }} activas</span>
            </div>
          </div>

          <!-- Tarjeta 2: Total Usuarios -->
          <div class="metric-card">
            <div class="metric-icon bg-emerald-100 text-emerald-600">
              <i class="bi bi-people-fill"></i>
            </div>
            <div class="metric-content">
              <h3 class="metric-title">Usuarios</h3>
              <p class="metric-value">{{ metricas?.total_usuarios || 0 }}</p>
              <span class="metric-sub">{{ metricas?.usuarios_activos || 0 }} operativos</span>
            </div>
          </div>

          <!-- Tarjeta 3: Comisiones del Mes -->
          <div class="metric-card">
            <div class="metric-icon bg-amber-100 text-amber-600">
              <i class="bi bi-wallet2"></i>
            </div>
            <div class="metric-content">
              <h3 class="metric-title">Comisiones Mes</h3>
              <p class="metric-value">{{ (metricas?.comisiones_mes || 0) | currency }}</p>
              <span class="metric-sub">Este periodo</span>
            </div>
          </div>

          <!-- Tarjeta 4: Salud de Cartera -->
          <div class="metric-card">
            <div class="metric-icon bg-red-100 text-red-600">
              <i class="bi bi-heart-pulse-fill"></i>
            </div>
            <div class="metric-content">
              <h3 class="metric-title">Salud de Cartera</h3>
              <p class="metric-value">{{ metricas?.empresas_inactivas || 0 }}</p>
              <span class="metric-sub">Inactivas/Canceladas</span>
            </div>
          </div>
        </div>

        <!-- Gráfico de Crecimiento -->
        <div class="metric-card chart-container">
           <canvas id="crecimientoChart"></canvas>
        </div>
      </div>

      <!-- CATALOGO DE REPORTES -->
      <h3 class="section-title mb-3">Catálogo de Exportación</h3>
      <div class="reportes-grid">
        
        <!-- Reporte 1: Mis Empresas (Con Filtros) -->
        <div class="reporte-card">
          <div class="reporte-info">
            <div class="reporte-icon">
              <i class="bi bi-building-down"></i>
            </div>
            <div>
              <h4 class="reporte-title">Directorio de Empresas</h4>
              <p class="reporte-desc">Exporta el listado completo de todas las compañías asignadas a tu cuenta en formato CSV.</p>
            </div>
          </div>
          
          <div class="filtros-box mt-2 mb-3">
             <div class="row g-2">
                <div class="col-6">
                   <label class="small text-muted fw-bold">Desde</label>
                   <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaInicio">
                </div>
                <div class="col-6">
                   <label class="small text-muted fw-bold">Hasta</label>
                   <input type="date" class="form-control form-control-sm" [(ngModel)]="fechaFin">
                </div>
             </div>
          </div>

          <button class="btn-generar mt-auto" [disabled]="isGeneratingEmpresas" (click)="generarReporteEmpresas()">
            <i class="bi" [class]="isGeneratingEmpresas ? 'bi-hourglass-split' : 'bi-file-earmark-excel-fill'"></i>
            {{ isGeneratingEmpresas ? 'Procesando...' : 'Generar y Descargar CSV' }}
          </button>
        </div>

        <!-- Reporte 2: Suscripciones Vencidas -->
        <div class="reporte-card">
          <div class="reporte-info">
            <div class="reporte-icon" style="background: #fee2e2; color: #b91c1c;">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div>
              <h4 class="reporte-title">Suscripciones Vencidas
                 <span class="reporte-badge badge-danger" *ngIf="metricas && metricas.total_vencidas !== undefined">
                    <i class="bi bi-person-x-fill me-1"></i>{{ metricas.total_vencidas }} en riesgo
                 </span>
              </h4>
              <p class="reporte-desc">Revisa qué clientes tienen su plan suspendido o vencido para gestionar renovaciones.</p>
            </div>
          </div>
          <button class="btn-generar mt-auto btn-danger-custom" [disabled]="isGeneratingVencidas || (metricas && metricas.total_vencidas === 0)" (click)="generarReporteVencidas()">
            <i class="bi" [class]="isGeneratingVencidas ? 'bi-hourglass-split' : 'bi-file-earmark-excel-fill'"></i>
            {{ metricas?.total_vencidas === 0 ? 'Sin Registros (Vacío)' : (isGeneratingVencidas ? 'Procesando...' : 'Generar Reporte') }}
          </button>
        </div>

        <!-- Reporte 3: Renovaciones Próximas -->
        <div class="reporte-card">
          <div class="reporte-info">
            <div class="reporte-icon" style="background: #e0f2fe; color: #0284c7;">
              <i class="bi bi-calendar-event-fill"></i>
            </div>
            <div>
              <h4 class="reporte-title">Renovaciones Próximas
                 <span class="reporte-badge badge-info" *ngIf="metricas && metricas.total_proximas !== undefined">
                    <i class="bi bi-clock-history me-1"></i>{{ metricas.total_proximas }} clientes
                 </span>
              </h4>
              <p class="reporte-desc">Adelántate al vencimiento. Listado de clientes cuyo plan caduca en los próximos 15 días.</p>
            </div>
          </div>
          <button class="btn-generar mt-auto btn-info-custom" [disabled]="isGeneratingProximas || (metricas && metricas.total_proximas === 0)" (click)="generarReporteProximas()">
            <i class="bi" [class]="isGeneratingProximas ? 'bi-hourglass-split' : 'bi-file-earmark-excel-fill'"></i>
            {{ metricas?.total_proximas === 0 ? 'Sin Próximos Eventos' : (isGeneratingProximas ? 'Procesando...' : 'Generar Reporte') }}
          </button>
        </div>

        <!-- Reporte 4: Comisiones -->
        <div class="reporte-card">
          <div class="reporte-info">
            <div class="reporte-icon" style="background: #fef3c7; color: #b45309;">
              <i class="bi bi-piggy-bank-fill"></i>
            </div>
            <div>
              <h4 class="reporte-title">Comisiones Generadas
                 <span class="reporte-badge badge-warning" *ngIf="metricas && metricas.monto_comisiones !== undefined">
                    <i class="bi bi-currency-dollar"></i>{{ metricas.monto_comisiones | number:'1.2-2' }} Histórico
                 </span>
              </h4>
              <p class="reporte-desc">Detalle de comisiones aprobadas y pendientes basado en los pagos de tus empresas.</p>
            </div>
          </div>
          <button class="btn-generar mt-auto btn-warning-custom" [disabled]="isGeneratingComisiones || (metricas && metricas.monto_comisiones === 0)" (click)="generarReporteComisiones()">
            <i class="bi" [class]="isGeneratingComisiones ? 'bi-hourglass-split' : 'bi-file-earmark-excel-fill'"></i>
            {{ metricas?.monto_comisiones === 0 ? 'Sin Registros' : (isGeneratingComisiones ? 'Procesando...' : 'Generar Reporte') }}
          </button>
        </div>

      </div>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .reportes-page-container {
      padding: 1rem 0;
      min-height: 100vh;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #161d35;
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      color: #64748b;
      font-size: 0.95rem;
    }

    /* MESA PRINCIPAL */
    .dashboard-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 1200px) {
      .dashboard-layout {
        grid-template-columns: 1fr;
      }
    }

    /* GRID DE MERTICAS */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }

    .metric-card {
      background: white;
      border: 1px solid rgba(0,0,0,0.05);
      border-radius: 20px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
      transition: all 0.3s ease;
    }
    .metric-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
    }

    .metric-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      flex-shrink: 0;
    }
    .bg-blue-100 { background: #dceafe; }
    .text-blue-600 { color: #2563eb; }
    .bg-emerald-100 { background: #d1fae5; }
    .text-emerald-600 { color: #059669; }
    .bg-amber-100 { background: #fef3c7; }
    .text-amber-600 { color: #d97706; }
    .bg-red-100 { background: #fee2e2; }
    .text-red-600 { color: #dc2626; }

    .metric-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }
    .metric-value {
      font-size: 2rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1;
      margin-bottom: 0.35rem;
    }
    .metric-sub {
      font-size: 0.85rem;
      color: #94a3b8;
      font-weight: 500;
    }

    /* CATALOGO REPORTES */
    .section-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #1e293b;
    }

    .reportes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .reporte-card {
      background: white;
      border: 1.5px solid #f1f5f9;
      border-radius: 20px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      transition: all 0.3s ease;
    }
    .reporte-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    }

    .reporte-info {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .reporte-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f8fafc;
      color: #161d35;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .reporte-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .reporte-desc {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.4;
      margin: 0;
    }

    .btn-generar {
      width: 100%;
      padding: 0.85rem;
      border-radius: 12px;
      background: #161d35;
      color: white;
      border: none;
      font-weight: 700;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-generar:hover:not(:disabled) {
      background: #232d4d;
      transform: translateY(-2px);
      box-shadow: 0 8px 15px -3px rgba(22,29,53,0.3);
    }
    .btn-generar:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      cursor: not-allowed;
      border: 1px dashed #cbd5e1;
      box-shadow: none;
    }
    
    .btn-danger-custom { background: #b91c1c; }
    .btn-danger-custom:hover:not(:disabled) { background: #991b1b; box-shadow: 0 8px 15px -3px rgba(185,28,28,0.3); }
    
    .btn-warning-custom { background: #d97706; }
    .btn-warning-custom:hover:not(:disabled) { background: #b45309; box-shadow: 0 8px 15px -3px rgba(217,119,6,0.3); }

    .btn-info-custom { background: #0ea5e9; }
    .btn-info-custom:hover:not(:disabled) { background: #0284c7; box-shadow: 0 8px 15px -3px rgba(14,165,233,0.3); }

    .reporte-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-left: 0.65rem;
      vertical-align: middle;
      white-space: nowrap;
    }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .badge-info { background: #e0f2fe; color: #0284c7; }
    .badge-warning { background: #fef3c7; color: #b45309; }

    .chart-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 250px;
      padding: 1rem;
    }
  `]
})
export class VendedorReportesPage implements OnInit, OnDestroy {
  metricas: any = null;
  isGeneratingEmpresas = false;
  isGeneratingVencidas = false;
  isGeneratingProximas = false;
  isGeneratingComisiones = false;
  
  fechaInicio: string = '';
  fechaFin: string = '';

  private destroy$ = new Subject<void>();
  private chartInstance: any = null;

  constructor(
    private reportesService: VendedorReportesService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarMetricas();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarMetricas() {
    this.reportesService.getMetricas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.metricas = data;
          this.renderChart(data.tendencia_crecimiento);
          this.cd.detectChanges();
        },
        error: (err) => {
          this.uiService.showError(err, 'No se pudieron cargar las métricas');
        }
      });
  }

  generarReporteEmpresas() {
    this.isGeneratingEmpresas = true;
    
    // Pasar parametros de fecha si existen
    const params: any = {};
    if (this.fechaInicio) params.fecha_inicio = this.fechaInicio;
    if (this.fechaFin) params.fecha_fin = this.fechaFin;
    
    this.reportesService.generarReporte('MIS_EMPRESAS', 'Reporte Mis Empresas - Directorio', params)
      .subscribe({
        next: (res) => {
          this.isGeneratingEmpresas = false;
          this.uiService.showToast('Reporte generado exitosamente', 'success');
          this.downloadLinkExtracted(res.url_descarga);
          this.cd.detectChanges();
        },
        error: (err) => {
          this.isGeneratingEmpresas = false;
          this.uiService.showError(err, 'Error al generar el reporte');
          this.cd.detectChanges();
        }
      });
  }

  generarReporteVencidas() {
    this.isGeneratingVencidas = true;
    this.reportesService.generarReporte('SUSCRIPCIONES_VENCIDAS', 'Reporte Suscripciones Vencidas')
      .subscribe({
        next: (res) => {
          this.isGeneratingVencidas = false;
          this.uiService.showToast('Reporte de suscripciones vencidas generado', 'success');
          this.downloadLinkExtracted(res.url_descarga);
          this.cd.detectChanges();
        },
        error: (err) => {
          this.isGeneratingVencidas = false;
          this.uiService.showError(err, 'Error al generar suscripciones vencidas');
          this.cd.detectChanges();
        }
      });
  }

  generarReporteProximas() {
    this.isGeneratingProximas = true;
    this.reportesService.generarReporte('SUSCRIPCIONES_PROXIMAS', 'Reporte Renovaciones Proximas', { dias: 15 })
      .subscribe({
        next: (res) => {
          this.isGeneratingProximas = false;
          this.uiService.showToast('Reporte de renovaciones generado', 'success');
          this.downloadLinkExtracted(res.url_descarga);
          this.cd.detectChanges();
        },
        error: (err) => {
          this.isGeneratingProximas = false;
          this.uiService.showError(err, 'Error al generar renovaciones proximas');
          this.cd.detectChanges();
        }
      });
  }

  generarReporteComisiones() {
    this.isGeneratingComisiones = true;
    this.reportesService.generarReporte('COMISIONES_MES', 'Reporte Comisiones Mes')
      .subscribe({
        next: (res) => {
          this.isGeneratingComisiones = false;
          this.uiService.showToast('Reporte de comisiones generado', 'success');
          this.downloadLinkExtracted(res.url_descarga);
          this.cd.detectChanges();
        },
        error: (err) => {
          this.isGeneratingComisiones = false;
          this.uiService.showError(err, 'Error al generar comisiones');
          this.cd.detectChanges();
        }
      });
  }

  private downloadLinkExtracted(url_descarga?: string) {
      if (url_descarga) {
          const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
          const downloadLink = `${baseUrl}${url_descarga}`;
          window.open(downloadLink, '_blank');
      }
  }

  renderChart(datos: any[]) {
      if (!datos || datos.length === 0) return;
      
      const ctx = document.getElementById('crecimientoChart') as HTMLCanvasElement;
      if (!ctx) return;
      
      if (this.chartInstance) {
          this.chartInstance.destroy();
      }

      this.chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
              labels: datos.map(d => d.mes),
              datasets: [{
                  label: 'Nuevas Empresas',
                  data: datos.map(d => d.nuevas_empresas),
                  borderColor: '#2563eb',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  borderWidth: 3,
                  tension: 0.4,
                  fill: true,
                  pointBackgroundColor: '#161d35',
                  pointBorderColor: '#ffffff',
                  pointRadius: 5
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { display: false },
                  title: { display: true, text: 'Crecimiento de Empresas (Últimos 6 meses)' }
              },
              scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1 } }
              }
          }
      });
  }
}

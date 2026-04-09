import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { VendedorReportesService, VendedorMetricas } from './services/vendedor-reportes.service';
import { UiService } from '../../../shared/services/ui.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { ReportesStatsComponent } from './components/reportes-stats.component';
import { ReporteCardComponent } from './components/reporte-card.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-vendedor-reportes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ToastComponent, 
    ReportesStatsComponent, 
    ReporteCardComponent
  ],
  template: `
    <div class="reportes-page-container animate__animated animate__fadeIn">
      <!-- DASHBOARD ESENCIAL -->
      <app-reportes-stats [metricas]="metricas"></app-reportes-stats>

      <!-- CATALOGO DE REPORTES ACCIONABLES -->
      <div class="section-header mb-4">
         <h3 class="section-title">Centro de Gestión y Exportación</h3>
         <p class="text-muted small">Herramientas rápidas para renovaciones y seguimiento de cartera.</p>
      </div>

      <div class="reportes-grid">
        
        <!-- Reporte: Renovaciones Próximas (ACCIONABLE) -->
        <app-reporte-card
          title="Listado de Renovaciones"
          description="Clientes que vencen en los próximos 15 días. Úsalo para contactarlos hoy."
          iconClass="bi-calendar-event"
          iconBgClass="bg-info-light"
          buttonClass="btn-info-custom"
          [loading]="isGeneratingProximas"
          [disabled]="metricas && metricas.total_proximas === 0"
          [buttonText]="metricas?.total_proximas === 0 ? 'Sin Renovaciones Pendientes' : 'Descargar Lista de Cobro'"
          [isActionable]="true"
          (actionClick)="generarReporteProximas()">
        </app-reporte-card>

        <!-- Reporte: Suscripciones Vencidas -->
        <app-reporte-card
          title="Suscripciones Suspendidas"
          description="Directorio de clientes con servicio cortado. Listado listo para gestión de recuperación."
          iconClass="bi-exclamation-octagon"
          iconBgClass="bg-danger-light"
          buttonClass="btn-danger-custom"
          buttonIcon="bi-file-earmark-pdf"
          [loading]="isGeneratingVencidas"
          [disabled]="metricas && metricas.total_vencidas === 0"
          (actionClick)="generarReporteVencidas()">
        </app-reporte-card>

        <!-- Reporte: Directorio de Empresas -->
        <app-reporte-card
          title="Directorio Completo"
          description="Exporta todos tus clientes asignados con sus datos de contacto."
          iconClass="bi-file-earmark-pdf"
          iconBgClass="bg-blue-light"
          buttonClass="btn-secondary-custom"
          buttonText="Descargar Empresas"
          buttonIcon="bi-file-earmark-pdf"
          [loading]="isGeneratingEmpresas"
          (actionClick)="generarReporteEmpresas()">
          
          <div class="filtros-mini mt-2">
             <div class="row g-2">
                <div class="col-6">
                   <input type="date" class="form-control form-control-xs" [(ngModel)]="fechaInicio" placeholder="Desde">
                </div>
                <div class="col-6">
                   <input type="date" class="form-control form-control-xs" [(ngModel)]="fechaFin" placeholder="Hasta">
                </div>
             </div>
          </div>
        </app-reporte-card>

        <!-- Reporte: Comisiones -->
        <app-reporte-card
          title="Historial de Comisiones"
          description="Detalle de pagos recibidos y comisiones liquidadas por tus clientes."
          iconClass="bi-cash-stack"
          iconBgClass="bg-warning-light"
          buttonClass="btn-warning-custom"
          buttonText="Ver Mis Comisiones"
          buttonIcon="bi-file-earmark-pdf"
          [loading]="isGeneratingComisiones"
          [disabled]="metricas && metricas.monto_comisiones === 0"
          (actionClick)="generarReporteComisiones()">
          
          <div class="filtros-mini mt-2">
             <div class="row g-2">
                <div class="col-6">
                   <input type="date" class="form-control form-control-xs" [(ngModel)]="fechaInicioComisiones" placeholder="Desde">
                </div>
                <div class="col-6">
                   <input type="date" class="form-control form-control-xs" [(ngModel)]="fechaFinComisiones" placeholder="Hasta">
                </div>
             </div>
          </div>
        </app-reporte-card>

      </div>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    /* LAYOUT BASE */
    .section-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #1e293b;
    }

    .reportes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .filtros-mini {
       background: #f8fafc;
       padding: 0.5rem;
       border-radius: 8px;
    }

    .form-control-xs {
        height: 30px;
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
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
  fechaInicioComisiones: string = '';
  fechaFinComisiones: string = '';

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

    // Pasar parametros de fecha si existen
    const params: any = {};
    if (this.fechaInicioComisiones) params.fecha_inicio = this.fechaInicioComisiones;
    if (this.fechaFinComisiones) params.fecha_fin = this.fechaFinComisiones;

    this.reportesService.generarReporte('COMISIONES_MES', 'Reporte Comisiones Mes', params)
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
}

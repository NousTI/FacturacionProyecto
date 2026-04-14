import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReportesService, ReporteUso } from '../../services/reportes.service';
import { UiService } from '../../../../../shared/services/ui.service';

// Sub-componentes fragmentados
import { R033FiltrosComponent } from './components/r-033-filtros.component';
import { R033KpisComponent } from './components/r-033-kpis.component';
import { R033GraficasComponent } from './components/r-033-graficas.component';
import { R033TablaComponent } from './components/r-033-tabla.component';

@Component({
  selector: 'app-r-033-uso',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    R033FiltrosComponent, 
    R033KpisComponent, 
    R033GraficasComponent, 
    R033TablaComponent
  ],
  template: `
    <div class="report-container">
      <!-- Encabezado y Acciones -->
      <div class="section-header mb-4">
        <div>
          <h5 class="section-title">R-033 — Uso del Sistema por Empresa</h5>
          <p class="section-sub">Snapshot en tiempo real para detección de necesidades de Upgrade</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn-generar" (click)="generar()" [disabled]="loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!loading" class="bi bi-arrow-clockwise me-2"></i>
            {{ loading ? 'Sincronizando...' : 'Actualizar Datos' }}
          </button>
          <button class="btn-pdf" (click)="exportarPDF()" [disabled]="!datos || loadingPDF">
            <span *ngIf="loadingPDF" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!loadingPDF" class="bi bi-file-earmark-pdf me-2"></i>
            {{ loadingPDF ? 'Generando PDF...' : 'Descargar PDF' }}
          </button>
        </div>
      </div>

      <!-- Filtros Fragmentados (Solo afectan a gráficas y reportes) -->
      <app-r-033-filtros 
        (cambioFiltros)="onFiltrosCalculados($event)"
        [initialRango]="'mes_actual'">
      </app-r-033-filtros>

      <!-- Estados de Carga -->
      <div class="empty-state" *ngIf="!datos && !loading">
        <i class="bi bi-speedometer2"></i>
        <p>Cargando información estratégica de uso...</p>
      </div>
      
      <div class="loading-state" *ngIf="loading">
        <div class="spinner-grow text-primary" role="status"></div>
        <p>Analizando recursos ocupados por las empresas...</p>
      </div>

      <!-- Contenido Principal -->
      <div *ngIf="datos" class="animate-fade-in">
        
        <!-- KPIs Fragmentados -->
        <app-r-033-kpis
          [promedioUsuarios]="datos.promedio_usuarios"
          [maxUsuarios]="datos.max_usuarios"
          [minUsuarios]="datos.min_usuarios"
          [totalEmpresas]="datos.empresas.length">
        </app-r-033-kpis>

        <!-- Gráficas (Módulos y Usuarios en Pastel) -->
        <app-r-033-graficas
          [modulos]="datos.modulos_mas_usados"
          [topEmpresas]="datos.top_empresas_usuarios">
        </app-r-033-graficas>

        <!-- Tabla Detallada -->
        <app-r-033-tabla
          [empresas]="datos.empresas">
        </app-r-033-tabla>

      </div>
    </div>
  `,
  styles: [`
    .report-container { padding: 0.5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
    .section-sub { color: #64748b; font-size: 0.875rem; margin: 0.25rem 0 0; }
    
    .btn-generar { padding: 0.6rem 1.2rem; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; }
    .btn-generar:hover { background: #1e293b; transform: translateY(-1px); }
    
    .btn-pdf { padding: 0.6rem 1.2rem; background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .btn-pdf:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
    
    .btn-generar:disabled, .btn-pdf:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .empty-state, .loading-state { text-align: center; padding: 4rem 1rem; color: #64748b; background: white; border-radius: 12px; border: 2px dashed #e2e8f0; margin: 2rem 0; }
    .spinner-grow { width: 2.5rem; height: 2.5rem; margin-bottom: 1rem; }
    
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class R033UsoComponent implements OnInit, OnDestroy {

  datos: ReporteUso | null = null;
  loading = false;
  loadingPDF = false;

  fechaInicio = '';
  fechaFin = '';

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // La carga inicial se disparará después de que el componente de filtros emita su valor inicial
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFiltrosCalculados(rango: { fechaInicio: string, fechaFin: string }) {
    this.fechaInicio = rango.fechaInicio;
    this.fechaFin = rango.fechaFin;
    this.generar();
  }

  generar() {
    if (this.loading) return;
    
    this.loading = true;
    this.reportesService.getReporteUso({ fecha_inicio: this.fechaInicio, fecha_fin: this.fechaFin })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.datos = data;
          this.loading = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.uiService.showError(err, 'Error al cargar uso del sistema');
          this.cd.detectChanges();
        }
      });
  }

  exportarPDF() {
    if (this.loadingPDF) return;

    this.loadingPDF = true;
    this.uiService.showToast('Generando Documento de Uso...', 'info', 'Estamos preparando el reporte estratégico', 5000);
    this.cd.detectChanges();

    this.reportesService.exportarPDF('SUPERADMIN_USO', {
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `R-033_Uso_Sistema_${new Date().getTime()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.uiService.showToast('Reporte descargado', 'success', 'El PDF se ha generado correctamente', 3000);
      },
      error: (err) => {
        console.error('Error exportando PDF:', err);
        this.uiService.showError(err, 'Error al generar el PDF del reporte');
      }
    }).add(() => {
      this.loadingPDF = false;
      this.cd.detectChanges();
    });
  }
}

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
    R033KpisComponent, 
    R033GraficasComponent, 
    R033TablaComponent
  ],
  template: `
    <div class="report-container animate__animated animate__fadeIn">
      <!-- Estados de Carga -->
      <div class="empty-state" *ngIf="!datos && !loading">
        <i class="bi bi-speedometer2"></i>
        <p>Configura los filtros y presiona <strong>Consultar</strong></p>
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
    .report-container { padding: 0; }
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

  rangoTipo = 'mes_actual';
  fechaInicio = '';
  fechaFin = '';

  private destroy$ = new Subject<void>();

  constructor(
    private reportesService: ReportesService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // La generación inicial se dispara desde el padre
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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

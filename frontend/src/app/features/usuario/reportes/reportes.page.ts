
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { ReportesService } from './services/reportes.service';
import { UiService } from '../../../shared/services/ui.service';
import { Reporte } from '../../../domain/models/reporte.model';
import { ReporteHistorialComponent } from './components/reporte-historial/reporte-historial.component';
import { ReporteGenerarComponent } from './components/reporte-generar/reporte-generar.component';
import { ReportePreviewComponent } from './components/reporte-preview/reporte-preview.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-usuario-reportes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    ReporteHistorialComponent, 
    ReporteGenerarComponent, 
    ReportePreviewComponent,
    ToastComponent
  ],
  template: `
    <div class="reportes-page-container">

      <!-- TABS NAV -->
      <div class="main-tabs-wrapper animate__animated animate__fadeIn">
        <div class="main-tabs border-bottom">
          <button class="main-tab-btn" 
                  [class.active]="activeTab === 'historial'" 
                  (click)="activeTab = 'historial'">
            <i class="bi bi-clock-history"></i> Historial de Reportes
          </button>
          <button class="main-tab-btn" 
                  [class.active]="activeTab === 'generar'" 
                  (click)="activeTab = 'generar'">
            <i class="bi bi-file-earmark-plus"></i> Generar Nuevo Reporte
          </button>
        </div>
      </div>

      <!-- VIEW HISTORIAL -->
      <div class="view-section animate__animated animate__fadeIn" *ngIf="activeTab === 'historial'">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
          <app-reporte-historial 
            [reportes]="reportes" 
            (onDelete)="eliminarReporte($event)">
          </app-reporte-historial>
          
          <div *ngIf="isLoading" class="p-5 text-center">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Cargando historial...</p>
          </div>
        </div>
      </div>

      <!-- VIEW GENERAR -->
      <div class="view-section animate__animated animate__fadeIn" *ngIf="activeTab === 'generar'">
        <div class="card border-0 shadow-sm rounded-4 p-2 bg-white">
          <app-reporte-generar 
            [loading]="isGenerating"
            (onPreview)="verPreview($event)"
            (onGenerate)="generarReporte($event)">
          </app-reporte-generar>
        </div>
      </div>

    </div>

    <!-- PREVIEW MODAL -->
    <app-reporte-preview
      *ngIf="showPreview"
      [data]="previewData"
      [tipo]="previewTipo"
      (onClose)="showPreview = false">
    </app-reporte-preview>

    <app-toast></app-toast>
  `,
  styles: [`
    .reportes-page-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-height: 80vh;
    }
    .main-tabs-wrapper { margin-bottom: 0.5rem; }
    .main-tabs { display: flex; gap: 2rem; }
    .main-tab-btn {
      background: none; border: none; padding: 1rem 0.5rem;
      font-weight: 700; color: #64748b; cursor: pointer;
      display: flex; align-items: center; gap: 0.5rem;
      border-bottom: 3px solid transparent; transition: all 0.2s ease;
    }
    .main-tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    .view-section { animation: fadeIn 0.3s ease; }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ReportesPage implements OnInit {
  activeTab: 'historial' | 'generar' = 'historial';
  reportes: Reporte[] = [];
  isLoading = false;
  isGenerating = false;

  showPreview = false;
  previewData: any = null;
  previewTipo: string = '';

  constructor(
    private reportesService: ReportesService,
    private uiService: UiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.uiService.setPageHeader('Reportes Financieros', 'Gestiona y analiza el desempeño de tu empresa.');
    this.cargarReportes();
  }

  cargarReportes() {
    this.isLoading = true;
    this.reportesService.listarReportes().pipe(
      finalize(() => {
        this.isLoading = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (data) => this.reportes = data,
      error: (err) => this.uiService.showError(err, 'Error al cargar historial')
    });
  }

  verPreview(params: any) {
    this.uiService.showToast('Obteniendo vista previa...', 'info');
    const datos = {
        nombre: params.nombre || 'Vista Previa',
        tipo: params.tipo,
        parametros: {
            fecha_inicio: params.fecha_inicio,
            fecha_fin: params.fecha_fin,
            mes: params.mes,
            anio: params.anio
        }
    };

    this.reportesService.obtenerPreview(datos).subscribe({
      next: (res) => {
        this.previewData = { ...res, nombre: datos.nombre };
        this.previewTipo = datos.tipo;
        this.showPreview = true;
        this.cd.detectChanges();
      },
      error: (err) => this.uiService.showError(err, 'No se pudo obtener la previsualización')
    });
  }

  generarReporte(params: any) {
    if (!params.nombre) {
      this.uiService.showToast('El nombre es obligatorio', 'warning');
      return;
    }

    this.isGenerating = true;
    const datos = {
        nombre: params.nombre,
        tipo: params.tipo,
        parametros: {
            fecha_inicio: params.fecha_inicio,
            fecha_fin: params.fecha_fin,
            mes: params.mes,
            anio: params.anio
        }
    };

    this.reportesService.generarReporte(datos).pipe(
      finalize(() => {
        this.isGenerating = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.uiService.showToast('¡Reporte generado!', 'success');
        this.activeTab = 'historial';
        this.cargarReportes();
        if (res.url_descarga) window.open(res.url_descarga, '_blank');
      },
      error: (err) => this.uiService.showError(err, 'Error al generar reporte')
    });
  }

  eliminarReporte(id: string) {
    if (!confirm('¿Deseas eliminar este registro del historial?')) return;
    this.reportesService.eliminarReporte(id).subscribe({
      next: () => {
        this.uiService.showToast('Eliminado', 'info');
        this.cargarReportes();
      },
      error: (err) => this.uiService.showError(err)
    });
  }
}


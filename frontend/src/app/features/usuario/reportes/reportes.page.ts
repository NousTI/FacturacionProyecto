
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { ReportesService } from './services/reportes.service';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { UiService } from '../../../shared/services/ui.service';
import { Reporte } from '../../../domain/models/reporte.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-usuario-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective, RouterModule],
  template: `
    <div class="reportes-mantenimiento d-flex flex-column align-items-center justify-content-center text-center p-5">
      <div class="card border-0 shadow-sm p-5 rounded-4 bg-white" style="max-width: 500px;">
        <i class="bi bi-tools fs-1 text-muted mb-4"></i>
        <h3 class="fw-bold text-dark">Módulo en Mantenimiento</h3>
        <p class="text-muted mb-0">
          Estamos trabajando para mejorar este módulo. Por el momento, esta sección no se encuentra disponible. Por favor, vuelve más tarde.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .reportes-mantenimiento {
      min-height: 60vh;
    }
  `]
})
export class ReportesPage implements OnInit {
  reportes: Reporte[] = [];
  isLoading = false;
  isGenerating = false;
  mostrarModal = false;

  reporteNuevo = {
    nombre: '',
    tipo: 'VENTAS_PLANAS'
  };

  constructor(
    private reportesService: ReportesService,
    private uiService: UiService,
    private permService: PermissionsService
  ) {}

  ngOnInit() {
    this.cargarReportes();
    this.uiService.setPageHeader('Reportes', 'Visualización y exportación de reportes comerciales.');
  }

  cargarReportes() {
    this.isLoading = true;
    this.reportesService.listarReportes().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => this.reportes = data,
      error: (err) => this.uiService.showError(err, 'Error al cargar historial')
    });
  }

  abrirModalGenerar() {
    this.reporteNuevo = { nombre: '', tipo: 'VENTAS_PLANAS' };
    this.mostrarModal = true;
  }

  generarReporte() {
    if (!this.reporteNuevo.nombre) {
      this.uiService.showToast('Ponle un nombre para identificarlo', 'warning');
      return;
    }

    this.isGenerating = true;
    this.reportesService.generarReporte({
      nombre: this.reporteNuevo.nombre,
      tipo: this.reporteNuevo.tipo
    }).pipe(
      finalize(() => {
        this.isGenerating = false;
        this.mostrarModal = false;
      })
    ).subscribe({
      next: () => {
        this.uiService.showToast('¡Reporte generado con éxito!', 'success');
        this.cargarReportes();
      },
      error: (err) => this.uiService.showError(err, 'No se pudo generar el reporte')
    });
  }

  eliminarReporte(id: string) {
    if (!confirm('¿Eliminar este reporte del historial?')) return;
    
    this.reportesService.eliminarReporte(id).subscribe({
      next: () => {
        this.uiService.showToast('Eliminado', 'info');
        this.cargarReportes();
      },
      error: (err) => this.uiService.showError(err, 'Error al eliminar')
    });
  }
}

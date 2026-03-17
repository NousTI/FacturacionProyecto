
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ReportesService } from './services/reportes.service';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { UiService } from '../../../shared/services/ui.service';
import { Reporte } from '../../../domain/models/reporte.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-usuario-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, HasPermissionDirective],
  template: `
    <div class="reportes-container p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <button 
          *appHasPermission="'REPORTES_EXPORTAR'"
          (click)="abrirModalGenerar()" 
          class="btn btn-corporate px-4 shadow-sm">
          <i class="bi bi-file-earmark-plus me-2"></i> Generar Reporte
        </button>
      </div>

      <div class="row g-4">
        <!-- Mockup List of Reports -->
        <div class="col-12">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="card-header bg-white border-bottom py-3">
              <h5 class="card-title mb-0 fw-bold"><i class="bi bi-clock-history me-2 text-primary"></i> Historial de Reportes</h5>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                  <tr>
                    <th class="px-4 py-3 border-0">Nombre del Reporte</th>
                    <th class="py-3 border-0">Tipo</th>
                    <th class="py-3 border-0">Fecha Generación</th>
                    <th class="py-3 border-0 text-center">Estado</th>
                    <th class="px-4 py-3 border-0 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of reportes">
                    <td class="px-4 fw-medium">{{ r.nombre }}</td>
                    <td>
                      <span class="badge bg-soft-primary text-primary px-3 rounded-pill">{{ r.tipo }}</span>
                    </td>
                    <td>{{ r.created_at | date:'short' }}</td>
                    <td class="text-center">
                      <span class="badge bg-success px-3 rounded-pill">{{ r.estado }}</span>
                    </td>
                    <td class="px-4 text-end">
                      <div class="d-flex justify-content-end gap-2">
                        <a [href]="r.url_descarga" target="_blank" class="btn btn-sm btn-outline-success shadow-sm rounded-3">
                          <i class="bi bi-download"></i>
                        </a>
                        <button 
                           *appHasPermission="'REPORTES_EXPORTAR'"
                          (click)="eliminarReporte(r.id)" class="btn btn-sm btn-outline-danger shadow-sm rounded-3">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="reportes.length === 0 && !isLoading">
                    <td colspan="5" class="text-center py-5 text-muted">
                       <i class="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                       No has generado reportes recientemente.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="isLoading" class="p-5 text-center">
              <div class="spinner-border text-primary" role="status"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Simple Modal Mockup (simulated with a simple div for speed) -->
      <div *ngIf="mostrarModal" class="modal-backdrop fade show"></div>
      <div *ngIf="mostrarModal" class="modal fade show d-block" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow rounded-4">
            <div class="modal-header border-bottom-0 p-4 pb-0">
              <h5 class="modal-title fw-bold">Generar Reporte</h5>
              <button (click)="mostrarModal = false" class="btn-close"></button>
            </div>
            <div class="modal-body p-4">
              <div class="mb-3">
                <label class="form-label fw-semibold">Nombre para identificarlo</label>
                <input [(ngModel)]="reporteNuevo.nombre" type="text" class="form-control rounded-3" placeholder="Ej: Ventas de Marzo">
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Tipo de Reporte</label>
                <select [(ngModel)]="reporteNuevo.tipo" class="form-select rounded-3">
                  <option value="VENTAS_PLANAS">Listado de Ventas (CSV)</option>
                  <option value="PRODUCTOS_STOCK">Inventario de Productos (Excel)</option>
                  <option value="CLIENTES_FRECUENTES">Ranking de Clientes (PDF)</option>
                </select>
              </div>
            </div>
            <div class="modal-footer border-top-0 p-4 pt-0">
              <button (click)="mostrarModal = false" class="btn btn-light rounded-3 px-4">Cancelar</button>
              <button (click)="generarReporte()" [disabled]="isGenerating" class="btn btn-corporate rounded-3 px-4">
                <span *ngIf="isGenerating" class="spinner-border spinner-border-sm me-2"></span>
                {{ isGenerating ? 'Generando...' : 'Generar y Exportar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-corporate { color: #161d35; }
    .btn-corporate { background-color: #161d35; color: white; border-radius: 12px; }
    .btn-corporate:hover { background-color: #24305e; color: white; opacity: 0.9; }
    .bg-soft-primary { background-color: rgba(13, 110, 253, 0.1); }
    .modal-backdrop { background-color: rgba(0,0,0,0.5); }
    .rounded-4 { border-radius: 1rem !important; }
    .table-hover tbody tr:hover { background-color: #f8fafc; cursor: pointer; }
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

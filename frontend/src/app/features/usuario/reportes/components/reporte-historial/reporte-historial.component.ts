import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reporte } from '../../../../../domain/models/reporte.model';

@Component({
  selector: 'app-reporte-historial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="bg-light">
          <tr>
            <th class="ps-4">Nombre del Reporte</th>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th class="text-end pe-4">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of reportes" class="animate__animated animate__fadeIn">
            <td class="ps-4">
              <div class="d-flex align-items-center">
                <div class="icon-circle me-3" [class.bg-success-subtle]="r.estado === 'COMPLETADO'" [class.bg-warning-subtle]="r.estado === 'PENDIENTE'">
                  <i class="bi" [class.bi-file-earmark-bar-graph]="r.estado === 'COMPLETADO'" [class.bi-hourglass-split]="r.estado === 'PENDIENTE'"></i>
                </div>
                <div>
                  <span class="fw-bold d-block">{{ r.nombre }}</span>
                  <small class="text-muted">ID: {{ r.id.substring(0,8) }}</small>
                </div>
              </div>
            </td>
            <td>
              <span class="badge rounded-pill bg-blue-subtle text-blue">{{ formatTipo(r.tipo) }}</span>
            </td>
            <td>{{ r.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
            <td>
              <span class="badge" [ngClass]="r.estado === 'COMPLETADO' ? 'text-bg-success' : 'text-bg-warning'">
                {{ r.estado }}
              </span>
            </td>
            <td class="text-end pe-4">
              <div class="btn-group">
                <button *ngIf="r.url_descarga" 
                        class="btn btn-sm btn-outline-primary rounded-pill px-3 me-2"
                        (click)="descargar(r.url_descarga)">
                  <i class="bi bi-download me-1"></i> Descargar
                </button>
                <button class="btn btn-sm btn-icon-danger" (click)="onDelete.emit(r.id)">
                  <i class="bi bi-trash3"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="reportes.length === 0">
            <td colspan="5" class="py-5 text-center text-muted">
              <i class="bi bi-inbox fs-2 d-block mb-2"></i>
              No hay reportes generados recientemente.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .icon-circle {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bg-blue-subtle { background-color: #e0f2fe; }
    .text-blue { color: #0369a1; }
    .btn-icon-danger {
      color: #ef4444;
      background: transparent;
      border: none;
      padding: 0.4rem;
      border-radius: 8px;
    }
    .btn-icon-danger:hover {
      background: #fef2f2;
    }
  `]
})
export class ReporteHistorialComponent {
  @Input() reportes: Reporte[] = [];
  @Output() onDelete = new EventEmitter<string>();

  formatTipo(tipo: string): string {
    return tipo.replace(/_/g, ' ');
  }

  descargar(url: string) {
    window.open(url, '_blank');
  }
}

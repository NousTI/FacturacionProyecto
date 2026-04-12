import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudRenovacion } from '../../../../domain/models/renovacion.model';

@Component({
  selector: 'app-renovaciones-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="module-table animate__animated animate__fadeIn">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 280px">Empresa</th>
                <th style="width: 200px">Plan Solicitado</th>
                <th style="width: 180px">Fecha Solicitud</th>
                <th class="text-center" style="width: 150px">Estado</th>
                <th class="text-end" style="width: 180px">Fecha Procesada</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of solicitudes" 
                  [class.table-highlighted]="s.id === highlightedId"
                  (click)="onVerDetalle.emit(s)"
                  class="cursor-pointer">
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-3">
                      {{ (s.empresa_nombre?.charAt(0) || 'E') }}
                    </div>
                    <div>
                      <span class="fw-bold text-dark d-block text-truncate" style="max-width: 200px;">{{ s.empresa_nombre }}</span>
                      <small class="text-muted smallest">ID Sub: #{{ (s.suscripcion_id.substring(0,8) || '---') }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="fw-600 text-dark">{{ s.plan_nombre }}</span>
                </td>
                <td>
                  <span class="text-muted" style="font-size: 0.85rem;">{{ s.fecha_solicitud | date:'short' }}</span>
                </td>
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="getEstadoClass(s.estado)">
                    {{ s.estado }}
                  </span>
                </td>
                <td class="text-end">
                  <span *ngIf="s.estado !== 'PENDIENTE'" class="text-muted small">
                    {{ (s.fecha_procesamiento || s.updated_at) | date:'short' }}
                  </span>
                  <span *ngIf="s.estado === 'PENDIENTE'" class="text-muted smallest text-uppercase fw-bold opacity-50">En Revisión</span>
                </td>
                <td class="text-end">
                  <button class="btn-action-trigger" (click)="onVerDetalle.emit(s); $event.stopPropagation()">
                    <i class="bi bi-eye"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="solicitudes.length === 0">
                <td colspan="6" class="text-center p-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                  No se encontraron renovaciones registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .table-container {
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid #f1f5f9;
      overflow: hidden;
    }
    .table-responsive-premium { overflow-x: auto; }
    .table thead th {
      background: #f8fafc;
      padding: 1rem 1.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom: 1px solid #f1f5f9;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .cursor-pointer { cursor: pointer; }
    .table-highlighted {
      background-color: rgba(59, 130, 246, 0.05) !important;
      border-left: 4px solid var(--primary-color, #161d35);
    }
    .avatar-soft-premium {
      width: 38px; height: 38px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; background: #eef2ff; color: #4f46e5;
    }
    .badge-status-premium {
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .badge-pending { background: #fffbeb; color: #b45309; }
    .badge-accepted { background: #ecfdf5; color: #047857; }
    .badge-rejected { background: #fef2f2; color: #b91c1c; }
    
    .btn-action-trigger {
      background: transparent; border: none;
      width: 32px; height: 32px; border-radius: 8px;
      color: #94a3b8; transition: all 0.2s;
    }
    .btn-action-trigger:hover { background: #f1f5f9; color: #1e293b; }
    
    .fw-600 { font-weight: 600; }
    .smallest { font-size: 0.75rem; }
  `]
})
export class RenovacionesTableComponent {
  @Input() solicitudes: SolicitudRenovacion[] = [];
  @Input() highlightedId: string | null = null;
  @Output() onVerDetalle = new EventEmitter<SolicitudRenovacion>();

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'badge-pending';
      case 'ACEPTADA': return 'badge-accepted';
      case 'RECHAZADA': return 'badge-rejected';
      default: return '';
    }
  }
}

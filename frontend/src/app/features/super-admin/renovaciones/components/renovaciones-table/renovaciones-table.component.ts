import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudRenovacion } from '../../../../../domain/models/renovacion.model';

@Component({
  selector: 'app-renovaciones-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 280px">Empresa</th>
                <th style="width: 180px">Plan Solicitado</th>
                <th style="width: 180px">Vendedor</th>
                <th style="width: 150px">Fecha Solicitud</th>
                <th style="width: 130px; text-align: center;">Estado</th>
                <th class="text-end" style="width: 80px">Acciones</th>
                <th class="text-end" style="width: 150px">Procesado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of solicitudes; trackBy: trackById" [class.table-highlighted]="s.id === highlightedId">
                <!-- Empresa -->
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-2">
                       {{ (s.empresa_nombre?.charAt(0) || 'E') }}
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate" [title]="s.empresa_nombre">
                        {{ s.empresa_nombre }}
                      </span>
                      <small class="text-muted" style="font-size: 0.7rem;">
                        Sub: #{{ s.suscripcion_id.substring(0,8) }}
                      </small>
                    </div>
                  </div>
                </td>

                <!-- Plan -->
                <td>
                  <span class="text-dark fw-600" style="font-size: 0.85rem;">{{ s.plan_nombre }}</span>
                </td>

                <!-- Vendedor -->
                <td>
                   <div class="vendedor-info">
                     <i class="bi bi-person-badge me-2 text-muted"></i>
                     <span class="text-muted fw-500" style="font-size: 0.85rem;">{{ s.vendedor_nombre || 'Directo' }}</span>
                   </div>
                </td>

                <!-- Fecha -->
                <td>
                   <span class="text-muted fw-600" style="font-size: 0.85rem;">{{ s.fecha_solicitud | date:'dd MMM, yyyy' }}</span>
                </td>

                <!-- Estado -->
                <td class="text-center">
                  <span class="badge-status-premium" [ngClass]="s.estado.toLowerCase()">
                    {{ s.estado }}
                  </span>
                </td>

                <!-- Acciones -->
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + s.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-bs-popper-config='{"strategy":"fixed"}'
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + s.id">
                      <li>
                        <button class="dropdown-item rounded-3 py-2" (click)="onVerDetalle.emit(s)">
                          <i class="bi bi-eye text-primary"></i>
                          <span class="ms-2">Ver Detalle</span>
                        </button>
                      </li>
                      <li *ngIf="s.estado === 'PENDIENTE' && !isVendedor">
                        <button class="dropdown-item rounded-3 py-2 text-danger" (click)="onRechazar.emit(s)">
                          <i class="bi bi-x-circle text-danger"></i>
                          <span class="ms-2">Rechazar Solicitud</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>

                <!-- Procesado -->
                <td class="text-end">
                   <span *ngIf="s.estado !== 'PENDIENTE'" class="text-muted fw-500" style="font-size: 0.75rem;">
                      {{ (s.fecha_procesamiento || s.updated_at) | date:'dd/MM/yyyy HH:mm' }}
                    </span>
                    <span *ngIf="s.estado === 'PENDIENTE'" class="text-muted opacity-50 fw-bold" style="font-size: 0.65rem;">PENDIENTE</span>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div *ngIf="solicitudes.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-3"></i>
            No se encontraron solicitudes.
          </div>

        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; }
    .module-table { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .table-container {
      background: var(--bg-main, #ffffff); border-radius: 20px;
      border: 1px solid var(--border-color, #f1f5f9);
      display: flex; flex-direction: column; min-height: 0; overflow: hidden;
    }
    .table-responsive-premium { flex: 1; overflow-y: auto; overflow-x: auto; position: relative; }
    .table thead th {
      position: sticky; top: 0; z-index: 10;
      background: var(--bg-main, #ffffff); padding: 1rem 1.5rem;
      font-size: var(--text-base); color: #0f172a; font-weight: 600;
      border-bottom: 2px solid var(--border-color, #f1f5f9);
    }
    .table tbody td {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-muted, #475569); font-size: var(--text-md);
    }
    
    .avatar-soft-premium {
      width: 38px; height: 38px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1rem;
      background: var(--primary-color, #161d35); color: #ffffff;
    }

    .badge-status-premium {
      padding: 0.25rem 0.75rem; border-radius: 6px; font-size: var(--text-sm);
      font-weight: 600; display: inline-block; text-transform: uppercase;
    }
    .badge-status-premium.pendiente { background: var(--status-warning-bg, #fef9c3); color: var(--status-warning-text, #92400e); }
    .badge-status-premium.aceptada { background: var(--status-success-bg, #dcfce7); color: var(--status-success-text, #15803d); }
    .badge-status-premium.rechazada { background: var(--status-danger-bg, #fee2e2); color: var(--status-danger-text, #b91c1c); }
    
    .btn-action-trigger {
      background: transparent; border: none; width: 32px; height: 32px;
      border-radius: 8px; color: #94a3b8; transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: #f8fafc; color: #0f172a;
    }

    .dropdown-item {
      display: flex; align-items: center; padding: 0.5rem 1rem;
      font-size: var(--text-base); font-weight: 500;
      color: var(--text-muted); cursor: pointer; border: none; background: transparent; width: 100%; text-align: left;
    }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    .dropdown-item:hover { background: #f8fafc; color: #0f172a; }

    .table-highlighted { background-color: rgba(59, 130, 246, 0.05) !important; box-shadow: inset 4px 0 0 var(--primary-color); }
    .fw-600 { font-weight: 600; }
    .fw-500 { font-weight: 500; }
  `]
})
export class RenovacionesTableComponent {
  @Input() solicitudes: SolicitudRenovacion[] = [];
  @Input() highlightedId: string | null = null;
  @Input() isVendedor: boolean = false;

  @Output() onVerDetalle = new EventEmitter<SolicitudRenovacion>();
  @Output() onRechazar = new EventEmitter<SolicitudRenovacion>();

  trackById(index: number, item: SolicitudRenovacion): string {
    return item.id;
  }
}

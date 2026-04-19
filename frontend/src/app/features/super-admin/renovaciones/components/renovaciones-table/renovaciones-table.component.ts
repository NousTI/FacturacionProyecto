import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SolicitudRenovacion } from '../../../../../domain/models/renovacion.model';
import { RenovacionesPaginacionComponent, PaginationState } from '../renovaciones-paginacion/renovaciones-paginacion.component';

@Component({
  selector: 'app-renovaciones-table',
  standalone: true,
  imports: [CommonModule, RenovacionesPaginacionComponent],
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 200px">Empresa</th>
                <th style="width: 130px">Plan</th>
                <th style="width: 120px">Tipo</th>
                <th style="width: 150px">Vendedor</th>
                <th style="width: 140px">Fecha Solicitud</th>
                <th style="width: 110px; text-align: center;">Estado</th>
                <th class="text-end" style="width: 80px">Acciones</th>
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

                <!-- Tipo -->
                <td>
                  <span class="badge-tipo-premium" [ngClass]="s.tipo.toLowerCase()">
                    <i class="bi" [ngClass]="s.tipo === 'RENOVACION' ? 'bi-arrow-repeat' : 'bi-arrow-up-circle'"></i>
                    {{ s.tipo }}
                  </span>
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

              </tr>
            </tbody>
          </table>
          
          <div *ngIf="solicitudes.length === 0" class="text-center p-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-3"></i>
            No se encontraron solicitudes.
          </div>

        </div>

        <!-- Paginación integrada como footer de la tabla -->
        <app-renovaciones-paginacion
          [pagination]="pagination"
          (pageChange)="pageChange.emit($event)"
          (pageSizeChange)="pageSizeChange.emit($event)"
        ></app-renovaciones-paginacion>
      </div>
    </section>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; }
    .module-table { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .table-container {
      background: var(--bg-main); border-radius: 20px;
      border: 1px solid var(--border-color);
      display: flex; flex-direction: column; min-height: 0; overflow: hidden;
    }
    .table-responsive-premium { flex: 1; overflow-y: auto; overflow-x: auto; position: relative; }
    .table thead th {
      position: sticky; top: 0; z-index: 10;
      background: var(--bg-main); padding: 1rem 1.5rem;
      font-size: var(--text-base); color: var(--text-main); font-weight: 800;
      border-bottom: 2px solid var(--border-color);
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .table tbody td {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);
      color: var(--text-muted); font-size: var(--text-md);
    }
    
    .avatar-soft-premium {
      width: 38px; height: 38px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1rem;
      background: var(--primary-color); color: #ffffff;
    }

    .badge-status-premium {
      padding: 0.25rem 0.75rem; border-radius: 6px; font-size: var(--text-sm);
      font-weight: 600; display: inline-block; text-transform: uppercase;
    }
    .badge-status-premium.pendiente { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .badge-status-premium.aceptada { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-status-premium.rechazada { background: var(--status-danger-bg); color: var(--status-danger-text); }
    
    .badge-tipo-premium {
      padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.65rem;
      font-weight: 700; display: inline-flex; align-items: center; gap: 4px;
      text-transform: uppercase;
    }
    .badge-tipo-premium.renovacion { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-tipo-premium.upgrade { background: var(--status-info-bg); color: var(--status-info-text); }
    
    .btn-action-trigger {
      background: transparent; border: none; width: 32px; height: 32px;
      border-radius: 8px; color: var(--text-muted); transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: var(--status-neutral-bg); color: var(--text-main);
    }

    .dropdown-item {
      display: flex; align-items: center; padding: 0.5rem 1rem;
      font-size: var(--text-base); font-weight: 500;
      color: var(--text-muted); cursor: pointer; border: none; background: transparent; width: 100%; text-align: left;
    }
    .dropdown-item i { font-size: 1.1rem; margin-right: 0.75rem; }
    .dropdown-item:hover { background: var(--status-neutral-bg); color: var(--text-main); }

    .table-highlighted { 
      background-color: var(--status-info-bg) !important; 
      box-shadow: inset 4px 0 0 var(--status-info); 
    }
    .fw-600 { font-weight: 600; }
    .fw-500 { font-weight: 500; }
  `]
})
export class RenovacionesTableComponent {
  @Input() solicitudes: SolicitudRenovacion[] = [];
  @Input() highlightedId: string | null = null;
  @Input() isVendedor: boolean = false;
  @Input() pagination: PaginationState = { currentPage: 1, pageSize: 10, totalItems: 0 };

  @Output() onVerDetalle = new EventEmitter<SolicitudRenovacion>();
  @Output() onRechazar = new EventEmitter<SolicitudRenovacion>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  trackById(index: number, item: SolicitudRenovacion): string {
    return item.id;
  }
}

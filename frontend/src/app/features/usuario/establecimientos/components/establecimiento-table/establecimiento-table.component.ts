import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Establecimiento } from '../../../../../domain/models/establecimiento.model';
import { HasPermissionDirective } from '../../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-establecimiento-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <section class="module-table-premium">
      <div class="table-container-premium">
        <div class="table-responsive-premium">
          <table class="table-editorial">
            <thead>
              <tr>
                <th style="width: 500px">Establecimiento</th>
                <th style="width: 200px">Código</th>
                <th>Dirección</th>
                <th class="text-center" style="width: 180px">Estado</th>
                <th class="text-center" style="width: 130px">Puntos Emisión</th>
                <th class="text-end" style="width: 80px">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let est of establecimientos">
                <td>
                  <div class="d-flex align-items-center" style="max-width: 230px;">
                    <div 
                      class="avatar-soft-editorial me-3" 
                      style="background: var(--primary-color); color: var(--bg-main);"
                    >
                      {{ getInitials(est.nombre) }}
                    </div>
                    <div class="text-truncate">
                      <div class="d-flex align-items-center gap-1 text-truncate">
                        <span class="fw-bold text-main d-block mb-0 text-truncate" [title]="est.nombre">{{ est.nombre }}</span>
                        <i *ngIf="est.es_matriz" class="bi bi-patch-check-fill text-primary" title="Matriz" style="font-size: 0.8rem;"></i>
                      </div>
                      <small class="text-muted d-block" style="font-size: var(--text-xs); line-height: 1;">{{ est.id | slice:0:8 }}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge-code-editorial">{{ est.codigo }}</span>
                </td>
                <td>
                  <span class="text-dark fw-500" style="font-size: var(--text-base);" [title]="est.direccion">{{ est.direccion | slice:0:50 }}{{ est.direccion.length > 50 ? '...' : '' }}</span>
                </td>
                <td class="text-center">
                  <span class="badge-status-editorial" [ngClass]="est.activo ? 'activo' : 'inactivo'">
                    {{ est.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="secuencial-badge-editorial mx-auto" style="width: fit-content;">
                    {{ est.puntos_emision_total || 0 }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger-editorial" 
                      type="button" 
                      [id]="'actions-' + est.id" 
                      data-bs-toggle="dropdown" 
                      data-bs-boundary="viewport"
                      data-bs-popper-config='{"strategy":"fixed"}'
                      aria-expanded="false"
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4 shadow-sm" [attr.aria-labelledby]="'actions-' + est.id">
                      <li>
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'view', establecimiento: est})">
                          <i class="bi bi-eye"></i>
                          <span class="ms-2">Ver Detalles</span>
                        </a>
                      </li>
                      <li *hasPermission="'ESTABLECIMIENTO_GESTIONAR'">
                        <a class="dropdown-item rounded-3 py-2" href="javascript:void(0)" (click)="onAction.emit({type: 'edit', establecimiento: est})">
                          <i class="bi bi-pencil-square"></i>
                          <span class="ms-2">Editar</span>
                        </a>
                      </li>
                      <li><hr class="dropdown-divider mx-2"></li>
                      <li *hasPermission="'ESTABLECIMIENTO_GESTIONAR'">
                        <a class="dropdown-item rounded-3 py-2 text-danger" href="javascript:void(0)" (click)="onAction.emit({type: 'delete', establecimiento: est})">
                          <i class="bi bi-trash"></i>
                          <span class="ms-2">Eliminar</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
              <tr *ngIf="establecimientos.length === 0">
                <td colspan="6" class="text-center p-5 text-muted">
                  <i class="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                  No se encontraron establecimientos registrados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      width: 100%;
    }
    .module-table-premium {
      display: flex;
      flex-direction: column;
      height: auto;
      max-height: 100%;
      min-height: 0;
      background: var(--bg-main);
      border-radius: 24px;
      border: 1px solid var(--border-color);
      margin-bottom: 2rem;
      overflow: hidden;
      font-family: var(--font-main);
      flex: 0 1 auto;
    }
    .table-container-premium {
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      flex: 0 1 auto;
    }
    .table-responsive-premium {
      overflow-y: auto;
      overflow-x: auto;
      min-height: 0;
      overscroll-behavior: contain;
    }
    
    .table-responsive-premium::-webkit-scrollbar { width: 6px; height: 6px; }
    .table-responsive-premium::-webkit-scrollbar-track { background: transparent; }
    .table-responsive-premium::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }

    .table-editorial {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      vertical-align: middle;
    }
    .table-editorial thead {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bg-main);
    }
    .table-editorial th {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--bg-main);
      padding: 1rem 1.5rem;
      font-size: var(--text-base);
      color: var(--text-main);
      font-weight: 600;
      border-bottom: 2px solid var(--border-color);
      vertical-align: middle;
      text-align: left;
    }
    .table-editorial td {
      padding: 1.5rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      transition: all 0.2s;
      font-size: var(--text-base);
      color: var(--text-main);
    }
    .table-editorial tbody tr:hover td {
      background-color: var(--bg-main);
    }

    .avatar-soft-editorial {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .badge-code-editorial {
      background: var(--border-color);
      color: var(--text-main);
      padding: 0.35rem 0.6rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: var(--text-sm);
    }

    .secuencial-badge-editorial {
      display: flex;
      align-items: center;
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem;
      border-radius: 10px;
      color: var(--text-muted);
      font-weight: 700;
      font-size: 0.8rem;
    }

    .badge-status-editorial {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: capitalize;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
    }
    .badge-status-editorial.activo { 
      background: var(--status-success-bg); 
      color: var(--status-success-text); 
    }
    .badge-status-editorial.inactivo { 
      background: var(--status-neutral-bg); 
      color: var(--status-neutral-text); 
    }

    .btn-action-trigger-editorial {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-action-trigger-editorial:hover {
      background: var(--border-color);
      color: var(--text-main);
    }

    .dropdown-item {
      font-size: var(--text-base);
      font-weight: 500;
      color: var(--text-muted);
    }
    .dropdown-item i { font-size: 1rem; color: var(--text-muted); }
    .dropdown-item:hover { background: var(--bg-main); color: var(--primary-color); }
    .dropdown-item:hover i { color: var(--primary-color); }

    .dropdown-menu {
      z-index: 1050 !important;
      position: fixed !important;
      border: 1px solid var(--border-color) !important;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
    }
  `]
})
export class EstablecimientoTableComponent {
  @Input() establecimientos: Establecimiento[] = [];
  @Output() onAction = new EventEmitter<{
    type: 'view' | 'edit' | 'delete';
    establecimiento: Establecimiento;
  }>();

  getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  getAvatarColor(text: string, opacity: number): string {
    const colors = [
      'rgba(59, 130, 246, ' + opacity + ')',    // Blue
      'rgba(16, 185, 129, ' + opacity + ')',    // Green
      'rgba(245, 158, 11, ' + opacity + ')',    // Amber
      'rgba(139, 92, 246, ' + opacity + ')',    // Purple
      'rgba(239, 68, 68, ' + opacity + ')',     // Red
      'rgba(6, 182, 212, ' + opacity + ')',     // Cyan
    ];
    const index = text.charCodeAt(0) % colors.length;
    return colors[index];
  }
}

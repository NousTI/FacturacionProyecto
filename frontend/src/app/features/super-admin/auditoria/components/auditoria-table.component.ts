import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogAuditoria } from '../services/auditoria.service';

@Component({
  selector: 'app-auditoria-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="module-table">
      <div class="table-container">
        <div class="table-responsive-premium">
          <table class="table mb-0 align-middle">
            <thead>
              <tr>
                <th style="width: 180px">Fecha y Hora</th>
                <th style="width: 150px">Módulo</th>
                <th style="width: 250px">Usuario / Actor</th>
                <th style="width: 180px">Evento</th>
                <th style="min-width: 250px">Detalles</th>
                <th style="width: 120px" class="text-center">IP</th>
                <th style="width: 80px" class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of logs; trackBy: trackById">
                <!-- Fecha -->
                <td>
                  <div class="d-flex flex-column">
                    <span class="fw-bold text-dark mb-0" style="font-size: 0.85rem;">{{ log.created_at | date:'dd MMM, yyyy' }}</span>
                    <small class="text-muted" style="font-size: 0.75rem;">{{ log.created_at | date:'HH:mm:ss' }}</small>
                  </div>
                </td>

                <!-- Módulo -->
                <td>
                  <span class="modulo-badge">{{ log.modulo || 'SISTEMA' }}</span>
                </td>

                <!-- Actor -->
                <td>
                  <div class="d-flex align-items-center">
                    <div class="avatar-soft-premium me-2" [style.background]="getAvatarBg(log.actor_nombre)">
                      {{ (log.actor_nombre?.charAt(0) || 'S') }}
                    </div>
                    <div class="text-truncate">
                      <span class="fw-bold text-dark d-block mb-0 text-truncate" [title]="log.actor_nombre" style="font-size: 0.85rem;">
                        {{ log.actor_nombre || 'Sistema' }}
                      </span>
                      <small class="text-muted text-truncate d-block" style="font-size: 0.7rem; max-width: 180px;">
                        {{ log.actor_email || 'automático' }}
                      </small>
                    </div>
                  </div>
                </td>

                <!-- Evento -->
                <td>
                  <span class="badge-status-premium" [ngClass]="getBadgeClass(log.evento)">
                    {{ log.evento.replace('_', ' ') }}
                  </span>
                </td>

                <!-- Detalles (Motivo) -->
                <td>
                  <p class="text-muted mb-0 text-truncate-2" [title]="log.motivo" style="font-size: 0.85rem; max-height: 2.6rem; overflow: hidden;">
                    {{ log.motivo || 'Sin detalles adicionales registrados' }}
                  </p>
                </td>

                <!-- IP -->
                <td class="text-center">
                  <span class="ip-tag">
                    {{ log.ip_address || '0.0.0.0' }}
                  </span>
                </td>

                <!-- Acciones -->
                <td class="text-end">
                  <div class="dropdown">
                    <button 
                      class="btn-action-trigger" 
                      type="button" 
                      [id]="'actions-' + log.id" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-bs-popper-config='{"strategy":"fixed"}'
                    >
                      <i class="bi bi-three-dots"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end border-0 p-2 rounded-4" [attr.aria-labelledby]="'actions-' + log.id">
                      <li>
                        <button class="dropdown-item rounded-3 py-2" (click)="onVerDetalle.emit(log)">
                          <i class="bi bi-info-circle text-primary"></i>
                          <span class="ms-2">Ver Detalle</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div *ngIf="logs.length === 0 && !isLoading" class="text-center p-5 text-muted">
            <i class="bi bi-shield-slash fs-1 d-block mb-3 opacity-25"></i>
            No se encontraron registros de auditoría.
          </div>

          <!-- Loader -->
          <div *ngIf="isLoading" class="p-5 text-center">
            <div class="spinner-border text-primary mb-2" role="status"></div>
            <p class="text-muted small">Consultando registros...</p>
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
    .table-responsive-premium { 
      flex: 1; 
      overflow-y: auto; 
      overflow-x: visible; 
      position: relative; 
      min-height: 300px;
    }
    .table thead th {
      position: sticky; top: 0; z-index: 10;
      background: var(--bg-main); padding: 1rem 1.5rem;
      font-size: var(--text-base); color: var(--text-main); font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 2px solid var(--border-color);
    }
    .table tbody td {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: var(--text-md);
    }
    
    .modulo-badge {
      font-size: 0.65rem; font-weight: 700;
      padding: 0.25rem 0.6rem; border-radius: 6px;
      background: var(--status-neutral-bg); color: var(--status-neutral-text);
      border: 1px solid var(--border-color);
    }

    .avatar-soft-premium {
      width: 32px; height: 32px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.85rem; color: #ffffff;
      background: var(--primary-color);
    }

    .badge-status-premium {
      padding: 0.35rem 0.85rem; border-radius: 6px; font-size: var(--text-xs);
      font-weight: 800; display: inline-block; text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .login-ok { background: var(--status-success-bg); color: var(--status-success-text); }
    .login-fail { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .logout { background: var(--status-neutral-bg); color: var(--status-neutral-text); }
    .update { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .create { background: var(--status-info-bg); color: var(--status-info-text); }
    .delete { background: var(--status-danger-bg); color: var(--status-danger-text); }
    .default { background: var(--status-neutral-bg); color: var(--status-neutral-text); }

    .ip-tag {
      font-family: 'JetBrains Mono', monospace; font-size: 0.7rem;
      background: var(--status-neutral-bg); border: 1px solid var(--border-color);
      padding: 0.25rem 0.5rem; border-radius: 4px; color: var(--text-muted);
    }

    .btn-action-trigger {
      background: transparent; border: none; width: 32px; height: 32px;
      border-radius: 8px; color: var(--text-muted); transition: all 0.2s;
    }
    .btn-action-trigger:hover, .btn-action-trigger[aria-expanded="true"] {
      background: var(--status-info-bg); color: var(--status-info-text);
    }

    .dropdown-menu {
      border: 1px solid var(--border-color, #e2e8f0) !important;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1) !important;
      border-radius: 12px !important;
      padding: 0.5rem !important;
      z-index: 9999 !important;
    }

    .dropdown-item {
      display: flex; align-items: center; padding: 0.5rem 1rem;
      font-size: 0.85rem; font-weight: 500;
      color: #475569; cursor: pointer; border: none; background: transparent; width: 100%; text-align: left;
    }
    .dropdown-item i { font-size: 1rem; margin-right: 0.75rem; }
    .dropdown-item:hover { background: #f8fafc; color: #0f172a; }

    .text-truncate-2 {
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      white-space: normal;
    }
  `]
})
export class AuditoriaTableComponent {
  @Input() logs: LogAuditoria[] = [];
  @Input() isLoading = false;

  @Output() onVerDetalle = new EventEmitter<LogAuditoria>();

  trackById(index: number, item: LogAuditoria): string {
    return item.id;
  }

  getAvatarBg(nombre?: string): string {
    if (!nombre) return '#64748b';
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const index = nombre.length % colors.length;
    return colors[index];
  }

  getBadgeClass(evento: string): string {
    const ev = evento.toUpperCase();
    if (ev.includes('LOGIN_OK')) return 'login-ok';
    if (ev.includes('LOGIN_FALLIDO') || ev.includes('ERROR')) return 'login-fail';
    if (ev.includes('LOGOUT')) return 'logout';
    if (ev.includes('CREADO')) return 'create';
    if (ev.includes('EDITAD') || ev.includes('ACTUALIZADO') || ev.includes('CAMBIO')) return 'update';
    if (ev.includes('ELIMINADO')) return 'delete';
    return 'default';
  }
}

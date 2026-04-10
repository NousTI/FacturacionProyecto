import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogAuditoria } from '../services/auditoria.service';

@Component({
  selector: 'app-auditoria-tabla',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card border-0 shadow-sm overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light border-bottom">
            <tr>
              <th class="ps-4 py-3 text-uppercase small fw-bold text-muted">Fecha y Hora</th>
              <th class="py-3 text-uppercase small fw-bold text-muted">Módulo</th>
              <th class="py-3 text-uppercase small fw-bold text-muted">Usuario/Actor</th>
              <th class="py-3 text-uppercase small fw-bold text-muted">Evento</th>
              <th class="py-3 text-uppercase small fw-bold text-muted">Detalles</th>
              <th class="py-3 text-uppercase small fw-bold text-muted text-center">IP</th>
            </tr>
          </thead>
          <tbody *ngIf="!isLoading">
            <tr *ngFor="let log of logs" class="animate__animated animate__fadeIn">
              <td class="ps-4">
                <div class="d-flex flex-column">
                  <span class="text-dark fw-medium small">{{ log.created_at | date:'dd/MM/yyyy' }}</span>
                  <span class="text-muted" style="font-size: 0.75rem;">{{ log.created_at | date:'HH:mm:ss' }}</span>
                </div>
              </td>
              <td>
                <span class="modulo-tag text-uppercase">{{ log.modulo || 'GENERAL' }}</span>
              </td>
              <td>
                <div class="d-flex align-items-center">
                  <div class="avatar-sm me-2 rounded-circle bg-light d-flex align-items-center justify-content-center text-primary fw-bold">
                    {{ (log.actor_nombre || 'S')[0] }}
                  </div>
                  <div class="d-flex flex-column">
                    <span class="fw-bold text-dark small">{{ log.actor_nombre || 'Sistema' }}</span>
                    <span class="text-muted x-small">{{ log.actor_email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge rounded-pill fw-bold" [ngClass]="getBadgeClass(log.evento)">
                  {{ log.evento.replace('_', ' ') }}
                </span>
              </td>
              <td style="max-width: 300px;">
                <p class="text-secondary small mb-0 text-truncate" [title]="log.motivo">
                  {{ log.motivo || 'Sin detalles adicionales' }}
                </p>
              </td>
              <td class="text-center">
                <span class="font-monospace text-muted x-small bg-light px-2 py-1 rounded">
                  {{ log.ip_address || '0.0.0.0' }}
                </span>
              </td>
            </tr>

            <!-- Empty State -->
            <tr *ngIf="logs.length === 0">
              <td colspan="6" class="py-5 text-center">
                <div class="py-5">
                  <i class="bi bi-shield-slash display-4 text-light"></i>
                  <p class="text-muted mt-3">No se encontraron registros de auditoría.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loader -->
      <div *ngIf="isLoading" class="p-5 text-center">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted mt-2">Consultando bitácora de seguridad...</p>
      </div>
    </div>
  `,
  styles: [`
    .avatar-sm { width: 32px; height: 32px; font-size: 0.75rem; }

    .badge {
      font-size: 0.65rem;
      padding: 0.5em 1em;
      text-transform: uppercase;
    }

    .bg-login-ok { background-color: #dcfce7; color: #166534; }
    .bg-login-fail { background-color: #fee2e2; color: #991b1b; }
    .bg-create { background-color: #e0e7ff; color: #3730a3; }
    .bg-update { background-color: #fef9c3; color: #854d0e; }
    .bg-comision { background-color: #dcfce7; color: #166534; }
    .bg-plan { background-color: #fce7f3; color: #9d174d; }
    .bg-vendor { background-color: #fff7ed; color: #9a3412; }
    .bg-sri { background-color: #f0f9ff; color: #075985; }
    .bg-default { background-color: #f1f5f9; color: #475569; }

    .modulo-tag {
      font-size: 0.65rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      color: #64748b;
      font-weight: 700;
    }

    .x-small { font-size: 0.7rem; }

    .table thead th { border-top: none; }
  `]
})
export class AuditoriaTablComponent {
  @Input() logs: LogAuditoria[] = [];
  @Input() isLoading = false;

  getBadgeClass(evento: string): string {
    const ev = evento.toUpperCase();
    if (ev.includes('LOGIN_OK')) return 'bg-login-ok';
    if (ev.includes('LOGIN_FALLIDO')) return 'bg-login-fail';
    if (ev.includes('CREADO')) return 'bg-create';
    if (ev.includes('EDITAD') || ev.includes('ACTUALIZADO')) return 'bg-update';
    if (ev.includes('COMISION')) return 'bg-comision';
    if (ev.includes('PLAN') || ev.includes('SUSCRIPCION')) return 'bg-plan';
    if (ev.includes('VENDEDOR')) return 'bg-vendor';
    if (ev.includes('SRI')) return 'bg-sri';
    return 'bg-default';
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogAuditoria } from '../../services/auditoria.service';

@Component({
  selector: 'app-auditoria-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn" (click)="onClose.emit()">
      <div class="modal-premium-content shadow-lg" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header-premium">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-box" [style.background]="getEventColor(log?.evento)">
              <i class="bi bi-shield-check"></i>
            </div>
            <div>
              <h3 class="modal-title">Detalle del Evento</h3>
              <p class="modal-subtitle">Registro ID: {{ log?.id?.substring(0, 13) }}...</p>
            </div>
          </div>
          <button class="btn-close-modal" (click)="onClose.emit()">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body-premium">
          <div class="row g-4">
            <!-- Info General -->
            <div class="col-md-6">
              <label class="detail-label">Evento</label>
              <div class="detail-value fw-bold text-uppercase">{{ log?.evento?.replace('_', ' ') }}</div>
            </div>
            <div class="col-md-6">
              <label class="detail-label">Módulo</label>
              <div class="detail-value text-primary fst-italic">{{ log?.modulo || 'General' }}</div>
            </div>

            <div class="col-md-6">
              <label class="detail-label">Fecha y Hora</label>
              <div class="detail-value">{{ log?.created_at | date:'dd/MM/yyyy HH:mm:ss' }}</div>
            </div>
            <div class="col-md-6">
              <label class="detail-label">Dirección IP</label>
              <div class="detail-value font-monospace bg-light px-2 rounded">{{ log?.ip_address || 'N/A' }}</div>
            </div>

            <div class="col-12">
              <div class="divider"></div>
            </div>

            <!-- Actor -->
            <div class="col-12">
              <label class="detail-label text-muted">Actor / Usuario Relacionado</label>
              <div class="d-flex align-items-center mt-2 p-3 bg-light rounded-4">
                <div class="avatar-lg me-3">
                  {{ (log?.actor_nombre?.charAt(0) || 'S') }}
                </div>
                <div>
                  <div class="fw-bold text-dark">{{ log?.actor_nombre || 'Sistema' }}</div>
                  <div class="text-muted small">{{ log?.actor_email || 'automático@sistema.com' }}</div>
                </div>
              </div>
            </div>

            <!-- Motivo / Texto Largo -->
            <div class="col-12">
              <label class="detail-label">Descripción Detallada</label>
              <div class="motivo-container">
                {{ log?.motivo || 'No hay descripción adicional para este evento.' }}
              </div>
            </div>

            <!-- User Agent (Technical Info) -->
            <div class="col-12" *ngIf="log?.user_agent">
              <label class="detail-label">Browser / User Agent</label>
              <div class="ua-container small text-muted">
                {{ log?.user_agent }}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer-premium">
          <button class="btn-primary-premium w-100" (click)="onClose.emit()">
            Cerrar Detalles
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; padding: 1rem;
    }
    .modal-premium-content {
      background: white; border-radius: 24px;
      width: 100%; max-width: 600px;
      overflow: hidden; display: flex; flex-direction: column;
    }
    .modal-header-premium {
      padding: 1.75rem 2rem; border-bottom: 1px solid #f1f5f9;
      display: flex; align-items: center; justify-content: space-between;
    }
    .icon-box {
      width: 48px; height: 48px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.4rem;
    }
    .modal-title { font-weight: 800; color: #0f172a; margin: 0; font-size: 1.25rem; }
    .modal-subtitle { color: #94a3b8; margin: 0; font-size: 0.8rem; font-weight: 500; }
    .btn-close-modal {
      background: #f8fafc; border: none; width: 36px; height: 36px;
      border-radius: 10px; color: #64748b; font-size: 1.5rem;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-close-modal:hover { background: #fee2e2; color: #ef4444; }

    .modal-body-premium { padding: 2rem; max-height: 70vh; overflow-y: auto; }
    .detail-label {
      display: block; font-size: 0.65rem; font-weight: 800;
      color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
      margin-bottom: 0.4rem;
    }
    .detail-value { color: #334155; font-size: 1rem; }
    
    .avatar-lg {
      width: 48px; height: 48px; border-radius: 12px;
      background: var(--primary-color, #161d35); color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.2rem;
    }

    .divider { height: 1px; background: #f1f5f9; margin: 0.5rem 0; }
    
    .motivo-container {
      background: #f8fafc; border-radius: 16px; padding: 1.25rem;
      color: #475569; font-size: 0.95rem; line-height: 1.6;
      border: 1px solid #e2e8f0;
    }
    
    .ua-container {
      background: #fafafc; padding: 0.75rem; border-radius: 8px;
      word-break: break-all; font-family: 'Inter', sans-serif;
    }

    .modal-footer-premium { padding: 1.5rem 2rem; }
    .btn-primary-premium {
      background: var(--primary-color, #161d35); color: white;
      border: none; padding: 1rem; border-radius: 12px;
      font-weight: 700; transition: all 0.2s;
    }
    .btn-primary-premium:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  `]
})
export class AuditoriaDetailModalComponent {
  @Input() log: LogAuditoria | null = null;
  @Output() onClose = new EventEmitter<void>();

  getEventColor(evento?: string): string {
    if (!evento) return '#64748b';
    const ev = evento.toUpperCase();
    if (ev.includes('LOGIN_OK')) return '#10b981';
    if (ev.includes('LOGIN_FALLIDO') || ev.includes('ERROR')) return '#ef4444';
    if (ev.includes('EDITAD')) return '#f59e0b';
    return '#3b82f6';
  }
}

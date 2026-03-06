import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../../domain/models/user.model';

@Component({
  selector: 'app-usuario-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" (click)="close()">
      <div class="modal-card" (click)="$event.stopPropagation()">

        <!-- Close -->
        <button class="btn-x" (click)="close()"><i class="bi bi-x"></i></button>

        <!-- Profile Header -->
        <div class="profile-section">
          <div class="avatar-xl">
            {{ getInitials(usuario.nombre || usuario.nombres || 'U') }}
          </div>
          <div class="profile-meta">
            <h2 class="profile-name">{{ usuario.nombre || usuario.nombres }} {{ usuario.apellido || usuario.apellidos }}</h2>
            <div class="profile-tags">
              <span class="tag-role">{{ usuario.rol_nombre || usuario.role || '—' }}</span>
              <span class="tag-status" [class.is-active]="usuario.activo !== false">
                <i class="bi bi-circle-fill me-1" style="font-size:6px; vertical-align: middle;"></i>
                {{ usuario.activo !== false ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Data Grid -->
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">Correo electrónico</span>
            <span class="data-value">{{ usuario.correo || usuario.email || '—' }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Teléfono</span>
            <span class="data-value">{{ usuario.telefono || '—' }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">Último acceso</span>
            <span class="data-value">{{ usuario.ultimo_acceso ? (usuario.ultimo_acceso | date:'dd MMM yyyy · HH:mm') : 'Nunca' }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">ID de usuario</span>
            <span class="data-value mono">{{ usuario.id }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-foot">
          <button class="btn-close-modal" (click)="close()">Cerrar</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0;
      background: rgba(10, 10, 20, 0.45); backdrop-filter: blur(14px);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; padding: 1rem;
    }
    .modal-card {
      position: relative;
      background: #ffffff; width: 520px; max-width: 96vw;
      border-radius: 28px; overflow: hidden;
      box-shadow: 0 32px 80px -12px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05);
      display: flex; flex-direction: column;
    }
    .btn-x {
      position: absolute; top: 1.5rem; right: 1.5rem;
      background: #f8fafc; border: 1px solid #e2e8f0;
      width: 36px; height: 36px; border-radius: 10px;
      color: #64748b; font-size: 1.1rem;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; line-height: 1; transition: all 0.15s;
    }
    .btn-x:hover { background: #f1f5f9; color: #1e293b; }

    /* Profile */
    .profile-section {
      display: flex; align-items: center; gap: 1.25rem;
      padding: 2rem 2rem 1.5rem;
    }
    .avatar-xl {
      width: 64px; height: 64px; flex-shrink: 0;
      background: #161d35; color: #ffffff;
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 800; letter-spacing: -1px;
    }
    .profile-name {
      font-size: 1.3rem; font-weight: 800; color: #0f172a;
      margin: 0 0 0.5rem; letter-spacing: -0.3px; line-height: 1.2;
    }
    .profile-tags { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .tag-role {
      background: #f1f5f9; color: #334155;
      padding: 3px 10px; border-radius: 6px;
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .tag-status {
      padding: 3px 10px; border-radius: 6px;
      font-size: 0.72rem; font-weight: 700;
      background: #fef2f2; color: #dc2626;
    }
    .tag-status.is-active { background: #f0fdf4; color: #16a34a; }

    .divider { height: 1px; background: #f1f5f9; margin: 0 2rem; }

    /* Data */
    .data-grid { padding: 1.5rem 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem 1rem; }
    .data-item { display: flex; flex-direction: column; gap: 4px; }
    .data-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; }
    .data-value { font-size: 0.9rem; font-weight: 600; color: #1e293b; word-break: break-all; }
    .data-value.mono { font-family: monospace; font-size: 0.75rem; color: #64748b; }

    /* Footer */
    .modal-foot {
      padding: 1.25rem 2rem; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end;
    }
    .btn-close-modal {
      background: #0f172a; color: #ffffff; border: none;
      padding: 0.6rem 1.75rem; border-radius: 10px;
      font-size: 0.875rem; font-weight: 700; cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-close-modal:hover { opacity: 0.85; }
  `]
})
export class UsuarioDetailModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) usuario!: User;
  @Output() onClose = new EventEmitter<void>();

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  ngOnInit() { document.body.style.overflow = 'hidden'; }
  ngOnDestroy() { document.body.style.overflow = 'auto'; }

  close() { this.onClose.emit(); }
}

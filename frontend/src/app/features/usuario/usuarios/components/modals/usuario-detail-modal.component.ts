import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../../domain/models/user.model';

@Component({
  selector: 'app-usuario-detail-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-content-container shadow-lg">
        
        <!-- Header Section -->
        <div class="detail-header">
          <div class="user-brand">
            <div class="avatar-large" [style.background]="getAvatarColor((usuario.nombre || usuario.nombres || ''), 0.1)" [style.color]="getAvatarColor((usuario.nombre || usuario.nombres || ''), 1)">
              {{ getInitials(usuario) }}
            </div>
            <div class="brand-text">
              <h4>{{ usuario.nombre || usuario.nombres }} {{ usuario.apellido || usuario.apellidos }}</h4>
              <div class="badges">
                <span class="status-badge" [ngClass]="usuario.activo !== false ? 'active' : 'inactive'">
                  {{ usuario.activo !== false ? 'Acceso Habilitado' : 'Acceso Suspendido' }}
                </span>
                <span class="role-badge">{{ usuario.rol_nombre || usuario.role || 'Usuario' }}</span>
              </div>
            </div>
          </div>
          <button class="btn-close-custom" (click)="close()">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body scroll-custom">
          <div class="row g-4">
            <!-- Left Info -->
            <div class="col-md-7">
              <div class="info-group">
                <div class="group-header">
                  <i class="bi bi-person-badge"></i>
                  <span>Perfil de Usuario</span>
                </div>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Nombre de Usuario</label>
                    <span class="fw-bold">{{ usuario.username || 'sin asignar' }}</span>
                  </div>
                  <div class="info-item">
                    <label>ID de Registro</label>
                    <span class="text-secondary">#{{ usuario.id }}</span>
                  </div>
                  <div class="info-item full">
                    <label>Correo</label>
                    <span class="email-text">{{ usuario.email || usuario.correo }}</span>
                  </div>
                  <div class="info-item">
                    <label>Teléfono</label>
                    <span>{{ usuario.telefono || '—' }}</span>
                  </div>
                </div>
              </div>

              <div class="info-group">
                <div class="group-header">
                  <i class="bi bi-building"></i>
                  <span>Empresa & Organización</span>
                </div>
                <div class="info-grid">
                  <div class="info-item full">
                    <label>Entidad Asociada</label>
                    <span>{{ usuario.empresa_nombre || 'No asociada' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Fecha de Registro</label>
                    <span>{{ usuario.created_at | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="col-md-5">
              <div class="control-card">
                <div class="card-title">Seguridad & Auditoría</div>
                <div class="audit-item">
                  <span class="a-label">Estado</span>
                  <div class="a-status" [ngClass]="usuario.activo !== false ? 'success' : 'danger'">
                    <i class="bi" [ngClass]="usuario.activo !== false ? 'bi-shield-check' : 'bi-shield-exclamation'"></i>
                    {{ usuario.activo !== false ? 'Activo' : 'Inactivo' }}
                  </div>
                </div>
                <div class="audit-item mt-3">
                   <span class="a-label">Última Actualización</span>
                   <span class="a-value">{{ (usuario.updated_at || usuario.created_at) | date:'medium' }}</span>
                </div>
              </div>

              <div class="info-tip">
                <i class="bi bi-info-circle"></i>
                <p>Las contraseñas no son visibles por políticas de seguridad. El usuario puede resetearla desde su portal.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button (click)="close()" class="btn-primary-premium">Cerrar Perfil</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 1rem; }
    .modal-content-container { background: white; border-radius: 28px; width: 100%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #f1f5f9; }
    .detail-header { padding: 2rem 2.5rem; background: #f8fafc; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
    .user-brand { display: flex; align-items: center; gap: 1.5rem; }
    .avatar-large { width: 68px; height: 68px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 800; }
    .brand-text h4 { margin: 0 0 0.5rem 0; font-weight: 800; color: #1e293b; font-size: 1.5rem; }
    .badges { display: flex; gap: 0.5rem; }
    .status-badge { display: inline-flex; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; }
    .status-badge.active { background: var(--status-success-text); color: white; }
    .status-badge.inactive { background: var(--status-danger-text); color: white; }
    .role-badge { background: var(--status-info-bg); color: var(--status-info-text); padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; border: 1px solid var(--status-info-bg); }
    .btn-close-custom { width: 36px; height: 36px; border-radius: 12px; border: none; background: white; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .btn-close-custom:hover { background: #fee2e2; color: #ef4444; }
    .modal-body { padding: 2.5rem; overflow-y: auto; flex: 1; }
    .info-group { margin-bottom: 2.5rem; }
    .group-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; color: #475569; }
    .group-header i { font-size: 1.1rem; color: #3b82f6; }
    .group-header span { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .info-item { display: flex; flex-direction: column; gap: 0.3rem; }
    .info-item.full { grid-column: span 2; }
    .info-item label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .info-item span { font-size: 1rem; font-weight: 600; color: #1e293b; }
    .email-text { color: #2563eb !important; text-decoration: underline; }
    .control-card { background: var(--primary-color); border-radius: 24px; padding: 2rem; color: white; margin-bottom: 2rem; }
    .card-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 1.5rem; letter-spacing: 0.05em; }
    .audit-item { display: flex; flex-direction: column; gap: 0.5rem; }
    .a-label { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }
    .a-status { display: flex; align-items: center; gap: 0.5rem; font-weight: 800; font-size: 1.1rem; }
    .a-status.success { color: #10b981; }
    .a-status.danger { color: #f43f5e; }
    .a-value { font-size: 0.85rem; font-weight: 700; color: #cbd5e1; }
    .info-tip { display: flex; gap: 1rem; padding: 1.25rem; background: #fafafa; border-radius: 16px; border: 1px solid #f1f5f9; }
    .info-tip i { color: #94a3b8; }
    .info-tip p { font-size: 0.75rem; color: #64748b; margin: 0; line-height: 1.5; font-weight: 500; }
    .modal-footer { padding: 1.5rem 2.5rem; }
    .btn-primary-premium { width: 100%; padding: 1rem; border-radius: 16px; border: none; background: var(--primary-color); color: white; font-weight: 800; font-size: 1rem; transition: all 0.2s; }
    .btn-primary-premium:hover { background: var(--primary-hover); transform: translateY(-2px); }
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class UsuarioDetailModalComponent implements OnInit, OnDestroy {
  @Input() usuario!: User;
  @Output() onClose = new EventEmitter<void>();

  ngOnInit() { document.body.style.overflow = 'hidden'; }
  ngOnDestroy() { document.body.style.overflow = 'auto'; }

  getInitials(u: User): string {
    const name = u.nombres || u.nombre || '';
    const last = u.apellidos || u.apellido || '';
    if (!name) return '??';
    return (name[0] + (last ? last[0] : (name[1] || ''))).toUpperCase();
  }

  getAvatarColor(name: string, opacity: number): string {
    if (!name) return `rgba(148, 163, 184, ${opacity})`;
    const colors = [
      `rgba(99, 102, 241, ${opacity})`, `rgba(16, 185, 129, ${opacity})`,
      `rgba(245, 158, 11, ${opacity})`, `rgba(239, 68, 68, ${opacity})`,
      `rgba(139, 92, 246, ${opacity})`, `rgba(20, 184, 166, ${opacity})`
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  }

  close() { this.onClose.emit(); }
}

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilUsuario } from '../../../../domain/models/perfil.model';

@Component({
  selector: 'app-profile-info-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="editorial-card profile-info-card p-4 text-center">
      <div class="avatar-editorial-large mx-auto mb-3" [style.background]="getAvatarGradient()">
        {{ getInitials() }}
      </div>
      
      <h2 class="h5 fw-bold mb-1">{{ perfil.nombres }} {{ perfil.apellidos }}</h2>
      <div class="badge-editorial-role mb-4 d-inline-block">{{ perfil.rol_nombre || perfil.system_role }}</div>
      
      <div class="status-summary-editorial border-top pt-4 text-start">
        <div class="info-row-editorial d-flex justify-content-between align-items-center mb-3">
          <label class="mb-0">Estado Sesión</label>
          <div class="d-flex align-items-center fw-bold small">
            <span class="status-orbital-orb me-2" [class.active]="perfil.activo"></span>
            {{ perfil.activo ? 'ACTIVA' : 'INACTIVA' }}
          </div>
        </div>
        
        <div class="info-row-editorial d-flex justify-content-between align-items-center mb-3">
          <label class="mb-0">Correo de Acceso</label>
          <div class="fw-bold text-truncate small ms-3" style="max-width: 150px;" [title]="perfil.email">
            {{ perfil.email }}
          </div>
        </div>

        <div class="info-row-editorial d-flex justify-content-between align-items-center mb-3">
          <label class="mb-0">Último Acceso</label>
          <div class="fw-bold small text-muted">
            {{ (perfil.ultimo_acceso | date:'shortDate') || 'Hoy' }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-info-card {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 24px;
    }
    
    .avatar-editorial-large {
      width: 100px; height: 100px;
      color: white; font-size: 2.25rem; font-weight: 850;
      display: flex; align-items: center; justify-content: center;
      border-radius: 32px;
    }
    
    .badge-editorial-role {
      background: var(--primary-color, #1e293b); color: white;
      padding: 0.35rem 1rem; border-radius: 100px;
      font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    
    .status-summary-editorial { border-top: 1px solid #f1f5f9; }
    
    .status-orbital-orb {
      display: inline-block; width: 10px; height: 10px; border-radius: 50%;
      background: #94a3b8; transition: all 0.3s;
    }
    .status-orbital-orb.active { background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); }
    
    .info-row-editorial label {
      font-size: 0.65rem; color: #94a3b8; font-weight: 900;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    
    .text-corporate { color: var(--primary-color, #1e293b); }
  `]
})
export class ProfileInfoCardComponent {
  @Input() perfil!: PerfilUsuario;

  getInitials(): string {
    return ((this.perfil?.nombres?.charAt(0) || '') + (this.perfil?.apellidos?.charAt(0) || '')).toUpperCase();
  }

  getAvatarGradient(): string {
    return 'linear-gradient(135deg, var(--primary-color, #1e293b) 0%, #334155 100%)';
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-info-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="editorial-card px-4 py-4 text-center mb-3">
      <div class="profile-avatar-large mx-auto mb-3">
        {{ nombres?.charAt(0) }}{{ apellidos?.charAt(0) }}
      </div>
      <h2 class="h5 fw-bold mb-1">{{ nombres }} {{ apellidos }}</h2>
      <div class="badge-role mb-4 d-inline-block">Vendedor Autorizado</div>
      
      <div class="status-summary border-top pt-4 text-start">
        <div class="info-row d-flex justify-content-between align-items-center mb-3">
          <label class="mb-0">Estado de Cuenta</label>
          <div class="d-flex align-items-center fw-bold text-corporate small">
            <span class="status-indicator me-2" [class.active]="activo"></span>
            {{ activo ? 'ACTIVA' : 'INACTIVA' }}
          </div>
        </div>
        <div class="info-row d-flex justify-content-between align-items-center mb-3">
          <label class="mb-0">Tipo de Comisión</label>
          <div class="fw-bold text-corporate small">
            {{ tipoComision }}
          </div>
        </div>
        <div class="info-row d-flex justify-content-between align-items-center">
          <label class="mb-0">Identificación</label>
          <div class="fw-bold text-corporate small">
            {{ identificacion }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editorial-card { max-width: none !important; margin: 0 !important; padding: 1.5rem !important; }
    .profile-avatar-large {
      width: 100px; height: 100px; background: var(--primary-color); color: white;
      border-radius: 30px; display: flex; align-items: center; justify-content: center;
      font-size: 2.2rem; font-weight: 800;
    }
    .badge-role {
      background: var(--primary-color); color: white; padding: 0.25rem 0.75rem;
      border-radius: 100px; font-size: 0.75rem; font-weight: 800;
    }
    .status-indicator {
      display: inline-block; width: 10px; height: 10px; border-radius: 50%;
      background: var(--status-danger); margin-right: 0.5rem;
    }
    .status-indicator.active { background: var(--status-success); }
    .status-summary { border-top: 1px solid var(--border-color); }
    .info-row label { font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
  `]
})
export class ProfileInfoCardComponent {
  @Input() nombres: string = '';
  @Input() apellidos: string = '';
  @Input() activo: boolean = false;
  @Input() tipoComision: string = '';
  @Input() identificacion: string = '';
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilUsuario } from '../../../../domain/models/perfil.model';

@Component({
    selector: 'app-profile-empresa',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="card card-empresa mb-4" *ngIf="perfil.empresa">
      <div class="card-header-lux">
        <i class="bi bi-building-check me-2"></i> Adscripción Empresarial
      </div>
      <div class="card-body p-4 pt-2">
        <div class="d-flex align-items-center mb-4">
          <div class="logo-box">
             <img *ngIf="perfil.empresa.logo_url" [src]="perfil.empresa.logo_url" alt="Logo">
             <i *ngIf="!perfil.empresa.logo_url" class="bi bi-briefcase-fill text-muted fs-3"></i>
          </div>
          <div class="ms-3">
             <h4 class="company-name">{{ perfil.empresa.razon_social }}</h4>
             <span class="ruc-badge">ID: {{ perfil.empresa.ruc }}</span>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-md-4">
            <div class="detail-item">
              <label>Punto de Contacto</label>
              <p>{{ perfil.empresa.email }}</p>
            </div>
          </div>
          <div class="col-md-8">
            <div class="detail-item">
              <label>Ubicación Matriz</label>
              <p class="text-truncate">{{ perfil.empresa.direccion }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .card-empresa {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 24px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.01);
    }
    .card-header-lux {
      padding: 1.5rem 1.75rem;
      font-weight: 900;
      color: #161d35;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .logo-box {
      width: 64px; height: 64px;
      background: #f8fafc;
      border-radius: 16px;
      padding: 10px;
      border: 1px solid #f1f5f9;
      display: flex; align-items: center; justify-content: center;
    }
    .logo-box img { max-width: 100%; height: auto; border-radius: 8px; }

    .company-name { font-weight: 900; color: #161d35; margin: 0; font-size: 1.25rem; }
    .ruc-badge {
      font-family: monospace; font-weight: 800; background: #161d35; color: #fff;
      padding: 2px 8px; border-radius: 6px; font-size: 0.7rem;
    }

    .detail-item label {
      display: block; font-size: 0.65rem; font-weight: 850;
      color: #94a3b8; text-transform: uppercase; margin-bottom: 0.25rem;
    }
    .detail-item p { font-weight: 700; color: #334155; margin: 0; font-size: 0.95rem; }
  `]
})
export class ProfileEmpresaComponent {
    @Input() perfil!: PerfilUsuario;
}

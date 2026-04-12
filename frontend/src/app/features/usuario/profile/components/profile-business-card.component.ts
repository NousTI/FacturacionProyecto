import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilUsuario } from '../../../../domain/models/perfil.model';

@Component({
  selector: 'app-profile-business-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="editorial-card company-business-card p-4 shadow-sm" *ngIf="perfil.empresa">
      <div class="card-header-minimal-editorial mb-3 bg-transparent p-0 border-0">
        <i class="bi bi-building-check me-2 text-primary"></i> Resumen de Empresa
      </div>
      
      <div class="d-flex align-items-center mb-4 profile-business-top">
        <div class="editorial-logo-box shadow-sm">
           <img *ngIf="perfil.empresa.logo_url" [src]="perfil.empresa.logo_url" alt="Logo">
           <i *ngIf="!perfil.empresa.logo_url" class="bi bi-briefcase text-muted fs-4"></i>
        </div>
        <div class="ms-3 overflow-hidden">
           <h4 class="company-display-name-small text-truncate" [title]="perfil.empresa.razon_social">{{ perfil.empresa.razon_social }}</h4>
           <span class="editorial-badge-ruc">RUC: {{ perfil.empresa.ruc }}</span>
        </div>
      </div>

      <div class="row g-3 pt-3 border-top-editorial">
        <div class="col-12">
          <div class="info-row-editorial">
            <label>Punto de Contacto</label>
            <div class="value-text-editorial">{{ perfil.empresa.email }}</div>
          </div>
        </div>
        <div class="col-12 mt-3">
          <div class="info-row-editorial">
            <label>Ubicación Matriz</label>
            <div class="value-text-editorial small text-wrap opacity-75">{{ perfil.empresa.direccion }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .company-business-card { background: white; border: 1px solid #f1f5f9; border-radius: 24px; }
    
    .card-header-minimal-editorial {
      font-weight: 900; color: #1e293b; font-size: 0.85rem;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    
    .profile-business-top { padding-bottom: 0.5rem; }
    
    .editorial-logo-box {
      width: 58px; height: 58px; background: #f8fafc;
      border-radius: 16px; padding: 10px; border: 1.5px solid #f1f5f9;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .editorial-logo-box img { max-width: 100%; height: auto; border-radius: 6px; }

    .company-display-name-small { font-weight: 850; color: #1e293b; margin: 0; font-size: 1.15rem; letter-spacing: -0.01em; }
    
    .editorial-badge-ruc {
      font-weight: 900; background: #334155; color: #fff;
      padding: 3px 8px; border-radius: 6px; font-size: 0.65rem;
      display: inline-block; margin-top: 4px;
    }

    .border-top-editorial { border-top: 1px solid #f1f5f9; }

    .info-row-editorial label {
      display: block; font-size: 0.65rem; font-weight: 900;
      color: #94a3b8; text-transform: uppercase; margin-bottom: 0.35rem;
      letter-spacing: 0.05em;
    }
    .info-row-editorial .value-text-editorial { font-weight: 700; color: #334155; margin: 0; font-size: 0.9rem; }
  `]
})
export class ProfileBusinessCardComponent {
  @Input() perfil!: PerfilUsuario;
}

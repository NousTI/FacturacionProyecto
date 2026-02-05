import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PerfilUsuario } from '../../../../domain/models/perfil.model';

@Component({
    selector: 'app-profile-info-cards',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="row g-4 mb-4">
      <div class="col-md-4">
        <div class="info-card-lux">
          <div class="icon-lux blue"><i class="bi bi-phone"></i></div>
          <div class="content">
            <label>Contacto Directo</label>
            <span class="value">{{ perfil.telefono || 'Sin registrar' }}</span>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="info-card-lux">
          <div class="icon-lux green"><i class="bi bi-shield-check"></i></div>
          <div class="content">
            <label>Estado Laboral</label>
            <span class="value">{{ perfil.activo ? 'Activo en Nómina' : 'Desactivado' }}</span>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="info-card-lux">
          <div class="icon-lux purple"><i class="bi bi-cpu-fill"></i></div>
          <div class="content">
            <label>Privilegios de Sistema</label>
            <span class="value">{{ perfil.system_role }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .info-card-lux {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 24px;
      border: 1px solid #eef2f6;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      height: 100%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.01);
    }
    .icon-lux {
      width: 52px; height: 52px;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
    }
    .icon-lux.blue { background: #eff6ff; color: #3b82f6; }
    .icon-lux.green { background: #ecfdf5; color: #10b981; }
    .icon-lux.purple { background: #f5f3ff; color: #8b5cf6; }

    .content { display: flex; flex-direction: column; }
    label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 1rem; font-weight: 800; color: #161d35; }
  `]
})
export class ProfileInfoCardsComponent {
    @Input() perfil!: PerfilUsuario;
}

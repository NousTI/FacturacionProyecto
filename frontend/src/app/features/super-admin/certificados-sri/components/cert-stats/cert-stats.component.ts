import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-cert-stats',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="row g-4 mb-4">
      <!-- Total -->
      <div class="col-12 col-md-3">
        <div class="stat-card total animate__animated animate__fadeInUp">
          <div class="icon-wrapper">
            <i class="bi bi-shield-check"></i>
          </div>
          <div class="stat-content">
            <span class="label">Total Configurados</span>
            <h3 class="value">{{ stats.total || 0 }}</h3>
            <p class="trend">Monitoreo activo</p>
          </div>
        </div>
      </div>

      <!-- Vigentes -->
      <div class="col-12 col-md-3">
        <div class="stat-card active animate__animated animate__fadeInUp" style="animation-delay: 0.1s">
          <div class="icon-wrapper success">
            <i class="bi bi-check-lg"></i>
          </div>
          <div class="stat-content">
            <span class="label">Vigentes</span>
            <h3 class="value">{{ stats.active || 0 }}</h3>
            <p class="trend text-success">Operando normal</p>
          </div>
        </div>
      </div>

      <!-- Por Vencer -->
      <div class="col-12 col-md-3">
        <div class="stat-card warning animate__animated animate__fadeInUp" style="animation-delay: 0.2s">
            <div class="icon-wrapper warning">
            <i class="bi bi-exclamation-lg"></i>
            </div>
            <div class="stat-content">
            <span class="label">Por Vencer (< 30d)</span>
            <h3 class="value">{{ stats.expiring || 0 }}</h3>
            <p class="trend text-warning">Requieren atención</p>
            </div>
        </div>
      </div>

      <!-- Vencidos -->
      <div class="col-12 col-md-3">
        <div class="stat-card expired animate__animated animate__fadeInUp" style="animation-delay: 0.3s">
          <div class="icon-wrapper danger">
            <i class="bi bi-x-lg"></i>
          </div>
          <div class="stat-content">
            <span class="label">Vencidos / Revocados</span>
            <h3 class="value">{{ stats.expired || 0 }}</h3>
            <p class="trend text-danger">Servicio detenido</p>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .stat-card {
      background: white; border-radius: 20px; padding: 1.5rem;
      display: flex; align-items: center; gap: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03); transition: transform 0.3s ease;
      height: 100%; border: 1px solid rgba(0,0,0,0.02);
    }
    .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
    
    .icon-wrapper {
      width: 56px; height: 56px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; background: #f8fafc; color: #64748b;
    }
    .icon-wrapper.success { background: #dcfce7; color: #16a34a; }
    .icon-wrapper.warning { background: #fef9c3; color: #ca8a04; }
    .icon-wrapper.danger { background: #fee2e2; color: #dc2626; }

    .stat-content { display: flex; flex-direction: column; }
    .label { font-size: 0.85rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem; }
    .value { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.1; }
    .trend { font-size: 0.8rem; margin: 0.35rem 0 0; font-weight: 500; color: #94a3b8; }
  `]
})
export class CertStatsComponent {
    @Input() stats: any = {};
}

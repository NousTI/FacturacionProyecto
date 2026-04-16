import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-r031-stats',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent],
  template: `
    <div class="stats-grid">
      <!-- Mis empresas activas -->
      <div class="stat-card primary">
        <div class="stat-header">
          <span class="stat-label">Mis empresas activas</span>
          <div class="stat-icon"><i class="bi bi-buildings"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ data?.activas_total || 0 }}</h2>
          <div class="stat-badge success">
            <i class="bi bi-plus"></i>{{ data?.activas_este_mes || 0 }} este mes
          </div>
        </div>
      </div>

      <!-- Comisión pendiente -->
      <div class="stat-card warning">
        <div class="stat-header">
          <span class="stat-label">Comisión pendiente</span>
          <div class="stat-icon"><i class="bi bi-cash-stack"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ (data?.comision_pendiente || 0) | currency }}</h2>
          <div class="stat-badge warning">pend. aprobación</div>
        </div>
      </div>

      <!-- Vencen pronto -->
      <div class="stat-card danger">
        <div class="stat-header">
          <span class="stat-label">Vencen pronto</span>
          <div class="stat-icon"><i class="bi bi-clock-history"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ data?.vencen_pronto || 0 }}</h2>
          <div class="stat-badge danger">< de 30 días</div>
        </div>
      </div>

      <!-- Planes nuevos -->
      <div class="stat-card info">
        <div class="stat-header">
          <span class="stat-label">Planes nuevos</span>
          <div class="stat-icon"><i class="bi bi-plus-circle"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ data?.planes_nuevos_mes || 0 }}</h2>
          <div class="stat-badge" [ngClass]="data?.planes_nuevos_pct >= 0 ? 'success' : 'danger'">
            <i class="bi" [ngClass]="data?.planes_nuevos_pct >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'"></i>
            {{ data?.planes_nuevos_pct >= 0 ? '+' : '' }}{{ data?.planes_nuevos_pct }}% que el mes ant.
          </div>
        </div>
      </div>

      <!-- Upgrades -->
      <div class="stat-card purple">
        <div class="stat-header">
          <span class="stat-label">Upgrades</span>
          <div class="stat-icon"><i class="bi bi-graph-up-arrow"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ data?.upgrades_mes || 0 }}</h2>
          <div class="stat-badge" [ngClass]="data?.upgrades_pct >= 0 ? 'success' : 'danger'">
            <i class="bi" [ngClass]="data?.upgrades_pct >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'"></i>
            {{ data?.upgrades_pct >= 0 ? '+' : '' }}{{ data?.upgrades_pct }}% que el mes ant.
          </div>
        </div>
      </div>

      <!-- Renovaciones -->
      <div class="stat-card cyan">
        <div class="stat-header">
          <span class="stat-label">Renovaciones</span>
          <div class="stat-icon"><i class="bi bi-arrow-repeat"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ data?.renovaciones_mes || 0 }}</h2>
          <div class="stat-badge" [ngClass]="data?.renovaciones_pct >= 0 ? 'success' : 'danger'">
            <i class="bi" [ngClass]="data?.renovaciones_pct >= 0 ? 'bi-arrow-up' : 'bi-arrow-down'"></i>
            {{ data?.renovaciones_pct >= 0 ? '+' : '' }}{{ data?.renovaciones_pct }}% que el mes ant.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .stat-label {
      color: #64748b;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .stat-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .stat-body {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .stat-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .stat-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 8px;
      width: fit-content;
    }

    /* Colors and Variants */
    .primary .stat-icon { background: #eff6ff; color: #3b82f6; }
    .warning .stat-icon { background: #fffbeb; color: #f59e0b; }
    .danger .stat-icon { background: #fef2f2; color: #ef4444; }
    .info .stat-icon { background: #f0f9ff; color: #0ea5e9; }
    .purple .stat-icon { background: #f5f3ff; color: #8b5cf6; }
    .cyan .stat-icon { background: #ecfeff; color: #06b6d4; }

    .stat-badge.success { background: #dcfce7; color: #15803d; }
    .stat-badge.warning { background: #fef3c7; color: #b45309; }
    .stat-badge.danger { background: #fee2e2; color: #b91c1c; }
    .stat-badge:not(.success):not(.warning):not(.danger) { background: #f1f5f9; color: #475569; }
  `]
})
export class R031StatsComponent {
  @Input() data: any = null;
}

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
      <div class="stat-card primary highlight">
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

    /* Highlight card */
    .stat-card.highlight {
      background: var(--gradient-highlight);
      border-color: transparent;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
    }
    .stat-card.highlight .stat-label { color: rgba(255,255,255,0.8); }
    .stat-card.highlight .stat-value { color: #fff; }
    .stat-card.highlight .stat-icon  { background: rgba(255,255,255,0.2); color: #fff; }
    .stat-card.highlight .stat-badge { background: rgba(255,255,255,0.2); color: #fff; border: none; }

    /* Colors and Variants */
    .primary .stat-icon { background: var(--status-info-bg); color: var(--status-info); }
    .warning .stat-icon { background: var(--status-warning-bg); color: var(--status-warning); }
    .danger .stat-icon  { background: var(--status-danger-bg); color: var(--status-danger); }
    .info .stat-icon    { background: var(--status-info-bg); color: var(--status-info); }
    .purple .stat-icon  { background: var(--status-orange-bg); color: var(--status-orange); }
    .cyan .stat-icon    { background: var(--status-success-bg); color: var(--status-success); }

    .stat-badge.success { background: var(--status-success-bg); color: var(--status-success-text); }
    .stat-badge.warning { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .stat-badge.danger  { background: var(--status-danger-bg);  color: var(--status-danger-text); }
    .stat-badge:not(.success):not(.warning):not(.danger) { background: #f1f5f9; color: #475569; }
  `]
})
export class R031StatsComponent {
  @Input() data: any = null;
}

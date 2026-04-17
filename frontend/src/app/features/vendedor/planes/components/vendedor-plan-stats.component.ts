import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vendedor-plan-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row">
      <!-- Total de Planes -->
      <div class="stat-item-mini">
        <div class="icon-circle status-info-soft">
          <i class="bi bi-box-seam"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Planes</span>
          <span class="stat-value">{{ totalPlanes }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Planes Activos -->
      <div class="stat-item-mini">
        <div class="icon-circle status-success-soft">
          <i class="bi bi-check-circle"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Activos</span>
          <span class="stat-value">{{ planesActivos }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Planes Ocultos -->
      <div class="stat-item-mini">
        <div class="icon-circle status-warning-soft">
          <i class="bi bi-eye-slash"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Ocultos</span>
          <span class="stat-value">{{ planesOcultos }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-compact-row {
      background: var(--bg-main);
      border-radius: 16px;
      padding: 1rem 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 15px -3px rgba(0,0,0,0.02);
    }
    .stat-item-mini {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      flex: 1;
    }
    .icon-circle {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .stat-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.1;
    }
    .stat-divider {
      width: 1px;
      height: 30px;
      background: var(--border-color);
      margin: 0 1.5rem;
    }
    
    .status-info-soft { background: var(--status-info-bg); color: var(--status-info-text); }
    .status-success-soft { background: var(--status-success-bg); color: var(--status-success-text); }
    .status-warning-soft { background: var(--status-warning-bg); color: var(--status-warning-text); }

    @media (max-width: 992px) {
      .stats-compact-row {
        flex-wrap: wrap;
        gap: 1.5rem;
      }
      .stat-divider {
        display: none;
      }
      .stat-item-mini {
        min-width: 45%;
      }
    }
  `]
})
export class VendedorPlanStatsComponent {
  @Input() totalPlanes: number = 0;
  @Input() planesActivos: number = 0;
  @Input() planesOcultos: number = 0;
}

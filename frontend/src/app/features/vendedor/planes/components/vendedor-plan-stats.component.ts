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
        <div class="icon-circle" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6;">
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
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
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
        <div class="icon-circle" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
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
      background: white;
      border-radius: 16px;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #f1f5f9;
    }
    .stat-item-mini {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      flex: 1;
    }
    .icon-circle {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 1.15rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.2;
    }
    .stat-divider {
      width: 1px;
      height: 25px;
      background: #f1f5f9;
      margin: 0 1.25rem;
    }
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

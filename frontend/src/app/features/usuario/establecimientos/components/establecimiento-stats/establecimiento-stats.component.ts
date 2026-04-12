import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-establecimiento-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row mb-4">
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(59, 130, 246, 0.1); color: var(--status-info);">
          <i class="bi bi-building-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Establecimientos</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: var(--status-success);">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Activos</span>
          <span class="stat-value text-success">{{ active }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(99, 102, 241, 0.1); color: #6366f1;">
          <i class="bi bi-geo-alt-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Con Puntos de Emisión</span>
          <span class="stat-value">{{ con_puntos_emision }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-compact-row {
      background: white;
      border-radius: 20px;
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #f1f5f9;
      margin-bottom: 1.5rem;
    }
    .stat-item-mini {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      flex: 1;
    }
    .icon-circle {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
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
      font-size: 1.35rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.2;
    }
    .text-success {
      color: var(--status-success) !important;
    }
    .stat-divider {
      width: 1px;
      height: 35px;
      background: #f1f5f9;
      margin: 0 1.5rem;
    }
    @media (max-width: 992px) {
      .stats-compact-row {
        flex-wrap: wrap;
        gap: 1.5rem;
        padding: 1.5rem;
      }
      .stat-divider {
        display: none;
      }
      .stat-item-mini {
        min-width: 200px;
      }
    }
  `]
})
export class EstablecimientoStatsComponent {
  @Input() total: number = 0;
  @Input() active: number = 0;
  @Input() con_puntos_emision: number = 0;
}

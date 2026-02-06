import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-puntos-emision-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row mb-4">
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(22, 29, 53, 0.05); color: #161d35;">
          <i class="bi bi-printer-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Puntos Emisión</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Activos</span>
          <span class="stat-value">{{ active }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(99, 102, 241, 0.1); color: #6366f1;">
          <i class="bi bi-receipt-cutoff"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Con Facturación</span>
          <span class="stat-value">{{ con_facturacion }}</span>
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
      gap: 2rem;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
      border: 1px solid #f1f5f9;
    }

    .stat-item-mini {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .icon-circle {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #161d35;
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: #e2e8f0;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .stats-compact-row {
        padding: 1rem 1.5rem;
        gap: 1rem;
      }

      .stat-item-mini {
        gap: 0.75rem;
      }

      .icon-circle {
        width: 40px;
        height: 40px;
        font-size: 1.2rem;
      }

      .stat-value {
        font-size: 1.25rem;
      }

      .stat-label {
        font-size: 0.7rem;
      }
    }
  `]
})
export class PuntosEmisionStatsComponent {
  @Input() total: number = 0;
  @Input() active: number = 0;
  @Input() con_facturacion: number = 0;
}

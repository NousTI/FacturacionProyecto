import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-vendedor-comisiones-stats',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="stats-compact-row mb-4">
      <!-- Generated -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(22, 29, 53, 0.05); color: #161d35;">
          <i class="bi bi-cash-stack"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Generado</span>
          <span class="stat-value">{{ total | currency:'USD' }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- Pending -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
          <i class="bi bi-hourglass-split"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Pendiente</span>
          <span class="stat-value text-danger">{{ pendientes | currency:'USD' }}</span>
        </div>
      </div>
         
      <div class="stat-divider"></div>

      <!-- Paid -->
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
          <i class="bi bi-wallet2"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Pagado</span>
          <span class="stat-value text-success">{{ pagados | currency:'USD' }}</span>
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
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
    }
    .stat-item-mini {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex: 1;
    }
    .icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 0.7rem;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.2;
    }
    .stat-divider {
      width: 1px;
      height: 40px;
      background: #f1f5f9;
      margin: 0 2rem;
    }
    @media (max-width: 768px) {
      .stats-compact-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.5rem;
        padding: 1.5rem;
      }
      .stat-divider {
        display: none;
      }
    }
  `]
})
export class VendedorComisionesStatsComponent {
    @Input() total: number = 0;
    @Input() pendientes: number = 0;
    @Input() pagados: number = 0;
}

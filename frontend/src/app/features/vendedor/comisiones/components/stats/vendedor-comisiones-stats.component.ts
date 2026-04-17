import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-vendedor-comisiones-stats',
    standalone: true,
    imports: [CommonModule],
  template: `
    <div class="stats-compact-row">
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

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: var(--status-orange-bg); color: var(--status-orange-text);">
          <i class="bi bi-hourglass-split"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Pendiente</span>
          <span class="stat-value text-orange">{{ pendientes | currency:'USD' }}</span>
        </div>
      </div>
         
      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.08); color: #10b981;">
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
    :host {
      display: block;
    }
    .stats-compact-row {
      background: white;
      border-radius: 20px;
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #f1f5f9;
      margin-bottom: 0;
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
      color: var(--status-success-text) !important;
    }
    .text-danger {
      color: var(--status-danger-text) !important;
    }
    .text-orange {
      color: var(--status-orange-text) !important;
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
export class VendedorComisionesStatsComponent {
    @Input() total: number = 0;
    @Input() pendientes: number = 0;
    @Input() pagados: number = 0;
}

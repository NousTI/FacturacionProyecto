import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GastoStats } from '../../../../../domain/models/gasto.model';

@Component({
  selector: 'app-gastos-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row" *ngIf="stats">
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(59, 130, 246, 0.1); color: #2563eb;">
          <i class="bi bi-cash-coin"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Egresos</span>
          <span class="stat-value">\${{ stats.total_monto | number:'1.2-2' }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Pagados</span>
          <span class="stat-value text-success">{{ stats.pagados }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
          <i class="bi bi-clock-history"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Pendientes</span>
          <span class="stat-value text-warning">{{ stats.pendientes }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: rgba(124, 58, 237, 0.1); color: #7c3aed;">
          <i class="bi bi-journal-text"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Registros</span>
          <span class="stat-value">{{ stats.total }}</span>
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
    .text-success { color: #10b981 !important; }
    .text-warning { color: #f59e0b !important; }
    .stat-divider {
      width: 1px;
      height: 35px;
      background: #f1f5f9;
      margin: 0 1.5rem;
    }
    @media (max-width: 1200px) {
      .stats-compact-row { flex-wrap: wrap; gap: 1.5rem; padding: 1.5rem; }
      .stat-divider { display: none; }
      .stat-item-mini { min-width: 45%; }
    }
    @media (max-width: 576px) {
      .stat-item-mini { min-width: 100%; }
    }
  `]
})
export class GastosStatsComponent {
  @Input() stats: GastoStats | null = null;
}

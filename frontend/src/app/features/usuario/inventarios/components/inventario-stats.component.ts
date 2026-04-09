import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inventario-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid" *ngIf="stats">
      <div class="stat-card">
        <div class="stat-icon val-icon"><i class="bi bi-currency-dollar"></i></div>
        <div class="stat-info">
          <span class="stat-label">Valor Inventario</span>
          <span class="stat-value">{{ stats.total_valor_inventario | currency }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon mov-icon"><i class="bi bi-arrow-left-right"></i></div>
        <div class="stat-info">
          <span class="stat-label">Movimientos (30d)</span>
          <span class="stat-value">{{ stats.movimientos_30d }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon alert-icon"><i class="bi bi-exclamation-triangle"></i></div>
        <div class="stat-info">
          <span class="stat-label">Stock Bajo</span>
          <span class="stat-value danger">{{ stats.productos_stock_bajo }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-4px); }
    .stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .val-icon { background: #ecfdf5; color: #10b981; }
    .mov-icon { background: #eff6ff; color: #3b82f6; }
    .alert-icon { background: #fff7ed; color: #f97316; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.875rem; color: #64748b; font-weight: 500; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .stat-value.danger { color: #ef4444; }
  `]
})
export class InventarioStatsComponent {
  @Input() stats: any;
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendedorEmpresaStats } from '../services/vendedor-empresa.service';

@Component({
  selector: 'app-vendedor-empresa-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-compact-row">
      <div class="stat-item-mini">
        <div class="icon-circle status-info-soft">
          <i class="bi bi-building"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Empresas</span>
          <span class="stat-value">{{ stats.total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle status-success-soft">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Empresas Activas</span>
          <span class="stat-value text-success">{{ stats.activas }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle status-warning-soft">
          <i class="bi bi-dash-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Empresas Inactivas</span>
          <span class="stat-value">{{ stats.inactivas }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .stats-compact-row {
      background: var(--bg-main);
      border-radius: 20px;
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid var(--border-color);
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
    
    .status-info-soft { background: var(--status-info-bg); color: var(--status-info); }
    .status-success-soft { background: var(--status-success-bg); color: var(--status-success); }
    .status-warning-soft { background: var(--status-warning-bg); color: var(--status-warning); }

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
    }
    .stat-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.2;
    }
    .text-success { color: var(--status-success-text) !important; }
    
    .stat-divider {
      width: 1px;
      height: 35px;
      background: var(--border-color);
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
export class VendedorEmpresaStatsComponent {
  @Input() stats: VendedorEmpresaStats = { total: 0, activas: 0, inactivas: 0 };
}

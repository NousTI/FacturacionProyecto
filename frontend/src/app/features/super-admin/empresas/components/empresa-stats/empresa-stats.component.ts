import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empresa-stats',
  template: `
    <div class="stats-compact-row">
      <div class="stat-item-mini">
        <div class="icon-circle" style="background: var(--status-info-bg); color: var(--status-info-text);">
          <i class="bi bi-building"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Empresas</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: var(--status-success-bg); color: var(--status-success-text);">
          <i class="bi bi-check-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Empresas Activas</span>
          <span class="stat-value">{{ active }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <div class="stat-item-mini">
        <div class="icon-circle" style="background: var(--status-danger-bg); color: var(--status-danger-text);">
          <i class="bi bi-x-circle-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Empresas Inactivas</span>
          <span class="stat-value">{{ inactive }}</span>
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
  `],
  standalone: true,
  imports: [CommonModule]
})
export class EmpresaStatsComponent {
  @Input() total: number = 0;
  @Input() active: number = 0;
  @Input() inactive: number = 0;
}

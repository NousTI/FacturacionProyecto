import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-clientes-stats',
    template: `
    <div class="stats-compact-row mb-3">
      <!-- TOTAL -->
      <div class="stat-item-mini">
        <div class="icon-circle status-neutral-soft">
          <i class="bi bi-people-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Clientes</span>
          <span class="stat-value">{{ total }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- ACTIVOS -->
      <div class="stat-item-mini">
        <div class="icon-circle status-success-soft">
          <i class="bi bi-person-check-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Usuarios Activos</span>
          <span class="stat-value">{{ activos }}</span>
        </div>
      </div>

      <div class="stat-divider"></div>

      <!-- INACTIVOS -->
      <div class="stat-item-mini">
        <div class="icon-circle status-danger-soft">
          <i class="bi bi-person-x-fill"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Bajas / Inactivos</span>
          <span class="stat-value">{{ inactivos }}</span>
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
      font-weight: 800;
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
    
    .status-neutral-soft { background: var(--status-natural-bg); color: var(--text-main); }
    .status-success-soft { background: var(--status-success-bg); color: var(--status-success-text); }
    .status-danger-soft { background: var(--status-danger-bg); color: var(--status-danger-text); }

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
export class ClientesStatsComponent {
    @Input() total: number = 0;
    @Input() activos: number = 0;
    @Input() inactivos: number = 0;
}

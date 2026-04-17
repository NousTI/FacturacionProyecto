import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-cert-stats',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="stats-compact-row">
      <div class="stat-item-mini">
        <div class="icon-circle info">
          <i class="bi bi-shield-check"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Configurados</span>
          <span class="stat-value">{{ stats.total || 0 }}</span>
        </div>
      </div>
  
      <div class="stat-divider"></div>
  
      <div class="stat-item-mini">
        <div class="icon-circle success">
          <i class="bi bi-check-lg"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Vigentes</span>
          <span class="stat-value text-success">{{ stats.active || 0 }}</span>
        </div>
      </div>
  
      <div class="stat-divider"></div>
  
      <div class="stat-item-mini">
        <div class="icon-circle warning">
            <i class="bi bi-exclamation-lg"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Por Vencer (< 30d)</span>
          <span class="stat-value text-warning">{{ stats.expiring || 0 }}</span>
        </div>
      </div>
  
      <div class="stat-divider"></div>
  
      <div class="stat-item-mini">
        <div class="icon-circle danger">
          <i class="bi bi-x-lg"></i>
        </div>
        <div class="stat-info">
          <span class="stat-label">Vencidos / Revocados</span>
          <span class="stat-value text-danger">{{ stats.expired || 0 }}</span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }
    .stats-compact-row {
      background: var(--bg-main); border-radius: 20px; padding: 1.25rem 2rem;
      display: flex; align-items: center; justify-content: space-between;
      border: 1px solid var(--border-color);
    }
    .stat-item-mini { display: flex; align-items: center; gap: 1.1rem; flex: 1; }
    
    .icon-circle {
      width: 42px; height: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .icon-circle.info { background: var(--status-info-bg); color: var(--status-info); }
    .icon-circle.success { background: var(--status-success-bg); color: var(--status-success); }
    .icon-circle.warning { background: var(--status-warning-bg); color: var(--status-warning); }
    .icon-circle.danger { background: var(--status-danger-bg); color: var(--status-danger); }

    .stat-info { display: flex; flex-direction: column; }
    .stat-label {
      font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;
    }
    .stat-value { font-size: 1.35rem; font-weight: 800; color: var(--text-main); line-height: 1.2; }
    
    .text-success { color: var(--status-success) !important; }
    .text-warning { color: var(--status-warning) !important; }
    .text-danger { color: var(--status-danger) !important; }

    .stat-divider { width: 1px; height: 35px; background: var(--border-color); margin: 0 1.5rem; }
    
    @media (max-width: 992px) {
      .stats-compact-row { flex-wrap: wrap; gap: 1.5rem; }
      .stat-divider { display: none; }
      .stat-item-mini { min-width: 45%; }
    }
  `]
})
export class CertStatsComponent {
    @Input() stats: any = {};
}

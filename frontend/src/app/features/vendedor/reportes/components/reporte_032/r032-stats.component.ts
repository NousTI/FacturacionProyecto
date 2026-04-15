import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-r032-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid">
      <!-- Ya depositado -->
      <div class="stat-card success">
        <div class="stat-header">
          <span class="stat-label">Ya depositado</span>
          <div class="stat-icon"><i class="bi bi-wallet2"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ (data?.ya_depositado || 0) | currency }}</h2>
          <div class="stat-badge success">cobrado</div>
        </div>
      </div>

      <!-- Pendiente aprobación -->
      <div class="stat-card warning">
        <div class="stat-header">
          <span class="stat-label">Pendiente aprobación</span>
          <div class="stat-icon"><i class="bi bi-clock-history"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ (data?.pendiente_aprobacion || 0) | currency }}</h2>
          <div class="stat-badge warning">en revisión</div>
        </div>
      </div>

      <!-- Total histórico -->
      <div class="stat-card indigo">
        <div class="stat-header">
          <span class="stat-label">Total histórico</span>
          <div class="stat-icon"><i class="bi bi-graph-up-arrow"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ (data?.total_historico || 0) | currency }}</h2>
          <div class="stat-badge indigo">acumulado</div>
        </div>
      </div>

      <!-- Futuras comisiones en riesgo -->
      <div class="stat-card danger">
        <div class="stat-header">
          <span class="stat-label">Futuras comisiones en riesgo</span>
          <div class="stat-icon"><i class="bi bi-exclamation-octagon"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ (data?.comisiones_en_riesgo || 0) | currency }}</h2>
          <div class="stat-badge danger">por planes que vencen en <30 días</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 20px;
      padding: 1.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      position: relative;
      overflow: hidden;
    }

    .stat-card:hover { 
      transform: translateY(-5px); 
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
      border-color: #e2e8f0;
    }

    .stat-header { display: flex; justify-content: space-between; align-items: center; }
    .stat-label { color: #64748b; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.35rem; }

    .stat-body { display: flex; flex-direction: column; gap: 0.75rem; }
    .stat-value { font-size: 2rem; font-weight: 850; color: #0f172a; margin: 0; letter-spacing: -0.04em; }

    .stat-badge {
      display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.7rem;
      font-weight: 800; padding: 0.35rem 0.85rem; border-radius: 12px; width: fit-content;
      text-transform: lowercase;
    }

    /* THEMES */
    .success .stat-icon { background: #ecfdf5; color: #059669; }
    .stat-badge.success { background: #ecfdf5; color: #065f46; border: 1px solid #d1fae5; }

    .warning .stat-icon { background: #fffbeb; color: #d97706; }
    .stat-badge.warning { background: #fff7ed; color: #9a3412; border: 1px solid #ffedd5; }

    .indigo .stat-icon { background: #eef2ff; color: #4f46e5; }
    .stat-badge.indigo { background: #eef2ff; color: #3730a3; border: 1px solid #e0e7ff; }

    .danger .stat-icon { background: #fff1f2; color: #e11d48; }
    .stat-badge.danger { background: #fff1f2; color: #9f1239; border: 1px solid #ffe4e6; }
  `]
})
export class R032StatsComponent {
  @Input() data: any = null;
}

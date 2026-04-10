import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-r032-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-grid">
      <!-- Por cobrar -->
      <div class="stat-card success">
        <div class="stat-header">
          <span class="stat-label">Por cobrar</span>
          <div class="stat-icon"><i class="bi bi-wallet2"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ (data?.por_cobrar || 0) | currency }}</h2>
          <div class="stat-badge success">ya depositado</div>
        </div>
      </div>

      <!-- Pendiente aprobación -->
      <div class="stat-card warning">
        <div class="stat-header">
          <span class="stat-label">Pendiente aprobación</span>
          <div class="stat-icon"><i class="bi bi-hourglass-split"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ (data?.pendiente_aprobacion || 0) | currency }}</h2>
          <div class="stat-badge warning">en revisión</div>
        </div>
      </div>

      <!-- Total histórico -->
      <div class="stat-card dark">
        <div class="stat-header">
          <span class="stat-label">Total histórico</span>
          <div class="stat-icon"><i class="bi bi-bank"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ (data?.total_historico || 0) | currency }}</h2>
          <div class="stat-badge dark">acumulado</div>
        </div>
      </div>

      <!-- Futuras comisiones en riesgo -->
      <div class="stat-card danger">
        <div class="stat-header">
          <span class="stat-label">Comisiones en riesgo</span>
          <div class="stat-icon"><i class="bi bi-shield-exclamation"></i></div>
        </div>
        <div class="stat-body">
          <h2 class="stat-value">{{ (data?.comisiones_en_riesgo || 0) | currency }}</h2>
          <div class="stat-badge danger">vencimiento < 30 días</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 24px;
      padding: 1.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(226, 232, 240, 0.5);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }

    .stat-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .stat-label { color: #64748b; font-size: 0.875rem; font-weight: 600; letter-spacing: -0.01em; }
    .stat-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }

    .stat-body { display: flex; flex-direction: column; gap: 0.5rem; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.02em; }

    .stat-badge {
      display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem;
      font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 100px; width: fit-content;
    }

    .success .stat-icon { background: #dcfce7; color: #16a34a; }
    .warning .stat-icon { background: #fffbeb; color: #d97706; }
    .dark .stat-icon { background: #f1f5f9; color: #1e293b; }
    .danger .stat-icon { background: #fef2f2; color: #dc2626; }

    .stat-badge.success { background: #dcfce7; color: #15803d; }
    .stat-badge.warning { background: #fef3c7; color: #b45309; }
    .stat-badge.dark { background: #f1f5f9; color: #475569; }
    .stat-badge.danger { background: #fee2e2; color: #b91c1c; }
  `]
})
export class R032StatsComponent {
  @Input() data: any = null;
}

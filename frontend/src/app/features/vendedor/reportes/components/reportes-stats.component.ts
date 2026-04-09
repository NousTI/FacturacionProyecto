import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reportes-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="metrics-grid">
      <!-- Tarjeta 1: Empresas -->
      <div class="metric-card">
        <div class="metric-icon bg-blue-100 text-blue-600">
          <i class="bi bi-buildings-fill"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-title">Empresas</h3>
          <p class="metric-value">{{ metricas?.total_empresas || 0 }}</p>
          <span class="metric-sub">{{ metricas?.empresas_activas || 0 }} activas</span>
        </div>
      </div>

      <!-- Tarjeta 2: Por Renovar -->
      <div class="metric-card">
        <div class="metric-icon bg-red-100 text-red-600">
          <i class="bi bi-calendar-x-fill"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-title">Por Renovar</h3>
          <p class="metric-value text-danger">{{ totalRenovaciones }}</p>
          <span class="metric-sub">{{ metricas?.total_vencidas || 0 }} vencidas / {{ metricas?.total_proximas || 0 }} pronto</span>
        </div>
      </div>

      <!-- Tarjeta 3: Mis Ganancias -->
      <div class="metric-card">
        <div class="metric-icon bg-amber-100 text-amber-600">
          <i class="bi bi-currency-dollar"></i>
        </div>
        <div class="metric-content">
          <h3 class="metric-title">Comisiones del Mes</h3>
          <p class="metric-value">{{ (metricas?.comisiones_mes || 0) | currency }}</p>
          <span class="metric-sub">Periodo actual</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 992px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }

    .metric-card {
      background: white;
      border: 1px solid rgba(0,0,0,0.05);
      border-radius: 20px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
      transition: all 0.3s ease;
    }

    .metric-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .metric-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.25rem;
    }

    .metric-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1;
      margin-bottom: 0.35rem;
    }

    .metric-sub {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }

    .bg-blue-100 { background: #eff6ff; }
    .text-blue-600 { color: #2563eb; }
    .bg-amber-100 { background: #fffbeb; }
    .text-amber-600 { color: #d97706; }
    .bg-red-100 { background: #fef2f2; }
    .text-red-600 { color: #dc2626; }
    .text-danger { color: #dc2626; }
  `]
})
export class ReportesStatsComponent {
  @Input() metricas: any = null;

  get totalRenovaciones(): number {
    if (!this.metricas) return 0;
    return (this.metricas.total_vencidas || 0) + (this.metricas.total_proximas || 0);
  }
}

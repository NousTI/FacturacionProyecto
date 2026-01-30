import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clientes-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row g-4 mb-4">
      <div class="col-md-4">
        <div class="stat-card-premium">
          <div class="stat-icon bg-soft-primary">
            <i class="bi bi-people-fill"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Usuarios</span>
            <h2 class="stat-value">{{ stats.total }}</h2>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="stat-card-premium">
          <div class="stat-icon bg-soft-success">
            <i class="bi bi-person-check-fill"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Usuarios Activos</span>
            <h2 class="stat-value">{{ stats.activos }}</h2>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="stat-card-premium">
          <div class="stat-icon bg-soft-info">
            <i class="bi bi-person-plus-fill"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Nuevos (Mes)</span>
            <h2 class="stat-value">{{ stats.nuevos_mes }}</h2>
            <span class="stat-badge success">+12%</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card-premium {
      background: white; border-radius: 20px; padding: 1.5rem;
      display: flex; align-items: center; gap: 1.25rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #f1f5f9;
    }
    .stat-icon {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
    }
    .bg-soft-primary { background: #eef2ff; color: #4f46e5; }
    .bg-soft-success { background: #f0fdf4; color: #16a34a; }
    .bg-soft-info { background: #eff6ff; color: #2563eb; }
    
    .stat-info { display: flex; flex-direction: column; flex: 1; }
    .stat-label { font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0; }
    .stat-badge { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px; align-self: flex-start; margin-top: 4px; }
    .stat-badge.success { background: #dcfce7; color: #15803d; }
  `]
})
export class ClientesStatsComponent {
  @Input() stats: any = { total: 0, activos: 0, nuevos_mes: 0 };
}

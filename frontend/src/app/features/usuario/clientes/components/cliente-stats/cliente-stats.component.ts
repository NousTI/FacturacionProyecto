import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-cliente-stats',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="stats-grid mb-4">
      <!-- Total Clientes -->
      <div class="stat-card soft-card">
        <div class="icon-box primary">
          <i class="bi bi-people-fill"></i>
        </div>
        <div class="stat-info">
          <span class="label">Total Clientes</span>
          <span class="value">{{ total }}</span>
        </div>
      </div>

      <!-- Activos -->
      <div class="stat-card soft-card">
        <div class="icon-box success">
          <i class="bi bi-person-check-fill"></i>
        </div>
        <div class="stat-info">
          <span class="label">Usuarios Activos</span>
          <span class="value text-success">{{ active }}</span>
        </div>
      </div>

      <!-- Con Crédito -->
      <div class="stat-card soft-card">
        <div class="icon-box info">
          <i class="bi bi-credit-card-fill"></i>
        </div>
        <div class="stat-info">
          <span class="label">Con Crédito</span>
          <span class="value text-info">{{ credit }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    
    .stat-card { background: white; padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-3px); }
    
    .soft-card { border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
    
    .icon-box { 
      width: 54px; height: 54px; border-radius: 16px; 
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem; 
    }
    .icon-box.primary { background: #eff6ff; color: #2563eb; }
    .icon-box.success { background: #f0fdf4; color: #166534; }
    .icon-box.info { background: #fdf2f8; color: #ec4899; }
    
    .stat-info { display: flex; flex-direction: column; }
    .stat-info .label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-info .value { font-size: 1.75rem; font-weight: 800; color: #1e293b; line-height: 1.1; }

    @media (max-width: 992px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 576px) { .stats-grid { grid-template-columns: 1fr; } }
  `]
})
export class ClienteStatsComponent {
    @Input() total: number = 0;
    @Input() active: number = 0;
    @Input() credit: number = 0;
}

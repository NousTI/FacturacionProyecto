import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-proveedor-stats',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="stats-lux-container mb-4">
      <!-- Total Proveedores -->
      <div class="stat-lux-card">
        <div class="icon-box-lux primary">
          <i class="bi bi-truck"></i>
        </div>
        <div class="stat-content-lux">
          <span class="stat-label-lux">Total Proveedores</span>
          <span class="stat-value-lux">{{ total }}</span>
        </div>
      </div>

      <!-- Activos -->
      <div class="stat-lux-card">
        <div class="icon-box-lux success">
          <i class="bi bi-patch-check-fill"></i>
        </div>
        <div class="stat-content-lux">
          <span class="stat-label-lux">Proveedores Activos</span>
          <span class="stat-value-lux">{{ activos }}</span>
        </div>
      </div>

      <!-- Con Crédito -->
      <div class="stat-lux-card">
        <div class="icon-box-lux warning">
          <i class="bi bi-calendar-check-fill"></i>
        </div>
        <div class="stat-content-lux">
          <span class="stat-label-lux">Con Días de Crédito</span>
          <span class="stat-value-lux">{{ conCredito }}</span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .stats-lux-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .stat-lux-card {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 24px;
      padding: 1.5rem 1.75rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .stat-lux-card:hover {
      border-color: #e2e8f0;
      box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.04);
      transform: translateY(-2px);
    }
    .icon-box-lux {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }
    .icon-box-lux.primary  { background: #eff6ff; color: #3b82f6; }
    .icon-box-lux.success  { background: #ecfdf5; color: #10b981; }
    .icon-box-lux.warning  { background: #fffbeb; color: #f59e0b; }
    .stat-content-lux {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .stat-label-lux {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value-lux {
      font-size: 1.5rem;
      font-weight: 800;
      color: #161d35;
      letter-spacing: -0.5px;
    }
    @media (max-width: 992px) {
      .stats-lux-container { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 576px) {
      .stats-lux-container { grid-template-columns: 1fr; }
    }
  `]
})
export class ProveedorStatsComponent {
    @Input() total: number = 0;
    @Input() activos: number = 0;
    @Input() conCredito: number = 0;
}

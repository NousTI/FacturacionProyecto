import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';
import { DashboardKPIs } from '../../../../../shared/services/dashboard.service';

@Component({
  selector: 'app-dashboard-kpis',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent],
  providers: [CurrencyPipe],
  template: `
    <div class="row g-3 mb-4">
      <!-- Mismo diseño que dashboard de superadmin: kpi-card-premium -->
      
      <!-- Fila 1: Operativa -->
      <div class="col-12 col-md-4">
        <div class="kpi-card-premium">
          <div class="icon-circle" style="color: #6366f1; background: rgba(99,102,241,.1)">
            <i class="bi bi-receipt"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">{{ getMontoTitle() }}
              <app-info-tooltip message="Suma total de facturas autorizadas en el periodo seleccionado."></app-info-tooltip>
            </span>
            <div class="d-flex align-items-baseline gap-2">
              <span class="kpi-value">{{ (kpis?.ventas_periodo || 0) | currency:'USD':'symbol':'1.2-2' }}</span>
              <span *ngIf="kpis?.variacion_ventas" class="kpi-trend" [ngClass]="kpis.variacion_ventas >= 0 ? 'up' : 'down'">
                 <i class="bi" [ngClass]="kpis.variacion_ventas >= 0 ? 'bi-arrow-up-short' : 'bi-arrow-down-short'"></i>
                 {{ kpis.variacion_ventas }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="kpi-card-premium">
          <div class="icon-circle" style="color: #10b981; background: rgba(16,185,129,.1)">
            <i class="bi bi-check-circle"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">{{ getVentasTitle() }}
              <app-info-tooltip message="Cantidad de comprobantes emitidos durante el periodo seleccionado."></app-info-tooltip>
            </span>
            <span class="kpi-value">{{ kpis?.ventas_hoy || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="kpi-card-premium">
          <div class="icon-circle" style="color: #f59e0b; background: rgba(245,158,11,.1)">
            <i class="bi bi-hourglass-split"></i>
          </div>
          <div class="kpi-content">
            <span class="kpi-label d-flex align-items-center gap-1">{{ getSaldosTitle() }}
              <app-info-tooltip message="Total de facturas autorizadas que aún no han sido cobradas en este periodo."></app-info-tooltip>
            </span>
            <span class="kpi-value">{{ (kpis?.cuentas_cobrar || 0) | currency:'USD':'symbol':'1.2-2' }}</span>
          </div>
        </div>
      </div>

      <!-- Fila 2: Ejecutiva (Solo si hay datos ejecutivos) -->
      <ng-container *ngIf="kpis?.ticket_promedio">
        <div class="col-6 col-lg-3">
          <div class="kpi-card-premium">
            <div class="icon-circle" style="color: #8b5cf6; background: rgba(139,92,246,.1)">
              <i class="bi bi-cart-check"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Ticket Promedio</span>
              <span class="kpi-value text-truncate">{{ (kpis?.ticket_promedio || 0) | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="kpi-card-premium">
            <div class="icon-circle" style="color: #10b981; background: rgba(16,185,129,.1)">
              <i class="bi bi-graph-up-arrow"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Utilidad Neta</span>
              <span class="kpi-value text-truncate">{{ (kpis?.utilidad_neta || 0) | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="kpi-card-premium">
            <div class="icon-circle" style="color: #4f46e5; background: rgba(79,70,229,.1)">
              <i class="bi bi-arrow-repeat"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">% Recuperación</span>
              <span class="kpi-value">{{ (kpis?.porcentaje_recuperacion?.toFixed(1) + '%') || '0%' }}</span>
            </div>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="kpi-card-premium">
            <div class="icon-circle" style="color: #f43f5e; background: rgba(244,63,94,.1)">
              <i class="bi bi-people"></i>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Clientes Activos</span>
              <span class="kpi-value">{{ kpis?.clientes_activos || 0 }}</span>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .kpi-card-premium {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.1rem;
      height: 100%;
      /* NO ANIMATIONS OR SHADOWS AS REQUESTED */
      transition: none;
      box-shadow: none;
    }
    .icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .kpi-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .kpi-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.2;
    }
    .kpi-trend {
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
    }
    .up { color: #10b981; }
    .down { color: #ef4444; }

    @media (max-width: 1400px) {
      .kpi-value { font-size: 1.15rem; }
      .kpi-card-premium { padding: 1rem; gap: 0.85rem; }
    }
  `]
})
export class DashboardKpisComponent {
  @Input() kpis?: DashboardKPIs;
  @Input() selectedPeriod: 'day' | 'week' | 'month' = 'month';

  getMontoTitle(): string {
    const map = { day: 'Monto de Hoy', week: 'Monto Semanal', month: 'Monto del Mes' };
    return map[this.selectedPeriod];
  }

  getVentasTitle(): string {
    const map = { day: 'Ventas de Hoy', week: 'Ventas Semanales', month: 'Ventas del Mes' };
    return map[this.selectedPeriod];
  }

  getSaldosTitle(): string {
    const map = { day: 'Saldos de Hoy', week: 'Saldos Semanales', month: 'Saldos del Mes' };
    return map[this.selectedPeriod];
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteGlobal } from '../../../services/reportes.service';

type RangoTipo = 'mes_actual' | 'mes_anterior' | 'anio_actual' | 'personalizado';

@Component({
  selector: 'app-r031-kpis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-grid mb-4">
      <!-- Ingresos del Año — DESTACADO -->
      <div class="kpi-card kpi-active-highlight">
        <span class="kpi-label">Ingresos del año</span>
        <span class="kpi-value">{{ datos.ingresos_anio | currency:'USD':'symbol':'1.0-2' }}</span>
        <span class="kpi-sub">
          {{ datos.variacion_ingresos_anio >= 0 ? '+' : '' }}{{ datos.variacion_ingresos_anio }}% vs anterior
        </span>
      </div>

      <!-- Ingresos del Mes -->
      <div class="kpi-card">
        <span class="kpi-label">Ingresos {{ periodoLabel }}</span>
        <span class="kpi-value">{{ datos.ingresos_mes | currency:'USD':'symbol':'1.0-2' }}</span>
        <span class="kpi-sub" [class.text-success]="datos.variacion_ingresos_mes >= 0" [class.text-danger]="datos.variacion_ingresos_mes < 0">
          {{ datos.variacion_ingresos_mes >= 0 ? '+' : '' }}{{ datos.variacion_ingresos_mes }}% vs anterior
        </span>
      </div>

      <!-- Empresas Activas -->
      <div class="kpi-card">
        <span class="kpi-label">Empresas activas</span>
        <span class="kpi-value-huge">{{ datos.empresas_activas | number }}</span>
        <div class="kpi-sub-row">
          <span class="kpi-growth-badge" [class.badge-up]="datos.variacion_empresas_activas_valor >= 0" [class.badge-down]="datos.variacion_empresas_activas_valor < 0">
            <i class="bi" [class.bi-arrow-up-right]="datos.variacion_empresas_activas_valor >= 0" [class.bi-arrow-down-right]="datos.variacion_empresas_activas_valor < 0"></i>
            {{ datos.variacion_empresas_activas_valor >= 0 ? '+' : '' }}{{ datos.variacion_empresas_activas_valor }}
          </span>
          <span class="kpi-sub-label">{{ periodoLabel }}</span>
        </div>
      </div>

      <!-- Usuarios Nuevos -->
      <div class="kpi-card">
        <span class="kpi-label">Usuarios nuevos</span>
        <span class="kpi-value-huge">{{ datos.usuarios_nuevos_mes }}</span>
        <div class="kpi-sub-row">
          <span class="kpi-growth-badge" [class.badge-up]="datos.variacion_usuarios_nuevos >= 0" [class.badge-down]="datos.variacion_usuarios_nuevos < 0">
            <i class="bi" [class.bi-arrow-up-right]="datos.variacion_usuarios_nuevos >= 0" [class.bi-arrow-down-right]="datos.variacion_usuarios_nuevos < 0"></i>
            {{ datos.variacion_usuarios_nuevos >= 0 ? '+' : '' }}{{ datos.variacion_usuarios_nuevos }}
          </span>
          <span class="kpi-sub-label">{{ periodoLabel }}</span>
        </div>
      </div>

      <!-- Tasa Crecimiento -->
      <div class="kpi-card">
        <span class="kpi-label">Tasa de crecimiento</span>
        <span class="kpi-value text-success">{{ datos.tasa_crecimiento }}%</span>
        <span class="kpi-sub text-muted">mensual</span>
      </div>

      <!-- Tasa Abandono -->
      <div class="kpi-card">
        <span class="kpi-label">Tasa de abandono</span>
        <span class="kpi-value text-danger">{{ datos.tasa_abandono }}%</span>
        <span class="kpi-sub text-muted">de usuarios</span>
      </div>

      <!-- Zona Upgrade -->
      <div class="kpi-card kpi-warning">
        <span class="kpi-label">Zona upgrade</span>
        <span class="kpi-value">{{ datos.zona_upgrade }}</span>
        <span class="kpi-sub text-warning">empresas</span>
      </div>

      <!-- Zona Rescate -->
      <div class="kpi-card kpi-danger">
        <span class="kpi-label">Zona de rescate</span>
        <span class="kpi-value">{{ datos.zona_rescate }}</span>
        <span class="kpi-sub text-danger">empresas</span>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      padding: 0.85rem 1rem;
      min-height: 95px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: #e2e8f0; }

    .kpi-label { font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; letter-spacing: 0.05em; }
    .kpi-value { font-size: 1.1rem; font-weight: 800; color: #0f172a; display: block; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kpi-value-huge { font-size: 1.75rem; font-weight: 800; color: #0f172a; line-height: 1; display: block; }
    .kpi-sub-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .kpi-growth-badge {
      padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700;
      display: inline-flex; align-items: center; gap: 0.2rem;
    }
    .badge-up   { background: var(--status-success-bg); color: var(--status-success-text); }
    .badge-down { background: var(--status-danger-bg);  color: var(--status-danger-text); }
    .kpi-sub-label { font-size: 0.7rem; font-weight: 500; color: #94a3b8; }
    .kpi-sub { font-size: 0.72rem; font-weight: 600; }

    /* Highlight */
    .kpi-active-highlight {
      background: var(--gradient-highlight);
      border-color: transparent;
      box-shadow: 0 4px 18px rgba(168, 85, 247, 0.35);
    }
    .kpi-active-highlight .kpi-label      { color: rgba(255,255,255,0.8); }
    .kpi-active-highlight .kpi-value-huge { color: #fff; }
    .kpi-active-highlight .kpi-value      { color: #fff; }
    .kpi-active-highlight .kpi-sub        { color: rgba(255,255,255,0.8); }
    .kpi-active-highlight .kpi-growth-badge { background: rgba(255,255,255,0.2); color: #fff; }
    .kpi-active-highlight .kpi-sub-label  { color: rgba(255,255,255,0.7); }

    /* Themed cards */
    .kpi-warning { background: var(--status-warning-bg); }
    .kpi-warning .kpi-label { color: var(--status-warning-text); }
    .kpi-warning .kpi-value { color: var(--status-warning-text); }
    .kpi-warning .kpi-sub   { color: var(--status-warning-text); }

    .kpi-danger { background: var(--status-danger-bg); }
    .kpi-danger .kpi-label { color: var(--status-danger-text); }
    .kpi-danger .kpi-value { color: var(--status-danger-text); }
    .kpi-danger .kpi-sub   { color: var(--status-danger-text); }
  `]
})
export class R031KpisComponent {
  @Input() datos!: ReporteGlobal;
  @Input() rangoTipo: RangoTipo = 'mes_actual';

  get periodoLabel(): string {
    switch (this.rangoTipo) {
      case 'anio_actual': return 'este año';
      case 'mes_anterior': return 'mes anterior';
      case 'personalizado': return 'en el período';
      default: return 'este mes';
    }
  }
}

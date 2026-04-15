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
      <!-- Empresas Activas -->
      <div class="kpi-card kpi-active-highlight">
        <span class="kpi-label">Empresas activas</span>
        <span class="kpi-value">{{ datos.empresas_activas }}</span>
        <div class="kpi-sub-v2" [class.text-success]="datos.variacion_empresas_activas_valor >= 0" [class.text-danger]="datos.variacion_empresas_activas_valor < 0">
          <span class="fw-bold">{{ datos.variacion_empresas_activas_valor >= 0 ? '+' : '' }}{{ datos.variacion_empresas_activas_valor }}</span>
          <span class="ms-1 text-muted fw-normal">{{ periodoLabel }}</span>
        </div>
      </div>

      <!-- Ingresos del Año -->
      <div class="kpi-card">
        <span class="kpi-label">Ingresos del año</span>
        <span class="kpi-value">{{ datos.ingresos_anio | currency:'USD':'symbol':'1.0-2' }}</span>
        <span class="kpi-sub" [class.text-success]="datos.variacion_ingresos_anio >= 0" [class.text-danger]="datos.variacion_ingresos_anio < 0">
          {{ datos.variacion_ingresos_anio >= 0 ? '+' : '' }}{{ datos.variacion_ingresos_anio }}% vs anterior
        </span>
      </div>

      <!-- Ingresos del Mes -->
      <div class="kpi-card">
        <span class="kpi-label">Ingresos del mes</span>
        <span class="kpi-value">{{ datos.ingresos_mes | currency:'USD':'symbol':'1.0-2' }}</span>
        <span class="kpi-sub" [class.text-success]="datos.variacion_ingresos_mes >= 0" [class.text-danger]="datos.variacion_ingresos_mes < 0">
          {{ datos.variacion_ingresos_mes >= 0 ? '+' : '' }}{{ datos.variacion_ingresos_mes }}% vs anterior
        </span>
      </div>

      <!-- Usuarios Nuevos -->
      <div class="kpi-card">
        <span class="kpi-label">Usuarios nuevos</span>
        <span class="kpi-value">{{ datos.usuarios_nuevos_mes }}</span>
        <span class="kpi-sub text-muted">este mes</span>
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
      border: 1px solid #e2e8f0; 
      border-radius: 8px; 
      padding: 0.85rem; 
      background: #f8fafc; 
      transition: all 0.2s ease;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .kpi-label { font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 0.35rem; letter-spacing: 0.5px; }
    .kpi-value { font-size: 1.1rem; font-weight: 800; color: #1e293b; display: block; line-height: 1; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kpi-sub { font-size: 0.75rem; font-weight: 600; }
    .kpi-sub-v2 { font-size: 0.75rem; font-weight: 600; margin-top: 0.1rem; }
    .kpi-active-highlight { background: #ffffff; border-left: 4px solid #1e293b; }
    .kpi-warning { border-bottom: 3px solid #f59e0b; background: #fffbeb; }
    .kpi-danger { border-bottom: 3px solid #ef4444; background: #fef2f2; }
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

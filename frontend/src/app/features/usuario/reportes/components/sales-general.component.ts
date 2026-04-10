import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { SalesGeneralReport } from '../services/financial-reports.service';

@Component({
  selector: 'app-sales-general',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="fade-in">
      <!-- SUMMARY CARDS -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card glass indigo">
          <div class="kpi-info">
            <span class="label">Total General</span>
            <span class="value">{{ data.resumen.total_general | currency }}</span>
            <div class="trend" [class.up]="data.resumen.comparacion_anterior_porcentaje >= 0">
              <i class="bi bi-graph-up pe-1"></i>
              {{ data.resumen.comparacion_anterior_porcentaje }}% vs mes ant.
            </div>
          </div>
          <div class="kpi-icon"><i class="bi bi-cash-coin"></i></div>
        </div>

        <div class="kpi-card glass blue">
          <div class="kpi-info">
            <span class="label">Subtotal Sin IVA</span>
            <span class="value">{{ data.resumen.subtotal_0 | currency }}</span>
            <span class="subtext">Ventas exentas / 0%</span>
          </div>
        </div>

        <div class="kpi-card glass emerald">
          <div class="kpi-info">
            <span class="label">Total IVA Cobrado</span>
            <span class="value">{{ data.resumen.total_iva | currency }}</span>
            <span class="subtext">Impuestos recaudados</span>
          </div>
          <div class="kpi-icon"><i class="bi bi-percent"></i></div>
        </div>

        <div class="kpi-card glass amber">
          <div class="kpi-info">
            <span class="label">Ticket Promedio</span>
            <span class="value">{{ data.resumen.ticket_promedio | currency }}</span>
            <span class="subtext">Basado en {{ data.resumen.cantidad_facturas }} facturas</span>
          </div>
        </div>
      </div>

      <!-- VAT BREAKDOWN & CHART SECTION -->
      <div class="row g-4 mb-5">
        <div class="col-lg-7">
          <div class="section-card glass shadow-sm h-100">
            <div class="section-header">
              <h5>Desglose de Impuestos (SRI)</h5>
              <p>Resumen de bases imponibles y tarifas aplicadas</p>
            </div>
            
            <div class="vat-breakdown">
              <div class="vat-item">
                <div class="vat-info">
                  <span class="vat-label">IVA 15% (General)</span>
                  <span class="vat-base">Base: {{ data.resumen.subtotal_15 | currency }}</span>
                </div>
                <span class="vat-value">{{ data.resumen.iva_15 | currency }}</span>
              </div>
              <div class="vat-item">
                <div class="vat-info">
                  <span class="vat-label">IVA 8% (Turismo)</span>
                  <span class="vat-base">Base: {{ data.resumen.subtotal_8 | currency }}</span>
                </div>
                <span class="vat-value">{{ data.resumen.iva_8 | currency }}</span>
              </div>
              <div class="vat-item">
                <div class="vat-info">
                  <span class="vat-label">IVA 5% (Construcción)</span>
                  <span class="vat-base">Base: {{ data.resumen.subtotal_5 | currency }}</span>
                </div>
                <span class="vat-value">{{ data.resumen.iva_5 | currency }}</span>
              </div>
              <div class="vat-item total">
                <span class="vat-label">Total IVA</span>
                <span class="vat-value highlight">{{ data.resumen.total_iva | currency }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="section-card glass shadow-sm h-100 dark-gradient">
            <div class="section-header white">
              <h5>Distribución por Establecimiento</h5>
              <p>Peso porcentual de facturación por local</p>
            </div>
            <div class="chart-container-dummy">
              <div *ngFor="let est of data.graficos.por_establecimiento" class="est-bar-item">
                <div class="d-flex justify-content-between mb-1">
                  <span class="small">{{ est.label }}</span>
                  <span class="small font-bold">{{ est.value | currency }}</span>
                </div>
                <div class="progress-track dark">
                  <div class="progress-fill gold" [style.width.%]="(est.value / data.resumen.total_general) * 100"></div>
                </div>
              </div>
              <div *ngIf="!data.graficos.por_establecimiento.length" class="text-center py-4">
                 <p class="text-muted italic">No hay datos de establecimientos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- USER SALES TABLE (UPCOMING FEATURE INTEGRATION) -->
      <div class="section-card glass shadow-sm mb-4">
        <div class="section-header d-flex justify-content-between align-items-center">
          <div>
            <h5>Ventas Detalladas por Usuario</h5>
            <p>Rendimiento del equipo comercial y control de anulaciones</p>
          </div>
          <button class="btn-premium-sm"><i class="bi bi-download me-2"></i>Exportar Detalle</button>
        </div>
        
        <div class="table-responsive">
          <table class="table modern-table">
            <thead>
              <tr>
                <th>Usuario / Vendedor</th>
                <th>Facturas</th>
                <th>Anuladas</th>
                <th>Ticket Prom.</th>
                <th>Total Ventas</th>
                <th>Eficiencia</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of usersData" class="hover-row">
                <td class="font-medium text-primary">{{ user.usuario }}</td>
                <td>{{ user.facturas }}</td>
                <td><span class="text-danger" *ngIf="user.anuladas > 0">{{ user.anuladas }}</span><span *ngIf="user.anuladas === 0">0</span></td>
                <td>{{ user.ticket_promedio | currency }}</td>
                <td class="font-bold">{{ user.total_ventas | currency }}</td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="mini-progress"><div class="fill" [style.width.%]="75"></div></div>
                    <span class="small">Good</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!usersData?.length">
                <td colspan="6" class="text-center py-4 text-muted">Cargando datos de usuarios...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.5rem; }
    .glass {
      background: #ffffff; border: 1px solid #f1f5f9; border-radius: 24px; padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: transform 0.2s;
    }
    .glass:hover { transform: translateY(-3px); }
    .label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 0.5rem; }
    .value { font-size: 1.6rem; font-weight: 800; color: #0f172a; display: block; }
    .trend { font-size: 0.8rem; font-weight: 600; margin-top: 0.5rem; display: flex; align-items: center; }
    .trend.up { color: #10b981; }
    .subtext { font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; display: block; }
    .indigo { border-top: 4px solid #6366f1; }
    .blue { border-top: 4px solid #3b82f6; }
    .emerald { border-top: 4px solid #10b981; }
    .amber { border-top: 4px solid #f59e0b; }

    .kpi-icon {
      float: right; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
      background: #f8fafc; color: #334155; font-size: 1.2rem; margin-top: -3.5rem;
    }

    .section-card { padding: 1.75rem; border-radius: 24px; }
    .section-header h5 { font-weight: 800; color: #1e293b; margin-bottom: 0.25rem; }
    .section-header p { font-size: 0.85rem; color: #64748b; margin-bottom: 1.5rem; }
    .section-header.white h5, .section-header.white p { color: white; }

    .vat-breakdown { display: flex; flex-direction: column; gap: 1rem; }
    .vat-item { 
      display: flex; justify-content: space-between; align-items: center; 
      padding-bottom: 0.75rem; border-bottom: 1px dashed #e2e8f0;
    }
    .vat-item.total { border-bottom: none; padding-top: 0.5rem; }
    .vat-info { display: flex; flex-direction: column; }
    .vat-label { font-weight: 700; color: #334155; font-size: 0.9rem; }
    .vat-base { font-size: 0.75rem; color: #94a3b8; }
    .vat-value { font-weight: 800; color: #1e293b; font-size: 1.1rem; }
    .vat-value.highlight { color: #6366f1; font-size: 1.3rem; }

    .dark-gradient { background: linear-gradient(135deg, #1e293b, #334155); color: white; }
    .progress-track { height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; overflow: hidden; }
    .progress-track.dark { background: rgba(255,255,255,0.1); }
    .progress-fill.gold { height: 100%; background: #fbbf24; border-radius: 4px; }

    .modern-table thead th { background: #f8fafc; border: none; font-size: 0.7rem; text-transform: uppercase; color: #64748b; padding: 1rem; }
    .modern-table tbody td { border-bottom: 1px solid #f1f5f9; padding: 1.1rem 1rem; vertical-align: middle; }
    .hover-row:hover { background: #f8fafc; cursor: default; }

    .mini-progress { width: 60px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .mini-progress .fill { height: 100%; background: #10b981; }

    .btn-premium-sm {
      background: #1e293b; color: white; border: none; padding: 0.5rem 1rem; 
      border-radius: 10px; font-size: 0.8rem; font-weight: 600; transition: all 0.2s;
    }
    .btn-premium-sm:hover { background: #334155; transform: scale(1.05); }

    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SalesGeneralComponent {
  @Input() data!: SalesGeneralReport;
  @Input() usersData: any[] = [];
}

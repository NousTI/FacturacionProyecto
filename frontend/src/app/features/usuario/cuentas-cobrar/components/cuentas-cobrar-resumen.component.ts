import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuentasCobrarOverview } from '../../../../domain/models/cuentas-cobrar.model';
import { PieChartComponent, PieChartData } from '../../../../shared/components/pie-chart/pie-chart.component';
import { ChartCardComponent } from '../../../../shared/components/chart-card/chart-card.component';

@Component({
  selector: 'app-cuentas-cobrar-resumen',
  standalone: true,
  imports: [CommonModule, PieChartComponent, ChartCardComponent],
  template: `
    <div class="resumen-container" *ngIf="overview">
      <!-- KPIs -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-primary bg-gradient text-white">
            <small class="text-white-50 d-block mb-1">Total por Cobrar</small>
            <h3 class="fw-bold mb-0">{{ overview.resumen.total_por_cobrar | currency }}</h3>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-white">
            <small class="text-muted d-block mb-1">Vigente</small>
            <h4 class="fw-bold mb-0 text-success">{{ overview.resumen.vigente.monto | currency }}</h4>
            <span class="badge bg-success-subtle text-success rounded-pill mt-2">{{ overview.resumen.vigente.porcentaje }}%</span>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-white">
            <small class="text-muted d-block mb-1">Vencido 1-30 días</small>
            <h4 class="fw-bold mb-0 text-warning">{{ overview.resumen.vencido_1_30.monto | currency }}</h4>
            <span class="badge bg-warning-subtle text-warning rounded-pill mt-2">{{ overview.resumen.vencido_1_30.porcentaje }}%</span>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card p-3 rounded-4 shadow-sm border-0 h-100 bg-white">
            <small class="text-muted d-block mb-1">Vencido +30 días</small>
            <h4 class="fw-bold mb-0 text-danger">{{ (overview.resumen.vencido_31_60.monto + overview.resumen.vencido_60_mas.monto) | currency }}</h4>
            <span class="badge bg-danger-subtle text-danger rounded-pill mt-2">{{ (overview.resumen.vencido_31_60.porcentaje + overview.resumen.vencido_60_mas.porcentaje) | number:'1.0-2' }}%</span>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="row g-3 mb-4">
        <div class="col-lg-5">
          <app-pie-chart 
            title="Distribución por Antigüedad" 
            [data]="pieData">
          </app-pie-chart>
        </div>
        <div class="col-lg-7">
          <app-chart-card 
            title="TOP 10 CLIENTES CON MAYOR DEUDA" 
            [data]="barData"
            barColor="#6366f1"
            orientation="horizontal">
          </app-chart-card>
        </div>
      </div>

      <!-- Detail Table -->
      <div class="soft-card p-4 rounded-4 shadow-sm border-0 bg-white">
        <div class="table-responsive">
          <table class="table table-hover align-middle custom-table">
            <thead>
              <tr class="table-light">
                <th colspan="9" class="py-2 border-0 bg-light">
                   <span class="badge bg-light text-dark rounded-pill border">{{ overview.listado.length }} facturas</span> 
                   <span class="ms-2 text-muted fw-normal" style="font-size: 0.7rem;">LISTADO DETALLADO</span>
                </th>
              </tr>
              <tr>
                <th>Cliente</th>
                <th>N° Factura</th>
                <th>Emisión</th>
                <th>Vencimiento</th>
                <th class="text-end">Monto</th>
                <th class="text-end">Pagado</th>
                <th class="text-end">Saldo</th>
                <th class="text-center">Días Vencido</th>
                <th class="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of overview.listado">
                <td class="fw-medium">{{ item.cliente_nombre }}</td>
                <td><code class="text-primary">{{ item.numero_documento }}</code></td>
                <td>{{ item.fecha_emision | date:'shortDate' }}</td>
                <td>{{ item.fecha_vencimiento | date:'shortDate' }}</td>
                <td class="text-end">{{ item.monto_total | currency }}</td>
                <td class="text-end text-success">{{ item.monto_pagado | currency }}</td>
                <td class="text-end fw-bold">{{ item.saldo_pendiente | currency }}</td>
                <td class="text-center">
                  <span [class.text-danger]="item.dias_vencido > 0" [class.fw-bold]="item.dias_vencido > 0">
                    {{ item.dias_vencido }}
                  </span>
                </td>
                <td class="text-center">
                  <span class="badge rounded-pill" [ngClass]="{
                    'bg-warning-subtle text-warning': item.estado === 'pendiente',
                    'bg-danger-subtle text-danger': item.estado === 'vencido',
                    'bg-info-subtle text-info': item.estado === 'parcial'
                  }">
                    {{ item.estado | uppercase }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="overview.listado.length === 0">
                <td colspan="9" class="text-center py-5 text-muted">
                  No se encontraron facturas pendientes.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card { transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-5px); }
    .custom-table th { 
      background: #f8fafc; 
      color: #64748b; 
      font-weight: 600; 
      text-transform: uppercase; 
      font-size: 0.75rem; 
      letter-spacing: 0.025em;
    }
    .custom-table td { border-bottom-color: #f1f5f9; }
  `]
})
export class CuentasCobrarResumenComponent {
  @Input() overview: CuentasCobrarOverview | null = null;

  get pieData(): PieChartData[] {
    if (!this.overview) return [];
    
    const resumen = this.overview.resumen;
    const colorMap: { [key: string]: string } = {
      'Vigente': '#10b981',
      'Vencido 1-30': '#f59e0b',
      'Vencido 31-60': '#f97316',
      'Vencido > 60': '#ef4444'
    };

    // Construimos los datos del pie chart usando los porcentajes ya calculados por el backend
    return [
      { label: 'Vigente', value: Number(resumen.vigente.monto), percent: resumen.vigente.porcentaje, color: colorMap['Vigente'] },
      { label: 'Vencido 1-30', value: Number(resumen.vencido_1_30.monto), percent: resumen.vencido_1_30.porcentaje, color: colorMap['Vencido 1-30'] },
      { label: 'Vencido 31-60', value: Number(resumen.vencido_31_60.monto), percent: resumen.vencido_31_60.porcentaje, color: colorMap['Vencido 31-60'] },
      { label: 'Vencido > 60', value: Number(resumen.vencido_60_mas.monto), percent: resumen.vencido_60_mas.porcentaje, color: colorMap['Vencido > 60'] }
    ];
  }

  get barData() {
    if (!this.overview) return [];
    return this.overview.graficos.top_clientes_morosos;
  }
}

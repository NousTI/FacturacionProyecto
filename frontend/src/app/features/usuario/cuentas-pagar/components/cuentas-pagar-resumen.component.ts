import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuentasPagarOverview } from '../../../../domain/models/cuentas-pagar.model';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { PieChartComponent } from '../../../../shared/components/pie-chart/pie-chart.component';

@Component({
  selector: 'app-cuentas-pagar-resumen',
  standalone: true,
  imports: [CommonModule, StatCardComponent, PieChartComponent],
  template: `
    <div *ngIf="overview" class="animate-in">
      <!-- STATS -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <app-stat-card 
            title="Total por Pagar" 
            [value]="overview.resumen.total_por_pagar" 
            icon="bi bi-wallet2" 
            color="#6366f1"
            [isCurrency]="true">
          </app-stat-card>
        </div>
        <div class="col-md-4">
          <app-stat-card 
            title="Saldos Vigentes" 
            [value]="overview.resumen.vigente" 
            icon="bi bi-check-circle" 
            color="#10b981"
            [isCurrency]="true">
          </app-stat-card>
        </div>
        <div class="col-md-4">
          <app-stat-card 
            title="Saldos Vencidos" 
            [value]="overview.resumen.vencido" 
            icon="bi bi-exclamation-circle" 
            color="#ef4444"
            [isCurrency]="true">
          </app-stat-card>
        </div>
      </div>

      <div class="row g-4">
        <!-- TOP PROVEEDORES -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white border-0 py-3 px-4">
              <h6 class="mb-0 fw-bold">Compromisos por Proveedor</h6>
            </div>
            <div class="card-body px-0 pt-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light">
                    <tr>
                      <th class="px-4 border-0 small text-muted">Proveedor</th>
                      <th class="border-0 small text-muted text-center">Facturas</th>
                      <th class="border-0 small text-muted text-end">Pendiente</th>
                      <th class="px-4 border-0 small text-muted text-end">Próx. Vencimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of overview.por_proveedor">
                      <td class="px-4 border-0 fw-medium">{{ item.proveedor }}</td>
                      <td class="border-0 text-center">
                        <span class="badge bg-light text-dark rounded-pill">{{ item.facturas_pendientes }}</span>
                      </td>
                      <td class="border-0 text-end fw-bold text-corporate">{{ item.monto_total | currency }}</td>
                      <td class="px-4 border-0 text-end small text-muted">
                        {{ item.proximo_vencimiento ? (item.proximo_vencimiento | date:'dd/MM/yyyy') : '-' }}
                      </td>
                    </tr>
                    <tr *ngIf="overview.por_proveedor.length === 0">
                      <td colspan="4" class="text-center py-5 text-muted">No hay deudas registradas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- GRÁFICO DISTRIBUCIÓN -->
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white border-0 py-3 px-4 text-center">
                <h6 class="mb-0 fw-bold">Distribución de Pasivos</h6>
            </div>
            <div class="card-body d-flex align-items-center justify-content-center p-4">
                <app-pie-chart 
                  [data]="chartData" 
                  [colors]="['#10b981', '#ef4444']">
                </app-pie-chart>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CuentasPagarResumenComponent {
  @Input() overview: any;

  get chartData() {
    if (!this.overview || !this.overview.resumen) return [];
    
    const vigente = Number(this.overview.resumen.vigente) || 0;
    const vencido = Number(this.overview.resumen.vencido) || 0;
    const total = vigente + vencido;

    if (total === 0) return [];

    return [
      { 
        label: 'Vigente', 
        value: vigente, 
        percent: Math.round((vigente / total) * 100) 
      },
      { 
        label: 'Vencido', 
        value: vencido, 
        percent: Math.round((vencido / total) * 100) 
      }
    ];
  }
}

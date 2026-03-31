import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteGastosCategoria } from '../../../../domain/models/cuentas-pagar.model';
import { ChartCardComponent } from '../../../../shared/components/chart-card/chart-card.component';
import { HorizontalBarCardComponent } from '../../../../shared/components/horizontal-bar-card/horizontal-bar-card.component';

@Component({
  selector: 'app-gastos-categoria',
  standalone: true,
  imports: [CommonModule, ChartCardComponent, HorizontalBarCardComponent],
  template: `
    <div *ngIf="data" class="animate-in">
      <div class="row g-4">
        <!-- LISTADO POR CATEGORÍA -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white border-0 py-3 px-4">
              <h6 class="mb-0 fw-bold">Estructura de Gastos</h6>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0">
                      <thead class="bg-light">
                        <tr>
                          <th class="px-4 border-0 small text-muted">Categoría</th>
                          <th class="border-0 small text-muted text-end">Total</th>
                          <th class="border-0 small text-muted text-center">% Part.</th>
                          <th class="px-4 border-0 small text-muted text-end">Vs Mes Prev.</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of data.listado">
                          <td class="px-4 border-0 fw-medium text-corporate">{{ item.categoria }}</td>
                          <td class="border-0 text-end fw-bold">{{ item.total | currency }}</td>
                          <td class="border-0 text-center">
                            <div class="progress rounded-pill bg-light mx-auto" style="height: 6px; width: 60px;">
                                <div class="progress-bar bg-primary" role="progressbar" [style.width]="item.porcentaje + '%'"></div>
                            </div>
                            <span class="small fw-medium text-muted mt-1 d-block">{{ item.porcentaje }}%</span>
                          </td>
                          <td class="px-4 border-0 text-end">
                            <span [ngClass]="item.comparacion_mes_anterior > 0 ? 'text-danger' : 'text-success'" class="fw-medium small d-flex align-items-center justify-content-end">
                                <i [ngClass]="item.comparacion_mes_anterior > 0 ? 'bi bi-arrow-up-right me-1' : 'bi bi-arrow-down-right me-1'"></i>
                                {{ item.comparacion_mes_anterior | number:'1.1-1' }}%
                            </span>
                          </td>
                        </tr>
                        <tr *ngIf="data.listado.length === 0">
                            <td colspan="4" class="text-center py-5 text-muted">Aún no hay registros en este periodo</td>
                        </tr>
                      </tbody>
                    </table>
                </div>
            </div>
          </div>
        </div>

        <!-- GRÁFICO BARRA HORIZONTAL -->
        <div class="col-lg-5">
            <app-horizontal-bar-card 
                title="Distribución de Gastos" 
                [data]="barData">
            </app-horizontal-bar-card>
        </div>
      </div>
    </div>
  `
})
export class GastosCategoriaComponent {
  @Input() data: ReporteGastosCategoria | null = null;

  get barData() {
    if (!this.data) return [];
    return this.data.listado.map(item => ({
      label: item.categoria,
      value: item.total,
      percent: item.porcentaje
    }));
  }
}

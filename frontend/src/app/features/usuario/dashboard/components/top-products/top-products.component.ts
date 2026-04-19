import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { InfoTooltipComponent } from '../../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-top-products',
  standalone: true,
  imports: [CommonModule, InfoTooltipComponent],
  providers: [CurrencyPipe],
  template: `
    <div class="row g-3 mb-4">
      <div class="col-12">
        <div class="panel">
          <div class="panel-header">
            <span>
              <i class="bi bi-graph-up-arrow me-2"></i>Productos más vendidos
              <app-info-tooltip message="Los 3 productos con mayor recaudación total (precio × cantidad) en el periodo seleccionado."></app-info-tooltip>
            </span>
          </div>
          <div class="p-3">
            <div class="row" *ngIf="topProductos.length; else noProducts">
              <div *ngFor="let p of topProductos" class="col-12 mb-3">
                <div class="d-flex justify-content-between mb-1">
                  <span class="small fw-bold text-truncate" style="max-width: 150px;">{{ p.nombre }}</span>
                  <span class="small fw-bold text-dark">{{ p.total | currency:'USD':'symbol':'1.2-2' }}</span>
                </div>
                <div class="progress" style="height: 4px; background: var(--border-color);">
                  <div class="progress-bar" 
                       style="background: var(--status-success);"
                       [style.width.%]="((p.total || 0) / (topProductos[0]?.total || 1)) * 100"></div>
                </div>
                <div class="text-muted mt-1" style="font-size: 0.65rem;">{{ p.cantidad }} unidades vendidas</div>
              </div>
            </div>
            <ng-template #noProducts>
              <div class="text-center py-3 text-muted small">Aún no hay datos de ventas para este periodo.</div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      background: white;
      border: 1px solid #f1f5f9;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
    }
    .panel-header {
      padding: 0.9rem 1.25rem;
      font-size: 0.85rem;
      font-weight: 800;
      color: black;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `]
})
export class TopProductsComponent {
  @Input() topProductos: any[] = [];
}



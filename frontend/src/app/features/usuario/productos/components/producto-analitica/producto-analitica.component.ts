import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnaliticaMasVendidosComponent } from './tabs/analitica-mas-vendidos/analitica-mas-vendidos.component';
import { AnaliticaSinMovimientoComponent } from './tabs/analitica-sin-movimiento/analitica-sin-movimiento.component';
import { AnaliticaRentabilidadComponent } from './tabs/analitica-rentabilidad/analitica-rentabilidad.component';
import { AnaliticaInventarioComponent } from './tabs/analitica-inventario/analitica-inventario.component';

type Tab = 'mas-vendidos' | 'sin-movimiento' | 'rentabilidad' | 'inventario';

@Component({
    selector: 'app-producto-analitica',
    standalone: true,
    imports: [
        CommonModule,
        AnaliticaMasVendidosComponent,
        AnaliticaSinMovimientoComponent,
        AnaliticaRentabilidadComponent,
        AnaliticaInventarioComponent
    ],
    template: `
    <div class="analitica-wrap">
      <div class="tabs-bar">
        <button class="tab-btn" [class.active]="tab === 'mas-vendidos'" (click)="tab = 'mas-vendidos'">
          <i class="bi bi-star-fill"></i> Más Vendidos
        </button>
        <button class="tab-btn" [class.active]="tab === 'sin-movimiento'" (click)="tab = 'sin-movimiento'">
          <i class="bi bi-hourglass-bottom"></i> Sin Movimiento
        </button>
        <button class="tab-btn" [class.active]="tab === 'rentabilidad'" (click)="tab = 'rentabilidad'">
          <i class="bi bi-graph-up-arrow"></i> Rentabilidad
        </button>
        <button class="tab-btn" [class.active]="tab === 'inventario'" (click)="tab = 'inventario'">
          <i class="bi bi-box-seam"></i> Reporte de Inventario
        </button>
      </div>

      <div class="tab-body">
        <app-analitica-mas-vendidos *ngIf="tab === 'mas-vendidos'"></app-analitica-mas-vendidos>
        <app-analitica-sin-movimiento *ngIf="tab === 'sin-movimiento'"></app-analitica-sin-movimiento>
        <app-analitica-rentabilidad *ngIf="tab === 'rentabilidad'"></app-analitica-rentabilidad>
        <app-analitica-inventario *ngIf="tab === 'inventario'"></app-analitica-inventario>
      </div>
    </div>
    `,
    styles: [`
    .analitica-wrap {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      overflow: hidden;
    }
    .tabs-bar {
      display: flex;
      border-bottom: 1px solid #f1f5f9;
      background: #fafbfc;
      padding: 0 1.5rem;
    }
    .tab-btn {
      padding: 0.9rem 1.2rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: #94a3b8;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .tab-btn:hover  { color: #475569; }
    .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    .tab-body { padding: 1.5rem; }
    `]
})
export class ProductoAnaliticaComponent {
    tab: Tab = 'mas-vendidos';
}

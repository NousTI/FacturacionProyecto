import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Nota: En una fase posterior se podrían refactorizar los componentes internos de analítica
// por ahora mantenemos las importaciones existentes para no romper la funcionalidad.
import { AnaliticaMasVendidosComponent } from './producto-analitica/tabs/analitica-mas-vendidos/analitica-mas-vendidos.component';
import { AnaliticaSinMovimientoComponent } from './producto-analitica/tabs/analitica-sin-movimiento/analitica-sin-movimiento.component';
import { AnaliticaRentabilidadComponent } from './producto-analitica/tabs/analitica-rentabilidad/analitica-rentabilidad.component';
import { AnaliticaInventarioComponent } from './producto-analitica/tabs/analitica-inventario/analitica-inventario.component';

type Tab = 'mas-vendidos' | 'sin-movimiento' | 'rentabilidad' | 'inventario';

@Component({
  selector: 'app-productos-analitica',
  standalone: true,
  imports: [
    CommonModule,
    AnaliticaMasVendidosComponent,
    AnaliticaSinMovimientoComponent,
    AnaliticaRentabilidadComponent,
    AnaliticaInventarioComponent
  ],
  template: `
    <div class="analitica-editorial-container">
      <div class="analitica-sidebar">
        <div class="sidebar-header">
          <i class="bi bi-graph-up"></i>
          <span>Reportes Analíticos</span>
        </div>
        
        <nav class="sidebar-nav">
          <button class="nav-item" [class.active]="tab === 'mas-vendidos'" (click)="tab = 'mas-vendidos'">
            <i class="bi bi-star-fill"></i>
            <div class="nav-text">
              <span class="nav-title">Más Vendidos</span>
              <span class="nav-sub">Top de rotación</span>
            </div>
          </button>

          <button class="nav-item" [class.active]="tab === 'rentabilidad'" (click)="tab = 'rentabilidad'">
            <i class="bi bi-currency-dollar"></i>
            <div class="nav-text">
              <span class="nav-title">Rentabilidad</span>
              <span class="nav-sub">Márgenes y utilidad</span>
            </div>
          </button>

          <button class="nav-item" [class.active]="tab === 'sin-movimiento'" (click)="tab = 'sin-movimiento'">
            <i class="bi bi-clock-history"></i>
            <div class="nav-text">
              <span class="nav-title">Sin Movimiento</span>
              <span class="nav-sub">Stock estancado</span>
            </div>
          </button>

          <button class="nav-item" [class.active]="tab === 'inventario'" (click)="tab = 'inventario'">
            <i class="bi bi-archive-fill"></i>
            <div class="nav-text">
              <span class="nav-title">Inventario</span>
              <span class="nav-sub">Reporte de existencias</span>
            </div>
          </button>
        </nav>
      </div>

      <div class="analitica-content">
        <div class="content-body shadow-sm">
          <app-analitica-mas-vendidos *ngIf="tab === 'mas-vendidos'"></app-analitica-mas-vendidos>
          <app-analitica-sin-movimiento *ngIf="tab === 'sin-movimiento'"></app-analitica-sin-movimiento>
          <app-analitica-rentabilidad *ngIf="tab === 'rentabilidad'"></app-analitica-rentabilidad>
          <app-analitica-inventario *ngIf="tab === 'inventario'"></app-analitica-inventario>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analitica-editorial-container {
      display: grid; grid-template-columns: 280px 1fr; gap: 24px;
      min-height: 600px;
    }
    
    .analitica-sidebar {
      background: white; border-radius: 20px; border: 1px solid #f1f5f9;
      padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 1.5rem;
    }

    .sidebar-header {
      display: flex; align-items: center; gap: 0.75rem; padding: 0 0.5rem;
      font-weight: 800; color: #1e293b; font-size: 0.9rem;
    }
    .sidebar-header i { color: #3b82f6; font-size: 1.2rem; }

    .sidebar-nav { display: flex; flex-direction: column; gap: 0.5rem; }
    
    .nav-item {
      display: flex; align-items: center; gap: 1rem; padding: 1rem;
      border-radius: 14px; border: none; background: transparent; cursor: pointer;
      transition: all 0.2s; text-align: left;
    }
    .nav-item i { font-size: 1.25rem; color: #94a3b8; transition: all 0.2s; }
    .nav-text { display: flex; flex-direction: column; }
    .nav-title { font-weight: 700; color: #475569; font-size: 0.85rem; }
    .nav-sub { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }

    .nav-item:hover { background: #f8fafc; }
    .nav-item:hover i { color: #475569; }

    .nav-item.active { background: #eff6ff; }
    .nav-item.active i { color: #3b82f6; }
    .nav-item.active .nav-title { color: #1e293b; }
    .tab-item.active .nav-sub { color: #3b82f6; opacity: 0.8; }

    .analitica-content { display: flex; flex-direction: column; min-height: 0; }
    .content-body {
      background: white; border-radius: 20px; border: 1px solid #f1f5f9;
      flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
      padding: 2rem;
    }

    @media (max-width: 992px) {
      .analitica-editorial-container { grid-template-columns: 1fr; }
      .sidebar-nav { flex-direction: row; overflow-x: auto; padding-bottom: 0.5rem; }
      .nav-item { flex-shrink: 0; min-width: 200px; }
    }
  `]
})
export class ProductosAnaliticaComponent {
  tab: Tab = 'mas-vendidos';
}

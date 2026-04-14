import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteGlobal } from '../../../services/reportes.service';

@Component({
  selector: 'app-r031-graficas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row g-4 mb-4">
      <!-- Donut: rescate vs upgrade -->
      <div class="col-md-4">
        <div class="card-graf">
          <h6 class="graf-title">Zonas críticas</h6>
          <div class="donut-wrap">
            <div class="donut" [style.background]="donutGlobal()"></div>
            <div class="donut-legend">
              <span class="dot dot-danger"></span> Rescate ({{ datos.zona_rescate }})
              <span class="dot dot-warning ms-3"></span> Upgrade ({{ datos.zona_upgrade }})
            </div>
          </div>
        </div>
      </div>

      <!-- Top Vendedores -->
      <div class="col-md-4">
        <div class="card-graf">
          <h6 class="graf-title">Top vendedores por ingresos</h6>
          <div class="bar-chart">
            <div *ngFor="let v of datos.top_vendedores" class="bar-row">
              <span class="bar-label">{{ v.vendedor.split(' ')[0] }}</span>
              <div class="bar-track">
                <div class="bar-fill bg-primary" [style.width.%]="barPct(v.ingresos_generados, maxVendedorIngresos)"></div>
              </div>
              <span class="bar-val small fw-bold">{{ v.ingresos_generados | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Planes más vendidos -->
      <div class="col-md-4">
        <div class="card-graf">
          <h6 class="graf-title">Planes más vendidos</h6>
          <div class="bar-chart">
            <div *ngFor="let p of datos.planes_mas_vendidos" class="bar-row">
              <span class="bar-label">{{ p.plan }}</span>
              <div class="bar-track">
                <div class="bar-fill bg-success" [style.width.%]="barPct(p.ventas, maxPlanVentas)"></div>
              </div>
              <span class="bar-val small fw-bold">{{ p.ventas }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-graf { height: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .graf-title { font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 1.25rem; }
    
    /* Donut styles */
    .donut-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; height: calc(100% - 2rem); }
    .donut { 
        width: 130px; 
        height: 130px; 
        border-radius: 50%; 
        position: relative;
        mask: radial-gradient(circle, transparent 40%, black 41%);
        -webkit-mask: radial-gradient(circle, transparent 40%, black 41%);
    }
    .donut-legend { margin-top: 1.25rem; font-size: 0.8rem; font-weight: 600; color: #64748b; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot-danger { background: #ef4444; }
    .dot-warning { background: #f59e0b; }

    /* Bar styles */
    .bar-chart { display: flex; flex-direction: column; gap: 0.75rem; }
    .bar-row { display: flex; align-items: center; gap: 0.75rem; }
    .bar-label { width: 85px; font-size: 0.75rem; font-weight: 600; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-track { flex: 1; height: 1.25rem; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    .bar-val { width: 55px; text-align: right; color: #1e293b; }
    
    .bg-primary { background: #3b82f6 !important; }
    .bg-success { background: #10b981 !important; }
  `]
})
export class R031GraficasComponent {
  @Input() datos!: ReporteGlobal;

  get maxVendedorIngresos(): number {
    return Math.max(...(this.datos?.top_vendedores.map(v => v.ingresos_generados) ?? [1]));
  }

  get maxPlanVentas(): number {
    return Math.max(...(this.datos?.planes_mas_vendidos.map(p => p.ventas) ?? [1]));
  }

  barPct(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  donutGlobal(): string {
    const r = this.datos.zona_rescate;
    const u = this.datos.zona_upgrade;
    const total = r + u;
    if (total === 0) return '#f1f5f9';
    const rPct = (r / total) * 100;
    return `conic-gradient(#ef4444 0% ${rPct}%, #f59e0b ${rPct}% 100%)`;
  }
}

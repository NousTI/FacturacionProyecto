import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PieChartComponent, PieChartData } from '../../../../../../shared/components/pie-chart/pie-chart.component';
import { ReporteGlobal } from '../../../services/reportes.service';

@Component({
  selector: 'app-r031-graficas',
  standalone: true,
  imports: [CommonModule, PieChartComponent],
  template: `
    <div class="row g-4 mb-4">
      <!-- 1. Pie: Zonas Críticas -->
      <div class="col-md-4">
        <app-pie-chart 
            title="Zonas críticas" 
            [data]="dataZonas"
            [colors]="['#ef4444', '#f59e0b']">
        </app-pie-chart>
      </div>

      <!-- 2. Pie: Top Vendedores -->
      <div class="col-md-4">
        <app-pie-chart 
            title="Ingresos por Vendedor" 
            [data]="dataVendedores">
        </app-pie-chart>
      </div>

      <!-- 3. Pie: Planes más vendidos -->
      <div class="col-md-4">
        <app-pie-chart 
            title="Planes más vendidos" 
            [data]="dataPlanes"
            [colors]="['#3b82f6', '#10b981', '#6366f1', '#8b5cf6', '#ec4899']">
        </app-pie-chart>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class R031GraficasComponent {
  @Input() datos!: ReporteGlobal;

  get dataZonas(): PieChartData[] {
    const total = this.datos.zona_rescate + this.datos.zona_upgrade;
    if (total === 0) return [];
    return [
      { 
        label: 'Rescate', 
        value: this.datos.zona_rescate, 
        percent: Math.round((this.datos.zona_rescate / total) * 100) 
      },
      { 
        label: 'Upgrade', 
        value: this.datos.zona_upgrade, 
        percent: Math.round((this.datos.zona_upgrade / total) * 100) 
      }
    ];
  }

  get dataVendedores(): PieChartData[] {
    const total = this.datos.top_vendedores.reduce((acc, v) => acc + Number(v.ingresos_generados || 0), 0);
    if (total <= 0) return [];
    
    return this.datos.top_vendedores.map(v => {
      const val = Number(v.ingresos_generados || 0);
      return {
        label: v.vendedor.split(' ')[0],
        value: val,
        percent: Math.round((val / total) * 100)
      };
    });
  }

  get dataPlanes(): PieChartData[] {
    const total = this.datos.planes_mas_vendidos.reduce((acc, p) => acc + Number(p.ventas || 0), 0);
    if (total <= 0) return [];

    return this.datos.planes_mas_vendidos.map(p => {
      const val = Number(p.ventas || 0);
      return {
        label: p.plan,
        value: val,
        percent: Math.round((val / total) * 100)
      };
    });
  }
}

import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-r-033-graficas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row g-4 mb-4">
      <!-- Módulos Adopción (Pie Chart) -->
      <div class="col-md-6">
        <div class="card-graf">
          <h6 class="graf-title">Módulos más usados (%)</h6>
          <div class="chart-container-pie">
            <canvas #modulosChart></canvas>
          </div>
          <div class="chart-legend mt-2" *ngIf="modulos.length > 0">
             <div *ngFor="let m of modulos; let i = index" class="legend-item">
                <span class="dot" [style.background-color]="colors[i]"></span>
                <span class="label">{{ m.modulo }} ({{ m.empresas_usando }} empresas)</span>
             </div>
          </div>
        </div>
      </div>
      
      <!-- Usuarios (Pie Chart) -->
      <div class="col-md-6">
        <div class="card-graf">
          <h6 class="graf-title">Empresas con más usuarios</h6>
          <div class="chart-container-pie">
            <canvas #userChart></canvas>
          </div>
          <div class="chart-legend mt-2" *ngIf="topEmpresas.length > 0">
             <div *ngFor="let e of topEmpresas; let i = index" class="legend-item">
                <span class="dot" [style.background-color]="colors[i]"></span>
                <span class="label">{{ e.empresa | slice:0:15 }}... ({{ e.total_usuarios }})</span>
                <!-- <span class="label">{{ e.empresa | slice:0:15 }}... ({{ e.usuarios_activos }})</span> -->
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-graf { border: 1px solid #e2e8f0; border-radius: 6px; padding: 1.25rem; background: #ffffff; height: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .graf-title { font-size: 0.85rem; font-weight: 700; color: var(--primary-color); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; }
    
    .chart-container-pie { position: relative; height: 200px; width: 100%; display: flex; justify-content: center; }
    
    .chart-legend { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 1rem; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.65rem; color: #4b5563; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
  `]
})
export class R033GraficasComponent implements AfterViewInit, OnChanges {
  @Input() modulos: any[] = [];
  @Input() topEmpresas: any[] = [];
  
  @ViewChild('modulosChart') modulosChartRef!: ElementRef;
  @ViewChild('userChart') userChartRef!: ElementRef;
  
  chartModulos: Chart | null = null;
  chartUsers: Chart | null = null;
  
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1'];

  ngAfterViewInit() {
    console.log('R033Graficas: ngAfterViewInit - Datos recibidos:', { modulos: this.modulos?.length, empresas: this.topEmpresas?.length });
    // Pequeño timeout para asegurar que el DOM y el contenedor tengan dimensiones
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chartModulos && changes['modulos']) {
      console.log('R033Graficas: Actualizando gráfica de módulos');
      this.updateModulosChart();
    }
    if (this.chartUsers && changes['topEmpresas']) {
      console.log('R033Graficas: Actualizando gráfica de usuarios');
      this.updateUsersChart();
    }
  }

  private initCharts() {
    // Si ya existen, los destruimos para evitar duplicados al re-inicializar
    if (this.chartModulos) { this.chartModulos.destroy(); this.chartModulos = null; }
    if (this.chartUsers) { this.chartUsers.destroy(); this.chartUsers = null; }
    
    this.initModulosChart();
    this.initUsersChart();
  }

  private initModulosChart() {
    if (!this.modulosChartRef) {
      console.warn('R033Graficas: No se encontró el canvas de módulos');
      return;
    }
    const ctx = this.modulosChartRef.nativeElement.getContext('2d');
    this.chartModulos = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.modulos.map(m => m.modulo),
        datasets: [{
          data: this.modulos.map(m => m.empresas_usando || 0),
          backgroundColor: this.colors,
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: { enabled: true }
        }
      }
    });
    console.log('R033Graficas: Gráfica de módulos inicializada');
  }

  private initUsersChart() {
    if (!this.userChartRef) {
      console.warn('R033Graficas: No se encontró el canvas de usuarios');
      return;
    }
    const ctx = this.userChartRef.nativeElement.getContext('2d');
    this.chartUsers = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.topEmpresas.map(e => e.empresa),
        datasets: [{
          data: this.topEmpresas.map(e => e.total_usuarios),
          backgroundColor: this.colors,
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: { enabled: true }
        }
      }
    });
    console.log('R033Graficas: Gráfica de usuarios inicializada');
  }

  private updateModulosChart() {
    if (!this.chartModulos) return;
    this.chartModulos.data.labels = this.modulos.map(m => m.modulo);
    this.chartModulos.data.datasets[0].data = this.modulos.map(m => m.empresas_usando || 0);
    this.chartModulos.update();
  }

  private updateUsersChart() {
    if (!this.chartUsers) return;
    this.chartUsers.data.labels = this.topEmpresas.map(e => e.empresa);
    this.chartUsers.data.datasets[0].data = this.topEmpresas.map(e => e.total_usuarios);
    this.chartUsers.update();
  }
}

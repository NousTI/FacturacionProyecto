import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteFlujoCaja } from '../../../../domain/models/cuentas-pagar.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-flujo-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="data" class="animate-in">
        <!-- HEADER / FILTROS -->
        <div class="row g-3 mb-4">
            <div class="col-md-8">
                <div class="card border-0 shadow-sm rounded-4 h-100 p-4 d-flex flex-row align-items-center justify-content-between">
                    <div>
                        <h6 class="text-muted small fw-bold mb-1">SALDO NETO DEL PERIODO</h6>
                        <h3 [ngClass]="data.saldo_neto >= 0 ? 'text-success' : 'text-danger'" class="fw-bold mb-0">
                            {{ data.saldo_neto | currency }}
                        </h3>
                    </div>
                    <div class="text-end">
                        <div class="btn-group btn-group-sm rounded-pill p-1 bg-light border">
                            <button *ngFor="let opt of agrupaciones" 
                                    (click)="selectAgrupacion(opt.id)"
                                    [class.bg-white]="currentAgrup === opt.id"
                                    [class.shadow-sm]="currentAgrup === opt.id"
                                    class="btn border-0 py-1 px-3 rounded-pill small fw-medium transition-all">
                                {{ opt.label }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card border-0 shadow-sm rounded-4 h-100 p-4 bg-corporate text-white">
                    <h6 class="text-white-50 small fw-bold mb-1">FLUJO ACUMULADO FINAL</h6>
                    <h3 class="fw-bold mb-0">{{ data.datos[data.datos.length - 1]?.acumulado | currency }}</h3>
                </div>
            </div>
        </div>

        <div class="row g-4">
            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-4">
                    <div class="card-header bg-white border-0 py-3 px-4">
                        <h6 class="mb-0 fw-bold">Tendencia de Ingresos vs Egresos</h6>
                    </div>
                    <div class="card-body p-4">
                        <div style="height: 350px;">
                            <canvas #flujoChart></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-12">
                <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                          <thead class="bg-light">
                            <tr>
                              <th class="px-4 border-0 small text-muted">Período</th>
                              <th class="border-0 small text-muted text-end">Ingresos</th>
                              <th class="border-0 small text-muted text-end">Egresos</th>
                              <th class="border-0 small text-muted text-end">Saldo</th>
                              <th class="px-4 border-0 small text-muted text-end">Acumulado</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr *ngFor="let row of data.datos">
                              <td class="px-4 border-0 fw-medium">{{ formatPeriodo(row.periodo) }}</td>
                              <td class="border-0 text-end text-success fw-medium">+{{ row.ingresos | currency }}</td>
                              <td class="border-0 text-end text-danger fw-medium">-{{ row.egresos | currency }}</td>
                              <td class="border-0 text-end fw-bold" [ngClass]="row.saldo >= 0 ? 'text-success' : 'text-danger'">
                                {{ row.saldo >= 0 ? '+' : '' }}{{ row.saldo | currency }}
                              </td>
                              <td class="px-4 border-0 text-end fw-bold text-corporate">{{ row.acumulado | currency }}</td>
                            </tr>
                          </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `,
  styles: [`
    .bg-corporate { background: #161d35; }
    .text-corporate { color: #161d35; }
    .transition-all { transition: all 0.2s ease; }
  `]
})
export class FlujoCajaComponent implements AfterViewInit, OnChanges {
  @Input() data: ReporteFlujoCaja | null = null;
  @Output() agrupacionChange = new EventEmitter<string>();
  
  @ViewChild('flujoChart') chartCanvas!: ElementRef;
  private chart: Chart | null = null;

  currentAgrup = 'week';
  agrupaciones = [
    { id: 'day', label: 'Diario' },
    { id: 'week', label: 'Semanal' },
    { id: 'month', label: 'Mensual' }
  ];

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.chart) {
      this.updateChart();
    }
  }

  selectAgrupacion(id: string) {
    this.currentAgrup = id;
    this.agrupacionChange.emit(id);
  }

  formatPeriodo(p: string) {
    // Basic formatting for dates or week numbers
    return p;
  }

  private createChart() {
    if (!this.chartCanvas || !this.data) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: this.getChartData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: { line: { tension: 0.3 } },
        scales: {
          x: { grid: { display: false } },
          y: { 
            beginAtZero: true, 
            grid: { color: '#f1f5f9' },
            ticks: { 
              callback: (val) => `$${val}`
            }
          }
        },
        plugins: {
          legend: { position: 'top', align: 'end' as const },
          tooltip: {
            padding: 12,
            backgroundColor: '#1e293b',
            titleFont: { size: 14, weight: 'bold' }
          }
        }
      }
    });
  }

  private updateChart() {
    if (!this.chart || !this.data) return;
    this.chart.data = this.getChartData();
    this.chart.update();
  }

  private getChartData() {
    if (!this.data) return { labels: [], datasets: [] };

    return {
      labels: this.data.datos.map(d => this.formatPeriodo(d.periodo)),
      datasets: [
        {
          label: 'Ingresos',
          data: this.data.datos.map(d => d.ingresos),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          pointRadius: 4,
          borderWidth: 3
        },
        {
          label: 'Egresos',
          data: this.data.datos.map(d => d.egresos),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          pointRadius: 4,
          borderWidth: 3
        },
        {
            label: 'Acumulado',
            type: 'line' as const,
            data: this.data.datos.map(d => d.acumulado),
            borderColor: '#6366f1',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            borderWidth: 2,
            hidden: true // Start hidden to avoid clutter?
        }
      ]
    };
  }
}

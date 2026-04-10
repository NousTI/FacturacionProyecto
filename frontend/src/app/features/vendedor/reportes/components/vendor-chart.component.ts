import { Component, Input, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-vendor-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrapper">
      <div class="chart-header" *ngIf="title">
        <h4 class="chart-title">{{ title }}</h4>
        <p class="chart-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="canvas-container">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      background: white; border-radius: 24px; padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;
      height: 100%; display: flex; flex-direction: column;
    }
    .chart-header { margin-bottom: 1.5rem; }
    .chart-title { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0; }
    .chart-subtitle { font-size: 0.8rem; color: #64748b; margin-top: 0.25rem; }
    .canvas-container { position: relative; flex-grow: 1; min-height: 250px; }
  `]
})
export class VendorChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() type: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';
  @Input() data: any[] = [];
  @Input() labelKey: string = 'label';
  @Input() valueKey: string = 'value';
  @Input() colors: string[] = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  private chart: Chart | null = null;

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['data'] || changes['type']) && !changes['data'].firstChange) {
      this.initChart();
    }
  }

  private initChart() {
    if (!this.chartCanvas) return;
    if (this.chart) this.chart.destroy();

    const labels = this.data.map(item => item[this.labelKey]);
    const values = this.data.map(item => item[this.valueKey]);

    const config: any = {
      type: this.type,
      data: {
        labels: labels,
        datasets: [{
          label: this.title,
          data: values,
          backgroundColor: this.type === 'pie' || this.type === 'doughnut' ? this.colors : this.colors[0],
          borderColor: this.type === 'pie' || this.type === 'doughnut' ? '#fff' : this.colors[0],
          borderWidth: 2,
          borderRadius: this.type === 'bar' ? 8 : 0,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.type === 'pie' || this.type === 'doughnut',
            position: 'bottom',
            labels: { usePointStyle: true, font: { weight: '600', size: 11 } }
          },
          tooltip: {
            backgroundColor: '#1e293b', padding: 12, borderRadius: 12,
            titleFont: { size: 14, weight: '700' }, bodyFont: { size: 13 }
          }
        },
        scales: this.type === 'pie' || this.type === 'doughnut' ? {} : {
          y: { 
            beginAtZero: true, grid: { color: '#f1f5f9' },
            border: { display: false }, ticks: { color: '#94a3b8', font: { weight: '500' } }
          },
          x: { 
            grid: { display: false }, border: { display: false },
            ticks: { color: '#64748b', font: { weight: '600' } }
          }
        }
      }
    };

    this.chart = new Chart(this.chartCanvas.nativeElement, config);
  }
}

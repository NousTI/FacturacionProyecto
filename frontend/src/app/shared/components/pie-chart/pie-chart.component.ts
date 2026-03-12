import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PieChartData {
    label: string;
    value: number;
    percent: number;
    color?: string;
}

@Component({
    selector: 'app-pie-chart',
    template: `
    <div class="soft-card h-100 d-flex flex-column">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
        <div class="d-flex align-items-center gap-1">
          <h5 class="fw-bold mb-0 text-dark">{{ title }}</h5>
          <ng-content></ng-content>
        </div>
      </div>
      
      <div class="flex-grow-1 d-flex flex-column align-items-center justify-content-center">
        <div class="chart-container position-relative mb-4">
          <svg viewBox="0 0 100 100" class="pie-svg" style="width: 180px; height: 180px; transform: rotate(-90deg);">
            <ng-container *ngFor="let slice of slices; let i = index">
              <circle
                r="25"
                cx="50"
                cy="50"
                fill="transparent"
                [attr.stroke]="slice.color"
                stroke-width="50"
                [attr.stroke-dasharray]="slice.dashArray"
                [attr.stroke-dashoffset]="slice.dashOffset"
                class="pie-slice"
                (mouseenter)="activeLabel = slice.label"
                (mouseleave)="activeLabel = null"
              >
                <title>{{ slice.label }}: {{ slice.percent }}%</title>
              </circle>
            </ng-container>
          </svg>
          <div class="center-hole"></div>
        </div>

        <div class="legend w-100 mt-2">
            <div *ngFor="let item of data" class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                    <div class="color-dot rounded-circle" [style.background-color]="item.color"></div>
                    <span class="small text-muted fw-medium">{{ item.label }}</span>
                </div>
                <span class="small fw-bold text-dark">{{ item.percent }}%</span>
            </div>
        </div>

        <div *ngIf="data.length === 0" class="text-center text-muted py-5">
            <small>No hay datos disponibles</small>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .soft-card {
        min-height: 380px;
        padding: 1.5rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .pie-svg {
        overflow: visible;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
    }
    .pie-slice {
        transition: stroke-width 0.3s ease, opacity 0.3s ease;
        cursor: pointer;
    }
    .pie-slice:hover {
        stroke-width: 54;
        opacity: 0.9;
    }
    .center-hole {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 50%;
        z-index: 2;
    }
    .color-dot {
        width: 10px;
        height: 10px;
    }
  `],
    standalone: true,
    imports: [CommonModule]
})
export class PieChartComponent {
    @Input() title: string = '';
    @Input() data: PieChartData[] = [];
    activeLabel: string | null = null;

    get slices() {
        let cumulativePercent = 0;
        const radius = 25;
        const circumference = 2 * Math.PI * radius;
        
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9'];

        return this.data.map((item, index) => {
            const percent = item.percent;
            const dashArray = `${(percent / 100) * circumference} ${circumference}`;
            const dashOffset = - (cumulativePercent / 100) * circumference;
            
            cumulativePercent += percent;
            
            return {
                ...item,
                color: item.color || colors[index % colors.length],
                dashArray,
                dashOffset
            };
        });
    }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HorizontalBarData {
    label: string;
    value: number;
    percent: number;
    color?: string;
}

@Component({
    selector: 'app-horizontal-bar-card',
    template: `
    <div class="soft-card h-100 d-flex flex-column">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
        <h5 class="fw-bold mb-0 text-dark">{{ title }}</h5>
        <div class="dropdown">
          <button class="btn btn-sm btn-light rounded-pill px-3" type="button">
            Este mes <i class="bi bi-chevron-down ms-1"></i>
          </button>
        </div>
      </div>
      
      <div class="flex-grow-1 d-flex flex-column justify-content-center">
        <div *ngFor="let item of data" class="mb-4 last:mb-0">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="text-dark fw-medium small">{{ item.label }}</span>
            <span class="text-muted small fw-semibold">{{ item.percent }}%</span>
          </div>
          <div class="progress" style="height: 10px; background-color: #f1f5f9; border-radius: 999px;">
            <div class="progress-bar rounded-pill" 
                 role="progressbar" 
                 [style.width.%]="item.percent" 
                 [style.background-color]="item.color || barColor"
                 [attr.aria-valuenow]="item.percent" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
            </div>
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
        min-height: 320px;
        padding: 1.5rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .progress-bar {
        transition: width 1s ease-in-out;
    }
    .last\\:mb-0:last-child {
        margin-bottom: 0 !important;
    }
  `],
    standalone: true,
    imports: [CommonModule]
})
export class HorizontalBarCardComponent {
    @Input() title: string = '';
    @Input() barColor: string = '#3b82f6';
    @Input() data: HorizontalBarData[] = [];
}

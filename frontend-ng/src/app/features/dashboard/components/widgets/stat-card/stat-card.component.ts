import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="card border-0 h-100 p-4" 
      [style.background-color]="fullColor() ? '#4f46e5' : 'white'"
      [style.border-radius]="'24px'"
      [class.shadow-sm]="!fullColor()"
      [class.shadow-lg]="fullColor()"
    >
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div 
          class="icon-box rounded-3 d-flex align-items-center justify-content-center fs-4"
          [style.width.px]="40" [style.height.px]="40"
          [style.background-color]="fullColor() ? 'white' : '#f3f4f6'"
        >
          {{ icon() }}
        </div>
        <div 
          class="trend-badge rounded-pill px-2 py-1 fw-bold small"
          [style.background-color]="fullColor() ? '#a5b4fc' : (isPositive ? '#dcfce7' : '#fee2e2')"
          [style.color]="fullColor() ? '#1e1b4b' : (isPositive ? '#166534' : '#991b1b')"
        >
          {{ trend() }}
        </div>
      </div>
      
      <div [style.color]="fullColor() ? '#e0e7ff' : '#6b7280'" class="small mb-1">{{ title() }}</div>
      <div [style.color]="fullColor() ? 'white' : '#111827'" class="fs-2 fw-bold mb-1">{{ value() }}</div>
      <div [style.color]="fullColor() ? '#e0e7ff' : '#6b7280'" class="small">{{ subtext() }}</div>
    </div>
  `,
  styles: []
})
export class StatCardComponent {
  icon = input.required<string>();
  title = input.required<string>();
  value = input.required<string>();
  trend = input.required<string>();
  subtext = input<string>('');
  fullColor = input<boolean>(false);

  get isPositive() {
    return this.trend().startsWith('+');
  }
}

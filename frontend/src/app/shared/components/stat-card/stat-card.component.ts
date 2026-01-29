import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-stat-card',
    template: `
    <div class="soft-card h-100">
      <div class="d-flex justify-content-between align-items-start mb-3">
        <div class="icon-box" [style.background]="iconBg">
          <i [class]="'bi ' + icon" [style.color]="iconColor" style="font-size: 1.5rem;"></i>
        </div>
        <div *ngIf="trend !== undefined" class="trend-badge" [ngClass]="trend >= 0 ? 'trend-up' : 'trend-down'">
          {{ trend > 0 ? '+' : '' }}{{ trend }}%
        </div>
      </div>
      <div>
        <h3 class="stat-value mb-1">{{ value }}</h3>
        <p class="stat-label mb-0 text-uppercase">{{ title }}</p>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }
  `],
    standalone: true,
    imports: [CommonModule]
})
export class StatCardComponent {
    @Input() title: string = '';
    @Input() value: string | number = '';
    @Input() icon: string = 'bi-graph-up';
    @Input() iconBg: string = '#f1f5f9';
    @Input() iconColor: string = '#64748b';
    @Input() trend?: number;
}

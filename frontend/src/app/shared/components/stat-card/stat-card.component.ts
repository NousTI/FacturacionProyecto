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
        <p class="stat-label mb-0 text-uppercase d-flex align-items-center gap-1">
          {{ title }}<ng-content></ng-content>
        </p>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: block;
    }
    .soft-card {
      background: white;
      border-radius: 20px;
      padding: 1.25rem;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      transition: all 0.3s ease;
    }
    .soft-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    }
    .icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .stat-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .trend-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 8px;
    }
    .trend-up { background: #ecfdf5; color: #10b981; }
    .trend-down { background: #fef2f2; color: #ef4444; }
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

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartCardComponent } from '../../../../../shared/components/chart-card/chart-card.component';
import { PeriodSelectorComponent } from '../period-selector/period-selector.component';

@Component({
  selector: 'app-sales-trend-chart',
  standalone: true,
  imports: [CommonModule, ChartCardComponent, PeriodSelectorComponent],
  template: `
    <app-chart-card 
      class="sales-trend-premium"
      [title]="'Tendencia de Ventas (vs Anterior)'"
      [data]="data"
      [barColor]="premiumGradient">
      
      <!-- Actions Slot for Period Selector -->
      <app-period-selector 
        actions
        [selectedPeriod]="selectedPeriod" 
        (onPeriodChange)="onPeriodChange.emit($event)">
      </app-period-selector>
      
    </app-chart-card>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    
    .sales-trend-premium {
      display: block;
      height: 100%;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      background: var(--bg-main);
      /* Custom shadow for this premium component */
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03) !important;
    }

    :host ::ng-deep .soft-card {
      border: none !important;
      padding: 1.75rem !important;
    }
  `]
})
export class SalesTrendChartComponent {
  @Input() data: { label: string, value: number, value_prev?: number }[] = [];
  @Input() selectedPeriod: 'day' | 'week' | 'month' = 'month';
  @Output() onPeriodChange = new EventEmitter<'day' | 'week' | 'month'>();

  // The premium gradient requested
  premiumGradient = 'linear-gradient(180deg, #A855F7 0%, #6366F1 100%)';
}

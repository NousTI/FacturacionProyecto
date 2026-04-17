import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HorizontalBarCardComponent, HorizontalBarData } from '../../../../shared/components/horizontal-bar-card/horizontal-bar-card.component';
import { InfoTooltipComponent } from '../../../../shared/components/info-tooltip/info-tooltip.component';

@Component({
  selector: 'app-plan-distribution-chart',
  standalone: true,
  imports: [CommonModule, HorizontalBarCardComponent, InfoTooltipComponent],
  template: `
    <div class="h-100 chart-container-premium">
      <app-horizontal-bar-card
        title="Empresas por Plan"
        [barColor]="primaryColor"
        [data]="planData">
        <app-info-tooltip message="Cantidad de empresas distribuidas según su plan de suscripción actual."></app-info-tooltip>
      </app-horizontal-bar-card>
    </div>
  `,
  styles: [`
    :host { 
      display: block; 
      width: 100%;
      height: 100%;
    }
    
    .chart-container-premium {
      background: var(--bg-main, #ffffff);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;
      min-height: 400px;
      height: 400px;
    }
  `]
})
export class PlanDistributionChartComponent {
  @Input() data: HorizontalBarData[] = [];

  // Consuming semantic success color from styles.css
  primaryColor = 'var(--status-success)';

  get planData() {
    if (!this.data) return [];
    
    // Forzamos el uso de la variable CSS para asegurar consistencia
    return this.data.map((item) => ({
      ...item,
      color: this.primaryColor
    }));
  }
}

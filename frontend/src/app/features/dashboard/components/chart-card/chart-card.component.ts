import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chart-card',
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
      
      <!-- Chart Area -->
      <div class="chart-wrapper flex-grow-1 position-relative d-flex">
        <!-- Y-Axis (Left) -->
        <div class="y-axis d-flex flex-column justify-content-between text-muted pe-3" 
             style="font-size: 0.75rem; min-width: 40px; text-align: right; padding-bottom: 24px;"> <!-- Added padding bottom for alignment with plot area -->
           <span *ngFor="let tick of ticks">{{ tick }}</span>
        </div>

        <!-- Graph Content Column -->
        <div class="flex-grow-1 d-flex flex-column" style="min-width: 0;">
           
           <!-- Plot Area (Grid + Bars) -->
           <div class="plot-area flex-grow-1 position-relative w-100">
              <!-- Grid Lines -->
              <div class="grid-lines position-absolute w-100 h-100 d-flex flex-column justify-content-between" style="z-index: 0;">
                 <div *ngFor="let tick of ticks" class="border-bottom border-light w-100" style="height: 0px; border-color: #f1f5f9 !important;"></div>
              </div>

              <!-- Bars Container -->
              <div class="bars-container d-flex align-items-end justify-content-between h-100 w-100 px-2 position-relative" style="z-index: 1;">
                 <div *ngFor="let item of data" 
                      class="bar-wrapper d-flex flex-column align-items-center justify-content-end h-100" 
                      [style.width.%]="100 / data.length">
                      
                    <div class="bar rounded-pill w-50 position-relative group" 
                         [style.height.%]="getBarHeight(item.value)"
                         [style.background]="barColor"
                         [title]="item.label + ': ' + item.value">
                         
                         <!-- Tooltip -->
                         <div class="tooltip-val position-absolute start-50 translate-middle-x badge bg-dark text-white rounded-pill px-2 py-1"
                              style="bottom: 100%; margin-bottom: 5px; opacity: 0; transition: opacity 0.2s; white-space: nowrap;">
                            {{ item.value | number }}
                         </div>
                    </div>
                 </div>
              </div>
           </div>

           <!-- X-Axis Labels -->
           <div class="labels-container d-flex justify-content-between w-100 px-2 mt-2">
              <div *ngFor="let item of data" 
                   class="label-wrapper text-center d-flex justify-content-center"
                   [style.width.%]="100 / data.length">
                 <span class="text-muted text-truncate" style="font-size: 0.7rem;">
                    {{ item.label }}
                 </span>
              </div>
           </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .soft-card {
        min-height: 320px;
    }
    .bar {
      min-height: 4px;
      transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }
    .bar:hover {
        opacity: 0.9;
        transform: scaleY(1.02);
    }
    .bar:hover .tooltip-val {
        opacity: 1;
    }
    .y-axis span {
        transform: translateY(50%); /* Align center of text with line */
    }
    .y-axis span:first-child { transform: translateY(0); } /* Top value */
    .y-axis span:last-child { transform: translateY(100%); } /* Bottom 0 */
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ChartCardComponent {
  @Input() title: string = '';
  @Input() barColor: string = 'var(--primary-gradient)';
  @Input() data: { label: string, value: number }[] = [];

  get maxValue(): number {
    if (!this.data.length) return 100;
    const max = Math.max(...this.data.map(d => d.value));
    return this.calculateNiceMax(max);
  }

  get ticks(): string[] {
    const max = this.maxValue;
    const steps = 4; // 0, 1/4, 2/4, 3/4, 4/4
    const tickValues = [];
    for (let i = steps; i >= 0; i--) {
      const val = (max / steps) * i;
      tickValues.push(this.formatNumber(val));
    }
    return tickValues;
  }

  getBarHeight(value: number): number {
    return (value / this.maxValue) * 100;
  }

  private calculateNiceMax(maxValue: number): number {
    if (maxValue === 0) return 100;

    // Logic to find a "nice" number above maxValue
    // e.g., 311 -> 400, 85 -> 100, 120 -> 200

    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const normalized = maxValue / magnitude;

    let niceScalar;
    if (normalized <= 1.0) niceScalar = 1.0;
    else if (normalized <= 2.0) niceScalar = 2.0;
    else if (normalized <= 2.5) niceScalar = 2.5; // Optional: 250, 2500 etc.
    else if (normalized <= 5.0) niceScalar = 5.0;
    else niceScalar = 10.0;

    // If the calculated nice max is actually exactly the max (rare with floats), valid.
    // If it's smaller (shouldn't happen with the logic above), bump it.
    // But usually we want a bit of headroom.
    // The user example: 311 -> 400.
    // 311: mag=100. norm=3.11. > 2.5, <= 5.0 -> scalar=5.0 -> 500.
    // Wait, user wanted 400 for 311.
    // My previous "1-2-5" logic gives 500.
    // To get 400, we need to allow integer steps like 3, 4, etc.
    // Let's use the ceil logic: ceil(normalized) * magnitude.
    // 3.11 -> 4 -> 400.
    // 8.5 -> 9 -> 900.
    // 1.2 -> 2 -> 200.

    return Math.ceil(normalized) * magnitude;
  }

  private formatNumber(num: number): string {
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    // Remove decimals for clean look unless it's very small
    return Math.round(num).toString();
  }
}

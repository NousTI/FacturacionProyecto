import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chart-card',
  template: `
    <div class="soft-card h-100 d-flex flex-column" [class.horizontal]="orientation === 'horizontal'">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
        <div class="d-flex align-items-center gap-2">
          <div class="title-indicator" [style.background-color]="barColor"></div>
          <h5 class="fw-bold mb-0 text-dark">{{ title }}</h5>
          <ng-content></ng-content>
        </div>
      </div>
      
      <!-- Chart Area -->
      <div class="chart-wrapper flex-grow-1 position-relative d-flex w-100">
        <ng-container *ngIf="data && data.length > 0; else noData">
          
          <!-- VERTICAL MODE -->
          <ng-container *ngIf="orientation === 'vertical'">
            <div class="y-axis d-flex flex-column justify-content-between text-muted pe-3" 
                 style="font-size: 0.75rem; min-width: 40px; text-align: right; padding-bottom: 24px;">
               <span *ngFor="let tick of ticks">{{ tick }}</span>
            </div>

            <div class="flex-grow-1 d-flex flex-column" style="min-width: 0;">
               <div class="plot-area flex-grow-1 position-relative w-100">
                  <div class="grid-lines position-absolute w-100 h-100 d-flex flex-column justify-content-between" style="z-index: 0;">
                     <div *ngFor="let tick of ticks" class="border-bottom border-light w-100" style="height: 0px; border-color: #f1f5f9 !important;"></div>
                  </div>

                   <div class="bars-container d-flex align-items-end justify-content-between h-100 w-100 px-2 position-relative" style="z-index: 1;">
                      <div *ngFor="let item of data" 
                           class="bar-wrapper d-flex flex-column align-items-center justify-content-end h-100" 
                           [style.width.%]="100 / data.length">
                        <div class="bar rounded-pill w-50 position-relative group" 
                             [style.height.%]="getBarHeight(item.value)"
                             [style.background]="barColor"
                             [title]="item.label + ': ' + item.value">
                             <div class="tooltip-val position-absolute start-50 translate-middle-x badge bg-dark text-white rounded-pill px-2 py-1">
                                {{ item.value | currency }}
                             </div>
                        </div>
                      </div>
                   </div>
                </div>

                <div class="labels-container d-flex justify-content-between w-100 px-2 mt-2">
                   <div *ngFor="let item of data; let i = index" 
                        class="label-wrapper text-center d-flex justify-content-center"
                        [style.width.%]="100 / data.length">
                     <span class="text-muted text-truncate" style="font-size: 0.7rem;" *ngIf="shouldShowLabel(i)">
                        {{ item.label }}
                     </span>
                   </div>
                </div>
             </div>
          </ng-container>

          <!-- HORIZONTAL MODE (Better for long labels/names) -->
          <div *ngIf="orientation === 'horizontal'" class="horizontal-container w-100 d-flex flex-column gap-3 overflow-auto pe-2">
            <div *ngFor="let item of data; let i = index" class="horizontal-row d-flex flex-column gap-1">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="small fw-bold text-dark text-truncate pe-2">
                   <span class="text-muted me-1">#{{ i + 1 }}</span> {{ item.label }}
                </span>
                <span class="small fw-bold" [style.color]="barColor">{{ item.value | currency }}</span>
              </div>
              <div class="progress rounded-pill bg-light" style="height: 8px;">
                <div class="progress-bar rounded-pill animate-bar" 
                     [style.width.%]="getBarHeight(item.value)"
                     [style.background]="barColor">
                </div>
              </div>
            </div>
          </div>

        </ng-container>

        <ng-template #noData>
           <div class="w-100 d-flex flex-column align-items-center justify-content-center text-muted">
              <i class="bi bi-bar-chart fs-1 mb-2 opacity-25"></i>
              <p class="small fw-medium mb-0">No hay datos disponibles</p>
           </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .soft-card { min-height: 320px; padding: 1.5rem; transition: all 0.3s ease; }
    .title-indicator { width: 4px; height: 16px; border-radius: 2px; }
    .bar {
      min-height: 4px;
      transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }
    .bar:hover { opacity: 0.9; transform: scaleX(1.1); }
    .tooltip-val {
      bottom: 100%; margin-bottom: 5px; opacity: 0; 
      transition: opacity 0.2s; white-space: nowrap; z-index: 10;
      pointer-events: none;
    }
    .bar:hover .tooltip-val { opacity: 1; }
    .horizontal-container { scroll-behavior: smooth; }
    .animate-bar {
      transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .y-axis span { transform: translateY(50%); }
    .y-axis span:first-child { transform: translateY(0); }
    .y-axis span:last-child { transform: translateY(100%); }
    
    /* Animation for rows */
    .horizontal-row {
      animation: fadeInRight 0.5s ease-out forwards;
      opacity: 0;
    }
    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    /* Cascade effect */
    .horizontal-row:nth-child(1) { animation-delay: 0.1s; }
    .horizontal-row:nth-child(2) { animation-delay: 0.15s; }
    .horizontal-row:nth-child(3) { animation-delay: 0.2s; }
    .horizontal-row:nth-child(4) { animation-delay: 0.25s; }
    .horizontal-row:nth-child(5) { animation-delay: 0.3s; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class ChartCardComponent {
  @Input() title: string = '';
  @Input() barColor: string = '#6366f1';
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() data: { label: string, value: number, value_prev?: number }[] = [];

  shouldShowLabel(index: number): boolean {
    if (this.data.length <= 12) return true;
    // For many points (like 30 days), only show some labels
    const step = Math.ceil(this.data.length / 6); 
    return index % step === 0 || index === this.data.length - 1;
  }

  get maxValue(): number {
    if (!this.data.length) return 100;
    const maxCurrent = Math.max(...this.data.map(d => d.value));
    const maxPrev = Math.max(...this.data.map(d => d.value_prev || 0));
    const overallMax = Math.max(maxCurrent, maxPrev);
    return this.calculateNiceMax(overallMax);
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

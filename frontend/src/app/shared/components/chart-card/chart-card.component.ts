import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="soft-card h-100 d-flex flex-column" [class.horizontal]="orientation === 'horizontal'">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
        <div class="d-flex align-items-center gap-2">
          <div class="title-indicator" [style.background-color]="barColor"></div>
          <h5 class="fw-bold mb-0 text-dark">{{ title }}</h5>
          <ng-content select="[info]"></ng-content>
        </div>
        <div class="header-actions">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
      
      <!-- Chart Area -->
      <div class="chart-wrapper flex-grow-1 position-relative d-flex w-100">
        <ng-container *ngIf="data && data.length > 0; else noData">
          
          <!-- VERTICAL MODE (BARRAS O LÍNEAS) -->
          <ng-container *ngIf="orientation === 'vertical'">
            <div class="y-axis d-flex flex-column justify-content-between text-muted pe-3" 
                 style="font-size: 0.75rem; min-width: 40px; text-align: right; padding-bottom: 24px;">
               <span *ngFor="let tick of ticks">{{ tick }}</span>
            </div>

            <div class="flex-grow-1 d-flex flex-column" style="min-width: 0;">
               <div class="plot-area flex-grow-1 position-relative w-100">
                  <div class="grid-lines position-absolute w-100 h-100 d-flex flex-column justify-content-between" style="z-index: 0;">
                     <div *ngFor="let tick of ticks" class="border-bottom w-100" style="height: 0px; border-color: var(--border-color) !important;"></div>
                  </div>

                  <!-- BAR CHART -->
                  <div *ngIf="chartType === 'bar'" 
                       class="bars-container d-flex align-items-end justify-content-between h-100 w-100 px-2 position-relative" style="z-index: 1;">
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

                  <!-- LINE CHART -->
                  <div *ngIf="chartType === 'line'" class="line-container h-100 w-100 position-relative px-2" style="z-index: 1;">
                    <svg class="chart-svg w-100 h-100" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <!-- Fill area -->
                      <path [attr.d]="getAreaPath()" 
                            fill="var(--primary-color)" 
                            style="opacity: 0.1" />
                      <!-- Main Line -->
                      <path [attr.d]="getLinePath()" 
                            fill="none" 
                            [attr.stroke]="barColor" 
                            stroke-width="2" 
                            stroke-linecap="round" 
                            stroke-linejoin="round" />
                    </svg>
                    <!-- Points for tooltips -->
                    <div class="points-container position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-between" style="padding: 0 0.5rem;">
                       <div *ngFor="let item of data; let i = index" 
                            class="point-wrapper position-relative h-100" 
                            [style.width.%]="100 / data.length">
                          <div class="line-dot position-absolute" 
                               [style.top.%]="100 - getBarHeight(item.value)"
                               [style.left.%]="50"
                               style="transform: translate(-50%, -50%);"
                               [style.background]="barColor">
                               <div class="tooltip-val position-absolute start-50 translate-middle-x badge bg-dark text-white rounded-pill px-2 py-1">
                                  {{ item.value | currency }}
                               </div>
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

          <!-- HORIZONTAL MODE -->
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
    :host { display: block; height: 100%; overflow: hidden; }
    .soft-card { height: 100%; padding: 1.5rem; transition: all 0.3s ease; }
    .title-indicator { width: 4px; height: 16px; border-radius: 2px; }
    
    /* Bars */
    .bar {
      min-height: 4px;
      transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }
    .bar:hover { opacity: 0.9; transform: scaleX(1.1); }
    
    /* Tooltip */
    .tooltip-val {
      bottom: 100%; margin-bottom: 5px; opacity: 0; 
      transition: opacity 0.2s; white-space: nowrap; z-index: 10;
      pointer-events: none;
    }
    .bar:hover .tooltip-val, .line-dot:hover .tooltip-val { opacity: 1; }
    
    /* Line dots */
    .line-dot {
      width: 10px; height: 10px; border: 2px solid white; border-radius: 50%;
      transform: translate(0, -50%); cursor: pointer; z-index: 5;
      transition: transform 0.2s;
    }
    .line-dot:hover { transform: translate(0, -50%) scale(1.5); }

    .horizontal-container { scroll-behavior: smooth; }
    .animate-bar { transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .y-axis span { transform: translateY(50%); }
    .y-axis span:first-child { transform: translateY(0); }
    .y-axis span:last-child { transform: translateY(100%); }
    
    .horizontal-row {
      animation: fadeInRight 0.5s ease-out forwards; opacity: 0;
    }
    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .horizontal-row:nth-child(1) { animation-delay: 0.1s; }
  `]
})
export class ChartCardComponent {
  @Input() title: string = '';
  @Input() barColor: string = '#161d35';
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() chartType: 'bar' | 'line' = 'bar';
  @Input() data: { label: string, value: number, value_prev?: number }[] = [];

  shouldShowLabel(index: number): boolean {
    if (this.data.length <= 12) return true;
    const step = Math.ceil(this.data.length / 6); 
    return index % step === 0 || index === this.data.length - 1;
  }

  get maxValue(): number {
    if (!this.data || !this.data.length) return 100;
    const maxVal = Math.max(...this.data.map(d => d.value));
    return this.calculateNiceMax(maxVal);
  }

  get ticks(): string[] {
    const max = this.maxValue;
    const steps = 4;
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

  // SVG PATH LOGIC
  getLinePath(): string {
    if (!this.data || !this.data.length) return '';
    const points = this.data.map((item, i) => {
      const x = (i + 0.5) * (100 / this.data.length);
      const y = 100 - this.getBarHeight(item.value);
      return `${x},${y}`;
    });
    // Create a smooth curve or polyline. Let's use Move + line
    return 'M ' + points.join(' L ');
  }

  getAreaPath(): string {
    const linePath = this.getLinePath();
    if (!linePath) return '';
    const lastX = (this.data.length - 0.5) * (100 / this.data.length);
    const firstX = 0.5 * (100 / this.data.length);
    // Close the path to the bottom
    return `${linePath} L ${lastX},100 L ${firstX},100 Z`;
  }

  private calculateNiceMax(maxValue: number): number {
    if (maxValue === 0) return 100;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const normalized = maxValue / magnitude;
    return Math.ceil(normalized) * magnitude;
  }

  private formatNumber(num: number): string {
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return Math.round(num).toString();
  }
}

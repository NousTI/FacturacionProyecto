import { Component, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="info-tooltip-trigger"
          #trigger
          (mouseenter)="showTooltip()"
          (mouseleave)="hideTooltip()">
      <i [class]="'bi ' + icon + ' cursor-help'"></i>
      
      <!-- Tooltip Box (Fixed Portal) -->
      <div class="info-tooltip-box" 
           [class.visible]="isVisible"
           [class.flipped]="isFlipped"
           [style.top.px]="coords.top"
           [style.left.px]="coords.left">
        <div class="info-tooltip-content">
          {{ message }}
        </div>
        <div class="info-tooltip-arrow"></div>
      </div>
    </span>
  `,
  styles: [`
    .info-tooltip-trigger {
      display: inline-flex;
      align-items: center;
      margin-left: 4px;
      vertical-align: middle;
      font-family: var(--font-main);
    }

    .info-tooltip-box {
      position: fixed;
      width: 220px;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, transform 0.2s ease;
      z-index: 11000;
      transform: translateX(-50%) translateY(10px);
    }

    .info-tooltip-box.visible {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }

    .info-tooltip-box.flipped {
      transform: translateX(-50%) translateY(-10px);
    }
    .info-tooltip-box.flipped.visible {
      transform: translateX(-50%) translateY(0);
    }

    .info-tooltip-content {
      background: var(--primary-color);
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: var(--text-xs);
      font-weight: 500;
      line-height: 1.4;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .info-tooltip-arrow {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
    }

    /* Normal: Arrow at bottom, pointing down */
    .info-tooltip-box:not(.flipped) .info-tooltip-arrow {
      top: 100%;
      border-top: 6px solid var(--primary-color);
    }

    /* Flipped: Arrow at top, pointing up */
    .info-tooltip-box.flipped .info-tooltip-arrow {
      bottom: 100%;
      border-bottom: 6px solid var(--primary-color);
    }

    .cursor-help {
      cursor: help;
      font-size: 0.9rem;
      color: var(--text-muted);
      transition: all 0.2s;
    }
    
    .info-tooltip-trigger:hover .cursor-help {
      color: var(--primary-color);
      transform: scale(1.15);
    }
  `]
})
export class InfoTooltipComponent {
  @Input() message: string = '';
  @Input() icon: string = 'bi-info-circle';
  
  isVisible = false;
  isFlipped = false;
  coords = { top: 0, left: 0 };

  @ViewChild('trigger') triggerElement!: ElementRef;

  showTooltip() {
    const rect = this.triggerElement.nativeElement.getBoundingClientRect();
    const tooltipWidth = 220;
    const tooltipHeight = 60; // Estimated
    const margin = 12;

    // Default: Show above
    let top = rect.top - margin - tooltipHeight;
    this.isFlipped = false;

    // Flip logic: If hitting the top of viewport (navbar approx 80px)
    if (top < 85) {
      top = rect.bottom + margin;
      this.isFlipped = true;
    }

    this.coords = {
      top: top,
      left: rect.left + (rect.width / 2)
    };
    
    this.isVisible = true;
  }

  hideTooltip() {
    this.isVisible = false;
  }
}

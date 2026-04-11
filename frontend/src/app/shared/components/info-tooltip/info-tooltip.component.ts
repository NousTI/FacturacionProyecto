import { Component, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="info-tooltip-container"
          (mouseenter)="isVisible = true"
          (mouseleave)="isVisible = false">
      <i [class]="'bi ' + icon + ' text-muted cursor-help'"></i>
      
      <!-- Tooltip Box -->
      <div class="info-tooltip-box" [class.visible]="isVisible">
        <div class="info-tooltip-content">
          {{ message }}
        </div>
        <div class="info-tooltip-arrow"></div>
      </div>
    </span>
  `,
  styles: [`
    .info-tooltip-container {
      position: relative;
      display: inline-flex;
      align-items: center;
      margin-left: 4px;
      vertical-align: middle;
      z-index: 9999;
      font-family: var(--font-main);
    }

    .info-tooltip-box {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      width: 220px;
      margin-bottom: 10px;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10000;
    }

    .info-tooltip-box.visible {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }

    .info-tooltip-content {
      background: var(--primary-color);
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: var(--text-sm);
      font-weight: 500;
      line-height: 1.5;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .info-tooltip-arrow {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-top: 7px solid var(--primary-color);
    }

    .cursor-help {
      cursor: help;
      font-size: 0.95rem;
      color: var(--text-muted);
      transition: all 0.2s;
    }
    
    .info-tooltip-container:hover .cursor-help {
      color: var(--primary-color) !important;
      transform: scale(1.1);
    }
  `]
})
export class InfoTooltipComponent {
  @Input() message: string = '';
  @Input() icon: string = 'bi-info-circle';
  isVisible = false;
}

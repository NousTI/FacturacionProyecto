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
    }

    .info-tooltip-box {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      width: 200px;
      margin-bottom: 10px;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 10000;
    }

    .info-tooltip-box.visible {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
    }

    .info-tooltip-content {
      background: #1e293b;
      color: #f8fafc;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1.4;
      text-align: center;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .info-tooltip-arrow {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #1e293b;
    }

    .cursor-help {
      cursor: help;
      font-size: 0.9rem;
      transition: color 0.2s;
    }
    
    .info-tooltip-container:hover .cursor-help {
      color: #6366f1 !important;
    }
  `]
})
export class InfoTooltipComponent {
  @Input() message: string = '';
  @Input() icon: string = 'bi-info-circle';
  isVisible = false;
}

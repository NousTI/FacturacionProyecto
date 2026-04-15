import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="it-wrap"
          (mouseenter)="visible=true"
          (mouseleave)="visible=false">
      <i class="bi bi-info-circle-fill it-icon"></i>
      <div class="it-box" *ngIf="visible">
        <p class="it-title" *ngIf="label">{{ label }}</p>
        <span class="it-value">{{ text }}</span>
      </div>
    </span>
  `,
  styles: [`
    .it-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      margin-left: 4px;
      cursor: help;
    }

    .it-icon {
      color: #94a3b8;
      font-size: 0.8rem;
      transition: color 0.2s;
    }
    .it-wrap:hover .it-icon { color: #6366f1; }

    .it-box {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 10px;
      padding: 0.6rem 0.9rem;
      font-size: 0.75rem;
      z-index: 9999;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
      min-width: 220px;
      max-width: 320px;
      pointer-events: none;
      white-space: normal;
      line-height: 1.5;
    }

    .it-title {
      font-weight: 700;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin: 0 0 4px;
    }

    .it-value {
      color: #f1f5f9;
      font-weight: 500;
    }
  `]
})
export class InfoTooltipComponent {
  @Input() text: string = '';
  @Input() label: string = '';
  visible = false;
}

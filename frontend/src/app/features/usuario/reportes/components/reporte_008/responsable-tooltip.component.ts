import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-responsable-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="rt-wrap"
          (mouseenter)="visible=true"
          (mouseleave)="visible=false">
      <i class="bi bi-person-circle rt-icon"></i>
      <div class="rt-box" *ngIf="visible">
        <p class="rt-title">Responsable</p>
        <span class="rt-value">{{ responsable }}</span>
      </div>
    </span>
  `,
  styles: [`
    .rt-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      margin-left: 6px;
      cursor: help;
    }

    .rt-icon {
      color: #94a3b8;
      font-size: 0.8rem;
      transition: color 0.2s;
    }
    .rt-wrap:hover .rt-icon { color: #6366f1; }

    .rt-box {
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary-color);
      color: #e2e8f0;
      border-radius: 10px;
      padding: 0.6rem 0.9rem;
      font-size: 0.75rem;
      z-index: 9999;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
      min-width: 180px;
      pointer-events: none;
      white-space: nowrap;
    }

    .rt-title {
      font-weight: 700;
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin: 0 0 4px;
    }

    .rt-value {
      color: #f1f5f9;
      font-weight: 600;
    }
  `]
})
export class ResponsableTooltipComponent {
  @Input() responsable: string = '';
  visible = false;
}


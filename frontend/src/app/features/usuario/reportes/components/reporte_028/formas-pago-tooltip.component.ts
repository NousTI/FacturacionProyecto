import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-formas-pago-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="fp-wrap"
          (mouseenter)="visible=true"
          (mouseleave)="visible=false">
      <i class="bi bi-info-circle-fill fp-icon"></i>
      <div class="fp-box" *ngIf="visible">
        <p class="fp-title">{{ tooltipTitle }}</p>
        <div class="fp-row" *ngFor="let r of rows">
          <span class="fp-label">{{ r.label }}</span>
          <span class="fp-value">{{ r.value }}</span>
        </div>
      </div>
    </span>
  `,
  styles: [`
    .fp-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      margin-left: 4px;
      cursor: help;
    }
    .fp-icon { color: #f59e0b; font-size: 0.75rem; }

    .fp-box {
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary-color);
      color: #e2e8f0;
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      z-index: 1000;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
      min-width: 260px;
      pointer-events: none;
    }

    .fp-title {
      font-weight: 700;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #f8fafc;
      margin: 0 0 6px;
      padding-bottom: 5px;
      border-bottom: 1px solid rgba(255,255,255,0.15);
    }

    .fp-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .fp-row:last-child { border-bottom: none; }

    .fp-label { color: #cbd5e1; font-weight: 500; }
    .fp-value { color: #f59e0b; font-weight: 700; margin-left: 8px; white-space: nowrap; }
  `]
})
export class FormasPagoTooltipComponent {
  @Input() rows: Array<{ label: string; value: string }> = [];
  @Input() tooltipTitle: string = 'Desglose formas de pago';
  visible = false;
}


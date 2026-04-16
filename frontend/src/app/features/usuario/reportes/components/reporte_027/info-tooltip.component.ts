import { Component, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="it-wrap"
          (mouseenter)="show($event)"
          (mouseleave)="hide()">
      <i class="bi bi-info-circle-fill it-icon"></i>
    </span>

    <!-- Portal: fixed al body, siempre encima de todo -->
    <div class="it-portal" *ngIf="visible"
         [style.top.px]="top"
         [style.left.px]="left">
      <p class="it-title" *ngIf="label">{{ label }}</p>
      <span class="it-value">{{ text }}</span>
    </div>
  `,
  styles: [`
    .it-wrap {
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

    .it-portal {
      position: fixed;
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 10px;
      padding: 0.6rem 0.9rem;
      font-size: 0.75rem;
      z-index: 99999;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
      min-width: 220px;
      max-width: 320px;
      pointer-events: none;
      white-space: normal;
      line-height: 1.5;
      transform: translateY(-100%);
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
  top = 0;
  left = 0;

  constructor(private el: ElementRef) {}

  show(event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const tooltipWidth = 320;
    const margin = 8;
    const vpWidth = window.innerWidth;

    // Centrado ideal
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    // Evitar salida por la derecha
    if (left + tooltipWidth + margin > vpWidth) {
      left = vpWidth - tooltipWidth - margin;
    }
    // Evitar salida por la izquierda
    if (left < margin) {
      left = margin;
    }

    this.top  = rect.top - 8;
    this.left = left;
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }
}

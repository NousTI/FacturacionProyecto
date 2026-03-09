import { Component, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="info-tooltip-wrapper"
          (mouseenter)="show($event)"
          (mouseleave)="hide()"
          (mousemove)="updatePos($event)">
      <i [class]="'bi ' + icon + ' text-muted'"></i>
    </span>

    <!-- Portal al body via position:fixed -->
    <div class="info-tooltip-box"
         [class.visible]="isVisible"
         [style.top.px]="tooltipY"
         [style.left.px]="tooltipX">
      {{ message }}
      <div class="info-tooltip-arrow"></div>
    </div>
  `,
  styles: [`
    .info-tooltip-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      cursor: help;
      margin-left: 2px;
      line-height: 1;
    }

    .info-tooltip-box {
      position: fixed;
      width: 230px;
      background: #1e293b;
      color: #fff;
      text-align: center;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 0.72rem;
      font-weight: 500;
      line-height: 1.5;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12);
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transform: translateY(4px);
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
      z-index: 99999;
    }

    .info-tooltip-box.visible {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .info-tooltip-arrow {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-width: 5px;
      border-style: solid;
      border-color: #1e293b transparent transparent transparent;
    }
  `]
})
export class InfoTooltipComponent {
  @Input() message: string = '';
  @Input() icon: string = 'bi-info-circle';

  isVisible = false;
  tooltipX = 0;
  tooltipY = 0;

  private readonly TOOLTIP_WIDTH = 230;
  private readonly TOOLTIP_HEIGHT = 60; // aprox
  private readonly OFFSET = 12;

  show(event: MouseEvent) {
    this.isVisible = true;
    this.calculatePosition(event);
  }

  hide() {
    this.isVisible = false;
  }

  updatePos(event: MouseEvent) {
    if (this.isVisible) {
      this.calculatePosition(event);
    }
  }

  private calculatePosition(event: MouseEvent) {
    const iconEl = event.currentTarget as HTMLElement;
    const rect = iconEl.getBoundingClientRect();

    // Centro del icono, encima de él
    let x = rect.left + rect.width / 2 - this.TOOLTIP_WIDTH / 2;
    let y = rect.top - this.TOOLTIP_HEIGHT - this.OFFSET;

    // Evitar que salga por la izquierda
    if (x < 8) x = 8;
    // Evitar que salga por la derecha
    if (x + this.TOOLTIP_WIDTH > window.innerWidth - 8) {
      x = window.innerWidth - this.TOOLTIP_WIDTH - 8;
    }
    // Si no hay espacio arriba, mostrarlo abajo
    if (y < 8) {
      y = rect.bottom + this.OFFSET;
    }

    this.tooltipX = x;
    this.tooltipY = y;
  }
}
